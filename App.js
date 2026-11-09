import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import PatientDashboardScreen from './src/screens/PatientDashboardScreen';
import AppSplashScreen from './src/components/AppSplashScreen';
import UpdateNotificationModal from './src/components/UpdateNotificationModal';
import { VersionService } from './src/api/version';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [autoUpdateInfo, setAutoUpdateInfo] = useState(null);
  const [showAutoUpdateModal, setShowAutoUpdateModal] = useState(false);

  // Check for updates automatically in the background
  useEffect(() => {
    let isMounted = true;
    const checkForAutoUpdate = async () => {
      try {
        const res = await VersionService.checkLatestVersion();
        if (isMounted && res.success && res.hasUpdate) {
          setAutoUpdateInfo(res);
          // Present popup smoothly after splash animation completes
          setTimeout(() => {
            if (isMounted) setShowAutoUpdateModal(true);
          }, 1800);
        }
      } catch (e) {
        // Silent catch for initial background check
      }
    };
    checkForAutoUpdate();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      {isAppLoading ? (
        <AppSplashScreen onFinish={() => setIsAppLoading(false)} />
      ) : currentUser ? (
        <PatientDashboardScreen
          user={currentUser}
          onLogout={() => setCurrentUser(null)}
        />
      ) : (
        <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />
      )}

      {/* Auto-Update Popup Modal */}
      <UpdateNotificationModal
        visible={showAutoUpdateModal}
        updateInfo={autoUpdateInfo}
        onClose={() => setShowAutoUpdateModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff'
  }
});
