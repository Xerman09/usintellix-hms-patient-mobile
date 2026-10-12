import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import PatientDashboardScreen from './src/screens/PatientDashboardScreen';
import { THEME } from './src/constants/theme';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {currentUser ? (
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
