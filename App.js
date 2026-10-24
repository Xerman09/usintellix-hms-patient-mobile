import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import PatientDashboardScreen from './src/screens/PatientDashboardScreen';
import AppSplashScreen from './src/components/AppSplashScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAppLoading, setIsAppLoading] = useState(true);

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
