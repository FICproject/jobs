export const theme = {
  colors: {
    primary: '#0f172a',      // Dark slate navy
    primaryLight: '#1e293b', // Card/Header navy
    secondary: '#f59e0b',    // Gold / Amber accent
    secondaryLight: '#fef3c7',
    accent: '#3b82f6',       // Vivid blue
    accentLight: '#eff6ff',
    
    background: '#f8fafc',   // Soft light background
    cardBackground: '#ffffff',
    surface: '#ffffff',
    
    textMain: '#0f172a',     // Dark slate text
    textMuted: '#64748b',    // Gray text
    textSubtle: '#94a3b8',
    textWhite: '#ffffff',
    
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    
    // Status colors
    statusApplied: '#2563eb',
    statusAppliedBg: '#dbeafe',
    statusShortlisted: '#d97706',
    statusShortlistedBg: '#fef3c7',
    statusInterview: '#7c3aed',
    statusInterviewBg: '#ede9fe',
    statusSelected: '#16a34a',
    statusSelectedBg: '#dcfce7',
    statusRejected: '#dc2626',
    statusRejectedBg: '#fee2e2',
    statusPending: '#d97706',
    statusPendingBg: '#fef3c7',
    
    success: '#10b981',
    successBg: '#ecfdf5',
    warning: '#f59e0b',
    warningBg: '#fffbeb',
    danger: '#ef4444',
    dangerBg: '#fef2f2',
    info: '#0284c7',
    infoBg: '#f0f9ff',
  },
  typography: {
    h1: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
    h2: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
    h3: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    subtitle: { fontSize: 13, fontWeight: '400', color: '#64748b' },
    body: { fontSize: 14, fontWeight: '400', color: '#334155' },
    bodyBold: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    caption: { fontSize: 12, fontWeight: '500', color: '#64748b' },
    badge: { fontSize: 11, fontWeight: '700' },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 6,
    },
  }
};
