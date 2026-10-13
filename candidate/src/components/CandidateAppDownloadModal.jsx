import React, { useState } from 'react';
import { Download, Smartphone, Check, ExternalLink, X, ShieldCheck } from 'lucide-react';

export default function CandidateAppDownloadModal({ referralCode, isOpen, onClose, API_URL }) {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appDeepLink = `forgejobs://referral?ref=${encodeURIComponent(referralCode || '')}`;
  const apkDownloadUrl = `${API_URL}/api/download/candidate-apk`;

  const handleCopyCode = () => {
    if (referralCode && navigator.clipboard) {
      navigator.clipboard.writeText(referralCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadApk = () => {
    handleCopyCode();
    setDownloadStarted(true);

    // Trigger download
    const link = document.createElement('a');
    link.href = apkDownloadUrl;
    link.setAttribute('download', 'CandidateRecruitPro.apk');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenApp = () => {
    handleCopyCode();
    window.location.href = appDeepLink;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        maxWidth: '440px',
        width: '100%',
        padding: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        position: 'relative',
        animation: 'modalSlideUp 0.3s ease-out'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b'
          }}
          title="Continue on Website"
        >
          <X size={18} />
        </button>

        {/* Top App Icon & Brand */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            margin: '0 auto 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(15, 23, 42, 0.25)',
            border: '2px solid #f59e0b'
          }}>
            <Smartphone size={32} color="#f59e0b" />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
            FIC RecruitPro
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Official Candidate Mobile Application
          </p>
        </div>

        {/* HR Referral Badge */}
        {referralCode && (
          <div style={{
            background: '#eff6ff',
            border: '1.5px solid #bfdbfe',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🤝</span>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>
                  HR Referral Active
                </div>
                <div style={{ fontSize: '0.9rem', color: '#1d4ed8', fontWeight: 800 }}>
                  {referralCode}
                </div>
              </div>
            </div>

            <button
              onClick={handleCopyCode}
              style={{
                background: copied ? '#10b981' : '#dbeafe',
                color: copied ? '#ffffff' : '#1e40af',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {copied ? <Check size={12} /> : null}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}

        {/* Info Highlights */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.825rem', color: '#334155' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>Preserves your HR referral code until job application</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#334155' }}>
            <Check size={16} color="#10b981" />
            <span>Real-time application status & scheduled interviews</span>
          </div>
        </div>

        {/* Download Status Notification */}
        {downloadStarted && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            padding: '10px 12px',
            marginBottom: '16px',
            fontSize: '0.8rem',
            color: '#065f46',
            lineHeight: 1.4
          }}>
            <strong>Download started!</strong> When finished, open the downloaded APK from your notifications to install the app.
          </div>
        )}

        {/* Primary Action: Download APK */}
        <button
          onClick={handleDownloadApk}
          style={{
            width: '100%',
            background: '#0f172a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '13px',
            fontSize: '0.95rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            marginBottom: '10px',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
          }}
        >
          <Download size={18} color="#f59e0b" />
          <span>Download Candidate App (APK)</span>
        </button>

        {/* Secondary Action: Open App if installed */}
        <button
          onClick={handleOpenApp}
          style={{
            width: '100%',
            background: '#f8fafc',
            color: '#2563eb',
            border: '1.5px solid #cbd5e1',
            borderRadius: '12px',
            padding: '11px',
            fontSize: '0.875rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            marginBottom: '12px'
          }}
        >
          <ExternalLink size={16} />
          <span>Open App (If Already Installed)</span>
        </button>

        {/* Tertiary: Continue on Website */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Continue on Website Instead
          </button>
        </div>
      </div>
    </div>
  );
}
