import React, { useState, useEffect, useMemo } from 'react';
import { Share2, Users, MousePointerClick, Copy, ChevronDown, ChevronUp, Phone, Mail, MapPin, Calendar, Briefcase, LayoutDashboard, Gift, CalendarDays, Settings, Search, Download, Bell, X, FileText, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ScheduleInterviewModal from './ScheduleInterviewModal';

export default function HrDashboard({ API_URL, currentUser, sidebarOpen, setSidebarOpen }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [expandedApp, setExpandedApp] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [activeTab, setActiveTab] = useState('overview');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showNotifications, setShowNotifications] = useState(false);

  const [interviews, setInterviews] = useState([]);

  // Modals for HR Actions
  const [statusModalApp, setStatusModalApp] = useState(null);
  const [newAppStatus, setNewAppStatus] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState('');
  
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [appToSchedule, setAppToSchedule] = useState(null);

  const candidatePortalBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:5173'
    : 'https://jobs.forgeindiaconnect.in';

  const webReferralUrl = stats?.webReferralUrl || `${candidatePortalBaseUrl}?ref=${currentUser.referralCode}`;
  const mobileReferralUrl = stats?.mobileReferralUrl || `${candidatePortalBaseUrl}?m.ref=${currentUser.referralCode}`;
  const [copiedLink, setCopiedLink] = useState(null);

  const fetchStats = () => {
    fetch(`${API_URL}/api/users/hr/${currentUser.referralCode}/dashboard`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchInterviews = () => {
    fetch(`${API_URL}/api/interviews`)
      .then(res => res.json())
      .then(data => {
        // Only keep interviews related to candidates mapped to this HR
        if (stats?.applications) {
          const hrCandidateIds = stats.applications.map(a => a.candidateId);
          const hrInterviews = data.filter(i => hrCandidateIds.includes(i.candidateId));
          setInterviews(hrInterviews);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [API_URL, currentUser]);

  useEffect(() => {
    if (activeTab === 'interviews' && stats) {
      fetchInterviews();
    }
  }, [activeTab, stats]);

  const copyToClipboard = (type = 'mobile') => {
    const link = type === 'mobile' ? mobileReferralUrl : webReferralUrl;
    navigator.clipboard.writeText(link);
    setCopiedLink(type);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setCopiedLink(null);
    }, 2000);
  };

  const shareOnWhatsApp = (type = 'mobile') => {
    const link = type === 'mobile' ? mobileReferralUrl : webReferralUrl;
    const text = `Hey! Check out these amazing job openings at Forge India Connect: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const toggleExpand = (appId) => {
    setExpandedApp(expandedApp === appId ? null : appId);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/applications/${statusModalApp.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newAppStatus, adminNotes: adminNoteInput })
      });
      if (res.ok) {
        showToast('Status updated successfully');
        setStatusModalApp(null);
        fetchStats();
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating status', 'error');
    }
  };

  // Filter Data
  const filteredApps = useMemo(() => {
    if (!stats?.applications) return [];
    return stats.applications.filter(app => {
      const matchesSearch = app.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (app.candidateMobile && app.candidateMobile.includes(searchTerm));
      const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [stats, searchTerm, statusFilter]);

  // Analytics Data
  const chartData = useMemo(() => {
    if (!stats?.applications) return [];
    const dateCounts = {};
    [...stats.applications].reverse().forEach(app => {
      const date = new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    
    const dataArray = Object.keys(dateCounts).map(date => ({
      name: date,
      Candidates: dateCounts[date]
    }));
    return dataArray.slice(-7);
  }, [stats]);

  // Export CSV
  const exportToCSV = () => {
    if (!filteredApps.length) return;
    const headers = ['Name', 'Mobile', 'Email', 'City', 'Experience', 'Job Title', 'Company', 'Status', 'Applied At'];
    const rows = filteredApps.map(app => [
      app.candidateName,
      app.candidateMobile || 'N/A',
      app.candidateEmail || 'N/A',
      app.candidateLocation || 'N/A',
      app.candidateExperience || 'N/A',
      app.jobTitle,
      app.companyName,
      app.status,
      new Date(app.appliedAt).toLocaleDateString('en-IN')
    ]);

    const csvContent = [headers, ...rows].map(e => e.map(item => `"${item}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Candidates_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const recentNotifications = useMemo(() => {
    if (!stats?.applications) return [];
    return stats.applications.slice(0, 3).map(app => ({
      id: app.id,
      text: `${app.candidateName} just applied for ${app.jobTitle}!`,
      time: new Date(app.appliedAt).toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'})
    }));
  }, [stats]);

  const getStatusBadge = (status) => {
    if (status === 'Applied') return <span style={{ color: '#0f172a', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Applied</span>;
    if (status === 'Shortlisted') return <span style={{ color: '#047857', background: '#d1fae5', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Shortlisted</span>;
    if (status === 'Interview Scheduled') return <span style={{ color: '#1d4ed8', background: '#dbeafe', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Interview Scheduled</span>;
    if (status === 'Selected' || status === 'Converted') return <span style={{ color: '#047857', background: '#ecfdf5', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #10b981' }}>{status}</span>;
    if (status === 'Rejected' || status === 'Not Interested') return <span style={{ color: '#be123c', background: '#ffe4e6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{status}</span>;
    if (status === 'Follow up') return <span style={{ color: '#b45309', background: '#fef3c7', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Follow up</span>;
    return <span style={{ color: '#475569', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{status}</span>;
  };

  return (
    <div className="admin-layout animate-fade">
      
      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? 'mobile-open' : ''}`} style={{ padding: '1.5rem 1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '4px' }}>HR Workspace</h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Manage your referrals</p>
        </div>

        <div className="sidebar-nav" style={{ display: 'flex', flexDirection: window.innerWidth > 768 ? 'column' : 'row', gap: '0.5rem', overflowX: 'auto', paddingBottom: window.innerWidth > 768 ? '0' : '0.5rem' }}>
          <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setSidebarOpen && setSidebarOpen(false); }} style={{ whiteSpace: 'nowrap' }}>
            <LayoutDashboard size={18} /><span>Overview</span>
          </button>

          <button className={`nav-item ${activeTab === 'interviews' ? 'active' : ''}`} onClick={() => { setActiveTab('interviews'); setSidebarOpen && setSidebarOpen(false); }} style={{ whiteSpace: 'nowrap' }}>
            <CalendarDays size={18} /><span>Interviews</span>
          </button>

          <button className={`nav-item ${activeTab === 'incentives' ? 'active' : ''}`} onClick={() => { setActiveTab('incentives'); setSidebarOpen && setSidebarOpen(false); }} style={{ whiteSpace: 'nowrap' }}>
            <Gift size={18} /><span>Incentives</span>
          </button>

          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); setSidebarOpen && setSidebarOpen(false); }} style={{ whiteSpace: 'nowrap' }}>
            <Settings size={18} /><span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="admin-main" style={{ flex: 1, padding: window.innerWidth > 768 ? '2rem' : '1rem' }}>
        
        {/* Header with Notifications */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', color: '#0f172a' }}>{activeTab === 'overview' ? `Welcome, ${currentUser.name}!` : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
            <p style={{ color: '#64748b' }}>Here is your personal HR Dashboard.</p>
          </div>
          
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', padding: '10px', cursor: 'pointer', position: 'relative' }}
            >
              <Bell size={20} color="#64748b" />
              {recentNotifications.length > 0 && (
                <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                  {recentNotifications.length}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div style={{ position: 'absolute', right: 0, top: '45px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', width: '300px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0f172a' }}>Recent Activity</h4>
                  <X size={16} color="#64748b" cursor="pointer" onClick={() => setShowNotifications(false)} />
                </div>
                <div style={{ padding: '8px' }}>
                  {recentNotifications.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No recent notifications</div>
                  ) : (
                    recentNotifications.map((notif, idx) => (
                      <div key={idx} style={{ padding: '10px', display: 'flex', gap: '12px', borderBottom: idx !== recentNotifications.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <div style={{ background: '#ecfdf5', color: '#10b981', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Users size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 500 }}>{notif.text}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>{notif.time}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="animate-fade">
            
            <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', padding: '1.5rem', borderRadius: '16px', color: 'white', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold' }}>Candidate Referral Links</h3>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    Code: {currentUser.referralCode}
                  </span>
                </div>
                <p style={{ color: '#e0e7ff', fontSize: '0.85rem' }}>
                  Share either link with candidates. Sourced candidates will be automatically tracked under your account. Mobile link redirects candidates directly into the Candidate App.
                </p>
              </div>

              {/* 1. Mobile Referral Link (?m.ref=) */}
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 14px', borderRadius: '10px', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fef08a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📱 Mobile Referral Link (Candidate App Auto-Redirect & Download)</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input type="text" readOnly value={mobileReferralUrl} style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', color: '#0f172a', fontWeight: 'bold', minWidth: '200px', fontSize: '0.85rem' }} />
                  <button className="btn-primary" onClick={() => copyToClipboard('mobile')} style={{ background: copiedLink === 'mobile' ? '#059669' : '#10b981', border: 'none', transition: 'background 0.3s', fontSize: '0.85rem', padding: '8px 14px' }}>
                    <Copy size={15} /> {copiedLink === 'mobile' ? 'Copied' : 'Copy Mobile Link'}
                  </button>
                  <button className="btn-primary" onClick={() => shareOnWhatsApp('mobile')} style={{ background: '#25D366', border: 'none', color: 'white', fontSize: '0.85rem', padding: '8px 14px' }}>
                    <Share2 size={15} /> WhatsApp
                  </button>
                </div>
              </div>

              {/* 2. Web Referral Link (?ref=) */}
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 14px', borderRadius: '10px', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
                  💻 Web Referral Link (Standard Browser Portal)
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input type="text" readOnly value={webReferralUrl} style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', color: '#0f172a', fontWeight: 'bold', minWidth: '200px', fontSize: '0.85rem' }} />
                  <button className="btn-primary" onClick={() => copyToClipboard('web')} style={{ background: copiedLink === 'web' ? '#059669' : '#334155', border: 'none', transition: 'background 0.3s', fontSize: '0.85rem', padding: '8px 14px' }}>
                    <Copy size={15} /> {copiedLink === 'web' ? 'Copied' : 'Copy Web Link'}
                  </button>
                  <button className="btn-primary" onClick={() => shareOnWhatsApp('web')} style={{ background: '#25D366', border: 'none', color: 'white', fontSize: '0.85rem', padding: '8px 14px' }}>
                    <Share2 size={15} /> WhatsApp
                  </button>
                </div>
              </div>
            </div>

            <div className="kpi-grid">
              <div className="kpi-card" style={{ borderLeft: '4px solid #6366f1', background: '#eef2ff' }}>
                <div className="kpi-icon" style={{ background: '#c7d2fe', color: '#4f46e5' }}><MousePointerClick size={20} /></div>
                <div><div className="kpi-val">{stats ? stats.linkClicks : 0}</div><div className="kpi-label">Total Link Clicks</div></div>
              </div>
              <div className="kpi-card" style={{ borderLeft: '4px solid #10b981', background: '#ecfdf5' }}>
                <div className="kpi-icon" style={{ background: '#a7f3d0', color: '#059669' }}><Users size={20} /></div>
                <div><div className="kpi-val">{stats ? stats.totalApplications : 0}</div><div className="kpi-label">Candidates Applied</div></div>
              </div>
            </div>

            {chartData.length > 0 && (
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '1.5rem' }}>Application Trends (Last 7 Days)</h3>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Line type="monotone" dataKey="Candidates" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 className="section-title" style={{ margin: 0 }}>Your Candidates</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input type="text" placeholder="Search name or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '220px', outline: 'none' }} />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', background: 'white' }}>
                  <option value="All">All Statuses</option>
                  <option value="Applied">Applied</option>
                  <option value="Interview Scheduled">Interview Scheduled</option>
                  <option value="Selected">Selected</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <button onClick={exportToCSV} className="btn-primary" style={{ background: '#0f172a', border: 'none', padding: '8px 16px', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.85rem' }}>
                  <Download size={16} /> Export CSV
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredApps.map(app => (
                <div key={app.id} style={{
                  background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden',
                  transition: 'box-shadow 0.2s', boxShadow: expandedApp === app.id ? '0 4px 15px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <div onClick={() => toggleExpand(app.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '200px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', flexShrink: 0 }}>
                        {app.candidateName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{app.candidateName}</div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{app.candidateMobile}</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>{app.jobTitle}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{app.companyName}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {getStatusBadge(app.status)}
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(app.appliedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      {expandedApp === app.id ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                    </div>
                  </div>

                  {expandedApp === app.id && (
                    <div style={{ borderTop: '1px solid #e2e8f0', padding: '20px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}><Users size={16} /></div>
                            <div><div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Full Name</div><div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.92rem' }}>{app.candidateName}</div></div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}><Phone size={16} /></div>
                            <div><div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Mobile Number</div><div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.92rem' }}>{app.candidateMobile || 'N/A'}</div></div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}><Calendar size={16} /></div>
                            <div><div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Date of Birth</div><div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.92rem' }}>{app.candidateDOB ? new Date(app.candidateDOB).toLocaleDateString('en-IN') : 'N/A'}</div></div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}><MapPin size={16} /></div>
                            <div><div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>City</div><div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.92rem' }}>{app.candidateLocation || 'N/A'}</div></div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}><Briefcase size={16} /></div>
                            <div><div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Experience</div><div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.92rem' }}>{app.candidateExperience || 'N/A'}</div></div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}><Mail size={16} /></div>
                            <div><div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Email Address</div><div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.92rem' }}>{app.candidateEmail || 'N/A'}</div></div>
                          </div>
                        </div>
                        
                        {/* HR Actions Panel */}
                        <div style={{ minWidth: '220px', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                          <h4 style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '12px', marginTop: 0 }}>HR Actions</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button
                              className="btn-primary"
                              style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem', display: 'flex', justifyContent: 'center' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setStatusModalApp(app);
                                setNewAppStatus(app.status);
                                setAdminNoteInput(app.adminNotes || '');
                              }}
                            >
                              Update Status
                            </button>
                            <button
                              className="btn-secondary"
                              style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', background: '#f8fafc', color: '#2563eb', border: '1px solid #bfdbfe' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setAppToSchedule(app);
                                setInterviewModalOpen(true);
                              }}
                            >
                              Schedule Interview
                            </button>
                            {app.candidateResumeUrl && (
                              <a href={app.candidateResumeUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px 12px', background: '#ecfdf5', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}>
                                <FileText size={14} /> View Resume
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {filteredApps.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                  <Search size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
                  <p style={{ fontSize: '1rem', fontWeight: 500 }}>No candidates found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <div className="animate-fade">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#0f172a', margin: 0 }}>Scheduled Interviews</h3>
            </div>

            {interviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <CalendarDays size={64} color="#94a3b8" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.4rem', color: '#334155', marginBottom: '0.5rem' }}>No Scheduled Interviews</h3>
                <p style={{ color: '#64748b' }}>When you schedule interviews for candidates, they will appear here.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Process</th>
                      <th>Date & Time</th>
                      <th>Mode & Details</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviews.map(int => {
                      const relatedApp = stats?.applications?.find(a => a.id === int.applicationId);
                      return (
                      <tr key={int.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{relatedApp ? relatedApp.candidateName : int.candidateName}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>{relatedApp ? relatedApp.jobTitle : int.jobTitle}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{relatedApp ? relatedApp.companyName : int.companyName}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} color="#2563eb" /> {new Date(int.date).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            🕒 {int.time}
                          </div>
                        </td>
                        <td>
                          <span style={{ 
                            background: int.mode === 'Online' ? '#dbeafe' : '#fef3c7', 
                            color: int.mode === 'Online' ? '#1d4ed8' : '#b45309',
                            padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600
                          }}>
                            {int.mode}
                          </span>
                          {int.mode === 'Online' && int.meetingLink && (
                            <a href={int.meetingLink} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '0.8rem', color: '#2563eb', marginTop: '6px' }}>Join Link</a>
                          )}
                          {int.mode === 'Offline' && int.location && (
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px' }}>{int.location}</div>
                          )}
                        </td>

                        <td>
                          {relatedApp ? getStatusBadge(relatedApp.status) : <span style={{ color: '#94a3b8' }}>-</span>}
                        </td>
                        <td>
                          <button
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            onClick={() => {
                              const relatedApp = stats?.applications?.find(a => a.id === int.applicationId);
                              if (relatedApp) {
                                setStatusModalApp(relatedApp);
                                setNewAppStatus(relatedApp.status);
                                setAdminNoteInput(relatedApp.adminNotes || '');
                              } else {
                                alert("Application details not found for this interview.");
                              }
                            }}
                          >
                            Update Status
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="animate-fade" style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '600px' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={22} color="#3b82f6" /> Profile Settings
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Full Name</label>
                <input type="text" defaultValue={currentUser.name} className="form-input" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Email Address</label>
                <input type="email" defaultValue={currentUser.email} disabled style={{ background: '#f1f5f9', width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#94a3b8' }} />
              </div>
              <div style={{ borderTop: '1px solid #e2e8f0', margin: '1rem 0' }}></div>
              <h4 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0' }}>Bank Account Details</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '-10px' }}>Required for incentive payouts</p>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Account Number</label>
                <input type="text" placeholder="Enter account number" className="form-input" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>IFSC Code</label>
                <input type="text" placeholder="Enter IFSC code" className="form-input" />
              </div>
              
              <button className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 24px', marginTop: '1rem' }}>Save Changes</button>
            </div>
          </div>
        )}

        {/* Incentives Tab */}
        {activeTab === 'incentives' && (
          <div className="animate-fade">
            <div className="kpi-grid">
              <div className="kpi-card" style={{ borderLeft: '4px solid #10b981', background: '#ffffff', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.25rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}><Gift size={24} /></div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0f172a' }}>₹0</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Total Incentives Earned</div>
              </div>
              <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b', background: '#ffffff', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.25rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}><Briefcase size={24} /></div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0f172a' }}>{stats?.applications?.length || 0}</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Pending Referrals</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Modal */}
      {statusModalApp && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Update Status</h3>
              <button onClick={() => setStatusModalApp(null)} className="btn-icon"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateStatus} style={{ padding: '0 20px 20px 20px' }}>
              <div className="form-group">
                <label>Candidate: {statusModalApp.candidateName}</label>
                <select value={newAppStatus} onChange={e => setNewAppStatus(e.target.value)} className="form-input" required>
                  <option value="Applied">Applied</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interview Scheduled">Interview Scheduled</option>
                  <option value="Selected">Selected</option>
                  <option value="Converted">Converted</option>
                  <option value="Follow up">Follow up</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Not Interested">Not Interested</option>
                </select>
              </div>

              <div className="modal-actions" style={{ padding: 0, marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setStatusModalApp(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Status</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={interviewModalOpen}
        onClose={() => setInterviewModalOpen(false)}
        application={appToSchedule}
        API_URL={API_URL}
        onScheduledSuccess={() => {
          setInterviewModalOpen(false);
          fetchStats();
          fetchInterviews();
        }}
      />
      {/* Toast Notification */}
      {toast && (
        <div className="animate-fade" style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontWeight: 600,
          fontSize: '0.95rem'
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
