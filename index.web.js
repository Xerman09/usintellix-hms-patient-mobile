import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';

// Register the React Native App component
AppRegistry.registerComponent('PatientMobileApp', () => App);

// Generate and insert react-native-web styleSheet into DOM
const rootTag = document.getElementById('root');
if (rootTag) {
  AppRegistry.runApplication('PatientMobileApp', {
    initialProps: {},
    rootTag
  });
} else {
  window.addEventListener('DOMContentLoaded', () => {
    AppRegistry.runApplication('PatientMobileApp', {
      initialProps: {},
      rootTag: document.getElementById('root')
    });
  });
}
