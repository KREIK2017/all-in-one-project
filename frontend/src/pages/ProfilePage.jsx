import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User as UserIcon, Mail, Calendar, CheckCircle, Clock, Briefcase, Award, AtSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserProfileEx } from '../services/api';

export const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const targetId = id || currentUser?.id;
    if (targetId) {
      getUserProfileEx(targetId)
        .then(data => {
          setProfile(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id, currentUser]);

  if (loading) return <div className="page-fade-in" style={{ padding: '40px', textAlign: 'center' }}>Loading profile...</div>;
  if (!profile) return <div className="page-fade-in" style={{ padding: '40px', textAlign: 'center' }}>User not found</div>;

  return (
    <div className="page-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div className="glass-panel" style={{ padding: '40px', position: 'relative', overflow: 'hidden', minHeight: '300px' }}>
        {/* Background Accent */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'var(--accent-cyan)', opacity: 0.05, borderRadius: '50%', filter: 'blur(60px)' }}></div>
        
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center', position: 'relative' }}>
          <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: profile.avatar_color || 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', fontWeight: 800, color: '#fff', border: '5px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            {profile.avatar_url ? (
               <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : profile.name.charAt(0)}
          </div>
          
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-main)' }}>{profile.name}</h1>
            <div style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AtSign size={16} />{profile.handle || 'no_username'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} /> {profile.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={16} /> Senior Developer
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} /> Joined {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '20px 30px', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
            <Award size={32} style={{ color: 'var(--accent-yellow)', marginBottom: '8px' }} />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Top Contributor</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginTop: '24px' }}>
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: 'rgba(0, 242, 254, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--accent-cyan)' }}>
            <CheckCircle size={28} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>{profile.stats.tickets}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ticket Resolved</div>
        </div>

        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--accent-purple)' }}>
            <Briefcase size={28} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>{profile.stats.projects}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Projects Active</div>
        </div>

        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--accent-blue)' }}>
            <Clock size={28} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>{profile.stats.totalHours}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Hours Tracked</div>
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }}>Bio & Background</h3>
        <div className="glass-panel" style={{ padding: '24px', lineHeight: '1.6', color: 'var(--text-muted)' }}>
          A passionate software engineer specializing in modern web technologies and dashboard architecture. 
          Focusing on building high-performance applications with beautiful, intuitive user interfaces. 
          Expert in system design, database optimization, and cross-team collaboration for complex enterprise solutions.
        </div>
      </div>
    </div>
  );
};
