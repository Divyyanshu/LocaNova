import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { getApp } from '@react-native-firebase/app';

const App = () => {
  useEffect(() => {
    try {
      const app = getApp();
      console.log('Firebase App:', app.name);
    } catch (e) {
      console.log('Firebase Init Error:', e);
    }
  }, []);

  return <AppNavigator />;
};

export default App;
