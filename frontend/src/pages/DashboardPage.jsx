import React, { useState, useEffect } from 'react';
import { Clock, Ticket, User, BarChart2 } from 'lucide-react';
import { getStats } from '../services/api';

export const DashboardPage = () => {
  const [stats, setStats] = useState({
    openTickets: 0,
    totalHours: "0.00",
    topProject: "—",
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '32px', fontSize: '1.8rem', fontWeight: 600 }}>Overview</h1>
      
      {/* Top Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
         <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 242, 254, 0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Ticket size={24} />
            </div>
            <div>
               <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Open Tickets</div>
               <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                 {loading ? '...' : stats.openTickets}
               </div>
            </div>
         </div>

         <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(142, 45, 226, 0.1)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Clock size={24} />
            </div>
            <div>
               <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Hours This Week</div>
               <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                 {loading ? '...' : `${stats.totalHours}h`}
               </div>
            </div>
         </div>

         <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <BarChart2 size={24} />
            </div>
            <div>
               <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Top Project</div>
               <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                 {loading ? '...' : stats.topProject}
               </div>
            </div>
         </div>

         <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-new)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <User size={24} />
            </div>
            <div>
               <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Users</div>
               <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                 {loading ? '...' : stats.activeUsers}
               </div>
            </div>
         </div>
      </div>

      {/* Main Activity Chart Area */}
      <div className="glass-panel" style={{ padding: '32px', minHeight: '450px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Tracked Time Activity (Last 7 Days)</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#8e2de2' }}></div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Focus</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#00f2fe' }}></div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Activity</span>
                </div>
              </div>
          </div>
          
          <div style={{ 
            height: '300px', 
            display: 'flex', 
            alignItems: 'flex-end', 
            justifyContent: 'space-between', 
            gap: '15px', 
            position: 'relative', 
            paddingBottom: '30px',
            borderBottom: '1px solid var(--border-light)'
          }}>
             {loading ? (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)', textAlign: 'center' }}>
                   <BarChart2 size={48} className="spin" style={{ opacity: 0.3, marginBottom: '12px' }} />
                   <p>Gathering your stats...</p>
                </div>
             ) : (!stats || !stats.chartData) ? (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)', textAlign: 'center' }}>
                   <BarChart2 size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
                   <p>Your team's activity will bloom here once you start tracking time.</p>
                </div>
             ) : (
                (() => {
                  // Find current Monday
                  const now = new Date();
                  const day = now.getDay(); // 0 is Sunday, 1 is Monday...
                  const diff = now.getDate() - (day === 0 ? 6 : day - 1);
                  const monday = new Date(now.setDate(diff));
                  monday.setHours(0,0,0,0);

                  const days = [];
                  for (let i = 0; i < 7; i++) {
                    const d = new Date(monday);
                    d.setDate(monday.getDate() + i);
                    days.push(d.toISOString().split('T')[0]);
                  }

                  const todayStr = new Date().toISOString().split('T')[0];
                  const maxHours = Math.max(...stats.chartData.map(d => parseFloat(d.hours)), 1);

                  return days.map((dateStr, idx) => {
                    const dayData = stats.chartData.find(d => d.date === dateStr);
                    const hours = dayData ? parseFloat(dayData.hours) : 0;
                    const hPerc = (hours / maxHours) * 90;
                    const isToday = dateStr === todayStr;
                    const dtLabel = new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
                    
                    return (
                      <div key={idx} style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        height: '100%', 
                        justifyContent: 'flex-end',
                        position: 'relative',
                        opacity: isToday ? 1 : 0.8
                      }}>
                         {hours > 0 && (
                           <div style={{ 
                             background: isToday ? '#16181d' : 'rgba(22, 24, 29, 0.8)', 
                             border: isToday ? '2px solid #00f2fe' : '1px solid #00f2fe', 
                             padding: '2px 10px', 
                             borderRadius: '6px', 
                             fontSize: '0.8rem', 
                             fontWeight: 800,
                             color: '#00f2fe',
                             marginBottom: '8px',
                             boxShadow: isToday ? '0 4px 15px rgba(0, 242, 254, 0.3)' : 'none',
                             zIndex: 20
                           }}>
                             {hours.toFixed(1)}h
                           </div>
                         )}
                         
                         <div style={{ 
                           width: '100%', 
                           maxWidth: '50px', 
                           height: `${Math.max(hPerc, 3)}%`, 
                           background: hours > 0 ? 'linear-gradient(to top, #8e2de2, #00f2fe)' : 'rgba(255,255,255,0.05)', 
                           borderRadius: '8px 8px 0 0',
                           boxShadow: (isToday && hours > 0) ? '0 0 25px rgba(0, 242, 254, 0.4)' : 'none',
                           position: 'relative',
                           opacity: hours === 0 ? 0.2 : 1,
                           transition: 'all 0.5s ease',
                           border: isToday ? '1px solid rgba(0, 242, 254, 0.4)' : 'none'
                         }}>
                            {hours > 0 && (
                              <div style={{ 
                                position: 'absolute', 
                                top: 0, left: 0, right: 0, 
                                height: '25%', 
                                background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)', 
                                borderRadius: '8px 8px 0 0' 
                              }}></div>
                            )}
                         </div>
                         
                         <div style={{ 
                           marginTop: '15px', 
                           fontSize: '0.8rem', 
                           color: isToday ? 'var(--accent-cyan)' : 'var(--text-muted)', 
                           fontWeight: isToday ? 800 : 700,
                           whiteSpace: 'nowrap',
                           textTransform: 'capitalize' 
                         }}>
                           {isToday ? 'Today' : dtLabel}
                         </div>
                      </div>
                    );
                  });
                })()
             )}
          </div>
      </div>
    </div>
  );
};
