import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Settings, User, Mail, Shield, Bell, Palette, Save, AlertCircle, Lock, Camera, CheckCircle, X, Minus, Plus, Trash2, AtSign } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { updateProfileInfo, changePassword, uploadAvatar, deleteUserAvatar } from '../services/api';

// Helper to create the cropped image
const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (error) => reject(error));
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg');
  });
};

export const SettingsPage = () => {
  const { user, setUser } = useAuth();
  const { theme, setTheme, font, setFont } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Profile State initialized from user context
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    handle: user?.handle || '',
    avatar_color: user?.avatar_color || '#3e8488ff',
    avatar_url: user?.avatar_url || ''
  });

  // Sync profileData when user context loads/updates
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        handle: user.handle || '',
        avatar_color: user.avatar_color || '#3e8488ff',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user]);

  // Password State
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Cropper State
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const fileInputRef = useRef(null);

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImage(reader.result);
        setShowCropper(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      // In our backend, updateProfileInfo now supports Name, Email, Avatar Color, and Handle
      const resp = await updateProfileInfo({
        ...profileData,
        handle: profileData.handle || null
      });
      
      if (resp.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setUser({ ...user, ...resp.user });
        setProfileData({ ...profileData, ...resp.user });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Update failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setMessage({ type: 'error', text: 'Passwords do not match' });
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Change password failed' });
    } finally {
      setLoading(false);
    }
  };

  const uploadCroppedImage = async () => {
    try {
      setLoading(true);
      const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);
      const formData = new FormData();
      formData.append('avatar', croppedImageBlob, 'avatar.jpg');

      const resp = await uploadAvatar(formData);
      if (resp.success) {
        setProfileData({ ...profileData, avatar_url: resp.avatar_url });
        setUser({ ...user, avatar_url: resp.avatar_url });
        setMessage({ type: 'success', text: 'Avatar updated!' });
        setShowCropper(false);
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Upload failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm('Are you sure you want to delete your profile picture?')) return;
    setLoading(true);
    try {
      const resp = await deleteUserAvatar();
      if (resp.success) {
        setProfileData({ ...profileData, avatar_url: '' });
        setUser({ ...user, avatar_url: null });
        setMessage({ type: 'success', text: 'Photo deleted' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Deletion failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px' }}>
          <Settings size={32} style={{ color: 'var(--accent-cyan)' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Account Settings</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your profile information and security</p>
        </div>
      </div>

      {message.text && (
        <div style={{ 
          padding: '16px 20px', 
          borderRadius: '12px', 
          background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
          color: message.type === 'error' ? 'var(--accent-red)' : 'var(--accent-green)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '24px',
          border: '1px solid currentColor',
          fontSize: '0.95rem'
        }}>
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '32px' }}>
        {/* Sidebar Mini */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
           {[
             { id: 'profile', icon: <User size={18} />, label: 'Public Profile' },
             { id: 'security', icon: <Lock size={18} />, label: 'Security' },
             { id: 'appearance', icon: <Palette size={18} />, label: 'Appearance' },
             { id: 'notifications', icon: <Bell size={18} />, label: 'Notifications' }
           ].map(tab => (
             <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMessage({ type: '', text: '' }); }}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '14px 16px', 
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.08)' : 'none', 
                  border: 'none', 
                  borderRadius: '12px', 
                  color: activeTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)', 
                  cursor: 'pointer', 
                  textAlign: 'left', 
                  width: '100%',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  transition: 'all 0.2s'
                }}
             >
                {tab.icon} {tab.label}
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="glass-panel" style={{ padding: '32px', border: '1px solid var(--border-light)' }}>
           
           {activeTab === 'profile' && (
              <div className="page-fade-in">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px', color: 'var(--text-main)' }}>Profile Picture</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                   <div style={{ position: 'relative' }}>
                     <div style={{ 
                       width: '100px', 
                       height: '100px', 
                       borderRadius: '50%', 
                       overflow: 'hidden', 
                       border: '3px solid var(--border-light)',
                       background: profileData.avatar_color || `linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))`
                     }}>
                        {profileData.avatar_url ? (
                          <img src={profileData.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>
                            {(profileData.name || 'U').charAt(0)}
                          </div>
                        )}
                     </div>
                     <button 
                      onClick={() => fileInputRef.current.click()}
                      style={{ position: 'absolute', bottom: 0, right: 0, padding: '8px', background: 'var(--accent-cyan)', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
                      title="Upload new photo"
                     >
                       <Camera size={14} />
                     </button>
                     <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                   </div>
                   <div style={{ flex: 1 }}>
                     <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Profile Photo</div>
                     <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>JPG, PNG or WebP. Max 5MB.</div>
                     
                     {profileData.avatar_url && (
                        <button 
                          onClick={handleDeleteAvatar}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                           <Trash2 size={14} /> Delete photo
                        </button>
                     )}
                   </div>
                </div>

                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Full Name</label>
                      <div style={{ position: 'relative' }}>
                        <User size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                        <input 
                          type="text" 
                          className="glass-panel" 
                          style={{ width: '100%', padding: '12px 12px 12px 40px', outline: 'none', border: '1px solid var(--border-light)', color: 'var(--text-main)' }} 
                          value={profileData.name}
                          onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Username (Ping Handle)</label>
                      <div style={{ position: 'relative' }}>
                        <AtSign size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                        <input 
                          type="text" 
                          className="glass-panel" 
                          placeholder="yourname"
                          style={{ width: '100%', padding: '12px 12px 12px 40px', outline: 'none', border: '1px solid var(--border-light)', color: 'var(--text-main)' }} 
                          value={profileData.handle}
                          onChange={(e) => setProfileData({...profileData, handle: e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()})}
                        />
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Used for @mentions in comments</p>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                      <input 
                        type="email" 
                        className="glass-panel" 
                        style={{ width: '100%', padding: '12px 12px 12px 40px', outline: 'none', border: '1px solid var(--border-light)', color: 'var(--text-main)' }} 
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', padding: '12px 30px' }}>
                    <Save size={18} /> Save Changes
                  </button>
                </form>
              </div>
           )}

           {activeTab === 'security' && (
              <div className="page-fade-in">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px', color: 'var(--text-main)' }}>Change Password</h3>
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Current Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                      <input 
                        type="password" 
                        className="glass-panel" 
                        required
                        style={{ width: '100%', padding: '12px 12px 12px 40px', outline: 'none', border: '1px solid var(--border-light)', color: 'var(--text-main)' }} 
                        placeholder="••••••••"
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                      />
                    </div>
                  </div>

                  <div style={{ height: '1px', background: 'var(--border-light)', margin: '10px 0' }}></div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <Shield size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                      <input 
                        type="password" 
                        className="glass-panel" 
                        required
                        style={{ width: '100%', padding: '12px 12px 12px 40px', outline: 'none', border: '1px solid var(--border-light)', color: 'var(--text-main)' }} 
                        placeholder="••••••••"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Confirm New Password</label>
                    <div style={{ position: 'relative' }}>
                      <Shield size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                      <input 
                        type="password" 
                        className="glass-panel" 
                        required
                        style={{ width: '100%', padding: '12px 12px 12px 40px', outline: 'none', border: '1px solid var(--border-light)', color: 'var(--text-main)' }} 
                        placeholder="••••••••"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', padding: '12px 30px' }}>
                    Update Password
                  </button>
                </form>
              </div>
           )}

           {activeTab === 'appearance' && (
              <div className="page-fade-in">
                 <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px', color: 'var(--text-main)' }}>Interface Theme</h3>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '40px' }}>
                    {[
                      { id: 'dark', name: 'Dark Space', desc: 'Classic deep space vibe', colors: ['#0f1115', '#00f2fe', '#8e2de2'] },
                      { id: 'indigo', name: 'Indigo Fusion', desc: 'Rich indigo & purple', colors: ['#0f0c29', '#8e2de2', '#4facfe'] },
                      { id: 'midnight', name: 'Midnight Noir', desc: 'Pure OLED black', colors: ['#000000', '#00d2ff', '#1a1a1a'] },
                      { id: 'light', name: 'Light Glass', desc: 'Clean frosted daylight', colors: ['#f8fafc', '#0891b2', '#2563eb'] }
                    ].map(t => (
                      <button 
                        key={t.id}
                        onClick={async () => {
                          setTheme(t.id);
                          try {
                            const resp = await updateProfileInfo({ ...profileData, theme: t.id });
                            if (resp.success) setUser({ ...user, ...resp.user });
                          } catch (err) { console.error('Auto-save theme failed', err); }
                        }}
                        style={{ 
                          textAlign: 'left',
                          padding: '16px',
                          background: theme === t.id ? 'var(--bg-panel-hover)' : 'rgba(255,255,255,0.02)',
                          border: `2px solid ${theme === t.id ? 'var(--accent-cyan)' : 'var(--border-light)'}`,
                          borderRadius: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden',
                          transform: theme === t.id ? 'scale(1.02)' : 'scale(1)'
                        }}
                      >
                         <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            {t.colors.map((c, i) => (
                              <div key={i} style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: '1px solid rgba(255,255,255,0.1)' }}></div>
                            ))}
                         </div>
                         <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>{t.name}</div>
                         <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.desc}</div>
                         
                         {theme === t.id && (
                           <div style={{ position: 'absolute', top: '12px', right: '12px', width: '24px', height: '24px', background: 'var(--accent-cyan)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                             <CheckCircle size={14} />
                           </div>
                         )}
                      </button>
                    ))}
                 </div>

                 <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px', color: 'var(--text-main)' }}>Typography</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { id: 'Inter', name: 'Inter (Sans)', desc: 'Modern & high legibility' },
                      { id: 'Outfit', name: 'Outfit (Geometric)', desc: 'Friendly & elegant look' },
                      { id: 'Roboto Mono', name: 'Roboto Mono', desc: 'Code-inspired mono style' }
                    ].map(f => (
                      <button 
                        key={f.id}
                        onClick={async () => {
                          setFont(f.id);
                          try {
                            const resp = await updateProfileInfo({ ...profileData, font: f.id });
                            if (resp.success) setUser({ ...user, ...resp.user });
                          } catch (err) { console.error('Auto-save font failed', err); }
                        }}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px 20px',
                          background: font === f.id ? 'var(--bg-panel-hover)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${font === f.id ? 'var(--accent-cyan)' : 'var(--border-light)'}`,
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontFamily: f.id
                        }}
                      >
                        <div style={{ textAlign: 'left' }}>
                           <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem' }}>{f.name}</div>
                           <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{f.desc}</div>
                        </div>
                        {font === f.id && <CheckCircle size={18} style={{ color: 'var(--accent-cyan)' }} />}
                      </button>
                    ))}
                 </div>
              </div>
           )}
        </div>
      </div>

      {/* Cropper Modal */}
      {showCropper && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
           <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', height: '600px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
                 <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Crop Photo</h3>
                 <button onClick={() => setShowCropper(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              
              <div style={{ flex: 1, position: 'relative', background: '#000' }}>
                 <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                 />
              </div>

              <div style={{ padding: '24px', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--bg-panel)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Minus size={16} style={{ color: 'var(--text-muted)' }} />
                    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input 
                        type="range" 
                        min={1} 
                        max={3} 
                        step={0.1} 
                        value={zoom} 
                        onChange={(e) => setZoom(e.target.value)} 
                        style={{ 
                          width: '100%',
                          height: '4px',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '2px',
                          appearance: 'none',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                        className="zoom-slider"
                      />
                      <style>{`
                        .zoom-slider::-webkit-slider-thumb {
                          appearance: none;
                          width: 18px;
                          height: 18px;
                          background: var(--accent-cyan);
                          border-radius: 50%;
                          box-shadow: 0 0 10px rgba(0, 242, 254, 0.4);
                          border: 2px solid #fff;
                          cursor: grab;
                        }
                        .zoom-slider::-webkit-slider-thumb:active {
                          cursor: grabbing;
                          transform: scale(1.1);
                        }
                      `}</style>
                    </div>
                    <Plus size={16} style={{ color: 'var(--text-muted)' }} />
                 </div>
                 
                 <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setShowCropper(false)} className="btn btn-secondary" style={{ flex: 1, padding: '12px', border: '1px solid var(--border-light)', background: 'transparent' }}>Cancel</button>
                    <button onClick={uploadCroppedImage} className="btn btn-primary" style={{ flex: 1, padding: '12px', background: 'var(--accent-cyan)', color: '#000', fontWeight: 700 }}>
                       {loading ? 'Uploading...' : 'Apply'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
