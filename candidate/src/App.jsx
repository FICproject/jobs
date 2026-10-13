import React, { useState, useEffect } from 'react';
import CandidateNavbar from './components/CandidateNavbar';
import CandidateView from './components/CandidateView';
import CandidateAppDownloadModal from './components/CandidateAppDownloadModal';

const envApiUrl = import.meta.env.VITE_API_URL;
const API_URL = (envApiUrl && !envApiUrl.includes('3.109.202.254')) ? envApiUrl : 'https://api.jobs.forgeindiaconnect.in';

export default function App() {
  const [referralCode, setReferralCode] = useState(null);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [redirectNotice, setRedirectNotice] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mRef = params.get('m.ref');
    const standardRef = params.get('ref');

    const rawRef = mRef || standardRef;

    if (rawRef) {
      const cleanRef = rawRef.trim();
      setReferralCode(cleanRef);
      localStorage.setItem('hr_referral', cleanRef);

      // 1. Copy referral code to clipboard as extra safeguard
      if (navigator.clipboard) {
        navigator.clipboard.writeText(cleanRef).catch(() => {});
      }

      // 2. Track click & record IP on backend for deferred deep link matching
      fetch(`${API_URL}/api/users/referral/register-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: cleanRef })
      }).catch(() => {});

      fetch(`${API_URL}/api/users/hr/${cleanRef}/visit`, { method: 'POST' })
        .catch(() => {});

      // 3. Mobile detection
      const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // When opened with ?m.ref=<HR_CODE> on a mobile device:
      // - Automatically redirect to Candidate Mobile App (forgejobs://referral?ref=<HR_CODE>)
      // - If app is not installed (fallback after 1.5s): Automatically trigger Candidate APK download
      if (mRef && isMobileDevice) {
        setRedirectNotice(`Opening Candidate Mobile App (${cleanRef})...`);
        const deepLink = `forgejobs://referral?ref=${encodeURIComponent(cleanRef)}`;

        let appOpened = false;
        const markOpened = () => {
          appOpened = true;
        };

        window.addEventListener('blur', markOpened);
        const onVisChange = () => {
          if (document.hidden) markOpened();
        };
        document.addEventListener('visibilitychange', onVisChange);

        // Attempt redirect to mobile app
        window.location.href = deepLink;

        // Fallback after 1.5s: Trigger Candidate APK download from /api/download/candidate-apk
        const fallbackTimer = setTimeout(() => {
          window.removeEventListener('blur', markOpened);
          document.removeEventListener('visibilitychange', onVisChange);
          if (!appOpened) {
            setRedirectNotice('Downloading Candidate Mobile App APK...');
            window.location.href = `${API_URL}/api/download/candidate-apk`;
          }
        }, 1500);

        return () => {
          clearTimeout(fallbackTimer);
          window.removeEventListener('blur', markOpened);
          document.removeEventListener('visibilitychange', onVisChange);
        };
      }

      // When opened with standard ?ref=<HR_CODE>:
      // Open website normally and save referral code (no redirect or automatic download)
    }
  }, []);

  const [currentUser] = useState({
    id: 'usr_candidate',
    candidateId: 'cand_guest',
    name: '',
    email: '',
    role: 'candidate',
    mobile: '',
    location: '',
    qualification: '',
    experience: '',
    skills: [],
    resumeUrl: ''
  });

  return (
    <div className="app-container">
      {redirectNotice && (
        <div style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          position: 'sticky',
          top: 0,
          zIndex: 9999,
          borderBottom: '2px solid #3b82f6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>📱</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{redirectNotice}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Opening Candidate Mobile App with your HR referral applied</div>
            </div>
          </div>
          <a
            href={`${API_URL}/api/download/candidate-apk`}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}
          >
            Direct APK Download
          </a>
        </div>
      )}

      <CandidateNavbar />

      <main style={{ flex: 1 }}>
        <CandidateView
          API_URL={API_URL}
          currentUser={currentUser}
        />
      </main>

      {/* Candidate Mobile App Download Modal on HR Referral Visit */}
      <CandidateAppDownloadModal
        isOpen={showMobileModal}
        referralCode={referralCode}
        onClose={() => setShowMobileModal(false)}
        API_URL={API_URL}
      />
    </div>
  );
}
