import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, User, Calendar, Printer, LayoutDashboard } from 'lucide-react';
import { getBillingData, getUsers } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Date Helpers (Outside to be stable)
const getStartOfWeek = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(date.setDate(diff));
};

const getWeekRange = (start) => {
  const range = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    range.push(d);
  }
  return range;
};

const formatDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const formatDisplayDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const formatMonthName = (d) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export const ReportsPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(currentUser?.id || '');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [billingData, setBillingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' or 'monthly'
  const [snapshotMode, setSnapshotMode] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  }, []);

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    try {
      let startStr, endStr;
      if (viewMode === 'weekly') {
        const startDay = getStartOfWeek(currentDate);
        const endDay = new Date(startDay);
        endDay.setDate(startDay.getDate() + 6);
        startStr = formatDate(startDay);
        endStr = formatDate(endDay);
      } else {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        startStr = formatDate(startOfMonth);
        endStr = formatDate(endOfMonth);
      }

      const filteredData = await getBillingData(startStr, endStr, selectedUserId);
      setBillingData(filteredData);
    } catch (err) {
      console.error('Failed to fetch billing data', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate, selectedUserId, viewMode]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    if (snapshotMode) {
      document.body.classList.add('snapshot-active');
    } else {
      document.body.classList.remove('snapshot-active');
    }
    return () => document.body.classList.remove('snapshot-active');
  }, [snapshotMode]);
  useEffect(() => { fetchBilling(); }, [fetchBilling]);

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const handleDateChange = (e) => {
    const selected = new Date(e.target.value);
    if (!isNaN(selected.getTime())) {
      setCurrentDate(selected);
    }
  };

  const handleThisMonth = () => {
    setCurrentDate(new Date());
  };


  const weekStart = getStartOfWeek(currentDate);
  const weekDays = getWeekRange(weekStart);

  // Transform flat data into grouped by project
  const projectMap = {};
  billingData.forEach(entry => {
    if (!projectMap[entry.project_name]) {
      projectMap[entry.project_name] = { 
        name: entry.project_name, 
        color: entry.color,
        days: Array(7).fill(0) 
      };
    }
    const entryDate = String(entry.work_date || '').split('T')[0];
    const dayIndex = weekDays.findIndex(d => formatDate(d) === entryDate);
    if (dayIndex !== -1) {
      projectMap[entry.project_name].days[dayIndex] += entry.total_minutes / 60;
    }
  });

  const projects = Object.values(projectMap);
  const dayTotals = Array(7).fill(0).map((_, i) => 
    projects.reduce((sum, p) => sum + p.days[i], 0)
  );
  const GrandTotal = dayTotals.reduce((a, b) => a + b, 0);

  // Monthly breakdown: Group by project, sum hours
  const monthlyProjectMap = {};
  billingData.forEach(entry => {
    if (!monthlyProjectMap[entry.project_name]) {
      monthlyProjectMap[entry.project_name] = { 
        name: entry.project_name, 
        color: entry.color,
        totalHours: 0 
      };
    }
    monthlyProjectMap[entry.project_name].totalHours += entry.total_minutes / 60;
  });
  const monthlyProjects = Object.values(monthlyProjectMap);
  const MonthlyGrandTotal = monthlyProjects.reduce((sum, p) => sum + p.totalHours, 0);

  return (
    <div className={`page-fade-in ${snapshotMode ? 'snapshot-active' : ''}`} style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      {snapshotMode && (
        <div className="no-print" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
          <button className="btn btn-primary" onClick={() => setSnapshotMode(false)}>Exit Photo Mode</button>
        </div>
      )}

      {/* Header & Filters */}
      <div className={snapshotMode ? 'no-print' : ''} style={{ display: snapshotMode ? 'none' : 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px', background: 'linear-gradient(90deg, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Billing Time
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
             <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border-light)', cursor: 'pointer' }} onClick={() => document.getElementById('week-picker').showPicker()}>
                <Calendar size={14} />
                <span>{formatDisplayDate(weekDays[0])} — {formatDisplayDate(weekDays[6])}</span>
                <input 
                  id="week-picker"
                  type="date" 
                  style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', left: 0, top: 0, cursor: 'pointer' }} 
                  onChange={handleDateChange}
                />
             </div>
             <div style={{ display: 'flex', gap: '4px' }}>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', minWidth: 'auto' }} onClick={handlePrevWeek}><ChevronLeft size={16}/></button>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', minWidth: 'auto' }} onClick={handleNextWeek}><ChevronRight size={16}/></button>
             </div>
             <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.75rem', height: '28px' }} onClick={handleThisMonth}>This Month</button>
          </div>
        </div>
        
        <div className="no-print" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <button className={`btn ${viewMode === 'weekly' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 16px', fontSize: '0.85rem' }} onClick={() => setViewMode('weekly')}>Weekly</button>
            <button className={`btn ${viewMode === 'monthly' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 16px', fontSize: '0.85rem' }} onClick={() => setViewMode('monthly')}>Monthly</button>
          </div>
          <div style={{ position: 'relative' }}>
            <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <select 
              className="glass-panel" 
              style={{ padding: '10px 16px 10px 36px', outline: 'none', color: 'var(--text-main)', appearance: 'none', cursor: 'pointer', border: '1px solid var(--border-light)' }}
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">All Users</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

        </div>
      </div>

      {/* Report View */}
      <div className="glass-panel reports-view-container" style={{ overflow: 'hidden', border: '1px solid var(--border-light)', position: 'relative' }}>
        {/* Document Header (Print Only) */}
        <div style={{ display: 'none', padding: '40px', borderBottom: '2px solid #eee' }} className="print-only">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, color: '#000', fontSize: '2.5rem' }}>Antigravity Report</h1>
              <p style={{ color: '#666' }}>{viewMode === 'monthly' ? 'Monthly' : 'Weekly'} Billing Summary</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 700 }}>{currentUser?.name || 'Maxim'}</p>
              <p style={{ color: '#666' }}>{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {loading && billingData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '96px', color: 'var(--text-muted)' }}>Preparing report...</div>
        ) : viewMode === 'weekly' ? (
          /* Weekly Table */
          <table className="ticket-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            {/* Same week table headers and body... */}
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: 600 }}>Project</th>
                {weekDays.map((day, i) => (
                  <th key={i} style={{ textAlign: 'center', padding: '12px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{day.getDate()}</div>
                  </th>
                ))}
                <th style={{ textAlign: 'center', padding: '12px', color: 'var(--accent-cyan)', fontWeight: 700 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>No time logged for this period.</td></tr>
              ) : projects.map((project, idx) => (
                <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: project.color || 'var(--accent-blue)' }}></div>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{project.name}</span>
                  </td>
                  {project.days.map((hrs, i) => (
                    <td key={i} style={{ textAlign: 'center', color: hrs > 0 ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '0.9rem' }}>{hrs > 0 ? hrs.toFixed(2) : '-'}</td>
                  ))}
                  <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-main)', background: 'rgba(255,255,255,0.02)' }}>{project.days.reduce((a,b) => a+b, 0).toFixed(2)}</td>
                </tr>
              ))}
              {!loading && projects.length > 0 && (
                <tr style={{ background: 'rgba(0,0,0,0.3)', borderTop: '2px solid var(--border-light)' }}>
                  <td style={{ padding: '20px 24px', fontWeight: 700, color: 'var(--accent-cyan)' }}>Daily Totals</td>
                  {dayTotals.map((tot, i) => (
                    <td key={i} style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-main)' }}>{tot > 0 ? tot.toFixed(2) : '-'}</td>
                  ))}
                  <td style={{ textAlign: 'center', fontWeight: 800, color: '#fff', background: 'var(--accent-cyan-gradient)', fontSize: '1.2rem' }}>{GrandTotal.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          /* Monthly Summary View */
          <div style={{ padding: '48px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
              <div>
                <h2 style={{ fontSize: '2.4rem', color: 'var(--text-main)', margin: 0 }}>Efficiency Report</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '8px' }}>{formatMonthName(currentDate)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Total Period Hours</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', justifyContent: 'flex-end' }}>
                   <span style={{ fontSize: '3.5rem', fontWeight: 800, background: 'var(--accent-cyan-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{MonthlyGrandTotal.toFixed(2)}</span>
                   <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 600 }}>HRS</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {monthlyProjects.map((p, i) => (
                <div key={i} className="glass-panel" style={{ padding: '32px', border: '1px solid var(--border-light)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, height: '4px', width: '100%', background: p.color || 'var(--accent-blue)' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: p.color || 'var(--accent-blue)' }}></div>
                      <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-main)' }}>{p.name}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '12px' }}>
                      {((p.totalHours / MonthlyGrandTotal) * 100 || 0).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{p.totalHours.toFixed(2)}</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>HOURS</span>
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${(p.totalHours / MonthlyGrandTotal * 100) || 0}%`, 
                        height: '100%', 
                        background: p.color || 'var(--accent-blue)',
                        boxShadow: `0 0 10px ${p.color || 'var(--accent-blue)'}44`
                      }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {monthlyProjects.length === 0 && (
              <div style={{ textAlign: 'center', padding: '96px', color: 'var(--text-muted)', fontSize: '1.1rem' }}>No project data found for this month.</div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'none' }}>
        <style>{`
          @media print {
            .print-only { display: block !important; }
            .glass-panel { background: white !important; color: black !important; }
            .badge { border: 1px solid #000 !important; color: #000 !important; }
          }
        `}</style>
      </div>

      <div className="no-print" style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
          <div className="glass-panel" style={{ padding: '20px 40px', display: 'flex', alignItems: 'center', gap: '24px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{viewMode === 'monthly' ? 'Monthly Total' : 'Weekly Total'}</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{viewMode === 'monthly' ? MonthlyGrandTotal.toFixed(2) : GrandTotal.toFixed(2)}</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>hours</span>
                </div>
              </div>
              <div style={{ width: '1px', height: '40px', background: 'var(--border-light)' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Efficiency</span>
                 <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>94%</span>
              </div>
          </div>
      </div>
    </div>
  );
};
