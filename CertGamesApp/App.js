// App.js
import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';

enableScreens();


import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import store from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { NetworkProvider } from './src/context/NetworkContext';




// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Main app component with theme context access
const MainApp = () => {
  const { theme } = useTheme();
  
  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={theme.colors.background} 
        translucent={true}
      />
      <AppNavigator />
    </SafeAreaProvider>
  );
};

// Root app component with providers
export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts
        await Font.loadAsync({
          'Orbitron': require('./assets/fonts/Orbitron-Regular.ttf'),
          'Orbitron-Bold': require('./assets/fonts/Orbitron-Bold.ttf'),
          'ShareTechMono': require('./assets/fonts/ShareTechMono-Regular.ttf'),
          'FiraCode': require('./assets/fonts/FiraCode-Regular.ttf'),
        });
      } catch (e) {
        console.warn('Error loading assets:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Hide the splash screen once fonts are loaded
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <Provider store={store}>
      <NetworkProvider>
        <ThemeProvider>
          <SafeAreaProvider>
            <MainApp />
          </SafeAreaProvider>
        </ThemeProvider>
      </NetworkProvider>
    </Provider>
  );
}
