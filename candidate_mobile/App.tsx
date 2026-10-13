import React, { useEffect } from 'react';
import { StatusBar, Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { handleIncomingUrl, syncReferralOnStartup } from './src/services/referralService';

const linking = {
  prefixes: [
    'forgejobs://',
    'ficjobs://',
    'https://jobs.forgeindiaconnect.in',
    'http://jobs.forgeindiaconnect.in',
  ],
  config: {
    screens: {
      Home: {
        path: '',
        exact: false,
      },
      referral: '',
      Jobs: 'jobs',
      JobDetails: 'jobs/:id',
      Apply: 'apply/:id',
      CandidateDashboard: 'dashboard',
    },
  },
};

export default function App(): React.JSX.Element {
  useEffect(() => {
    // 1. Cold-start deep link or deferred referral sync
    Linking.getInitialURL()
      .then((url) => {
        syncReferralOnStartup(url);
      })
      .catch((err) => {
        console.warn('Error reading initial deep link URL:', err);
        syncReferralOnStartup(null);
      });

    // 2. Incoming deep link while app is already running/backgrounded
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('[DeepLink] Received URL:', url);
      handleIncomingUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <StatusBar barStyle="light-content" {...({ backgroundColor: '#0A1128' } as any)} />
      <NavigationContainer linking={linking}>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
