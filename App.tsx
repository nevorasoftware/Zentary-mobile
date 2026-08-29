import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, ActivityIndicator, Text, Image, Animated } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import VisitasScreen from './src/screens/VisitasScreen';
import PQRSScreen from './src/screens/PQRSScreen';
import PaquetesScreen from './src/screens/PaquetesScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import AuthFlowScreen from './src/screens/AuthFlowScreen';
import BottomNavBar, { TabType } from './src/components/BottomNavBar';
import ProfileMenuModal from './src/components/ProfileMenuModal';
import FrequentAccessModal from './src/components/FrequentAccessModal';
import ChangePasswordModal from './src/components/ChangePasswordModal';
import { apiService, UserProfile } from './src/services/api';
import { deviceService } from './src/services/device';
import { registerForPushNotificationsAsync, setupNotificationListeners } from './src/services/notification';

export default function App() {
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Requirement 3: Start default screen at 'Inicio' instead of 'Visitas'
  const [currentTab, setCurrentTab] = useState<TabType>('Inicio');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isFrequentModalOpen, setIsFrequentModalOpen] = useState(false);
  const [autoOpenFastPass, setAutoOpenFastPass] = useState(false);

  // First Login Password Change Modal
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Animation values for building splash screen
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;

  // User state
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: '',
    email: '',
    fullName: '',
    role: 'RESIDENT',
  });

  // Building Pulse Animation effect during splash loading
  useEffect(() => {
    const animationLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    animationLoop.start();
    return () => animationLoop.stop();
  }, [pulseAnim, opacityAnim]);

  // Restore and silently renew session on app launch + Push Deep Linking
  useEffect(() => {
    const checkSavedSession = async () => {
      try {
        const session = await deviceService.restoreAndRenewSession();
        if (session.loggedIn && session.user) {
          setCurrentUser(session.user);
          if (session.mustChangePassword) {
            setMustChangePassword(true);
          }
          setIsLoggedIn(true);
          registerForPushNotificationsAsync(session.user.email);
        }
      } catch (err) {
        console.log('Error restoring session:', err);
      } finally {
        setIsRestoringSession(false);
      }
    };
    checkSavedSession();

    const cleanupNotificationListener = setupNotificationListeners((_pqrsId) => {
      setCurrentTab('PQRS');
    });

    return () => {
      cleanupNotificationListener();
    };
  }, []);

  const handleLoginSuccess = (user: UserProfile, mustChangePass?: boolean) => {
    setCurrentUser(user);
    if (mustChangePass) {
      setMustChangePassword(true);
    }
    setIsLoggedIn(true);
    setCurrentTab('Inicio');
    registerForPushNotificationsAsync(user.email);
  };

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
  };

  // Requirement 2: Splash Loading Screen with Zentary logo and animated building skyline
  if (isRestoringSession) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0F1F" />
        <Animated.View
          style={[
            styles.splashLogoWrapper,
            {
              transform: [{ scale: pulseAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Image source={require('./assets/logo.png')} style={styles.splashLogoImage} />
        </Animated.View>

        <Text style={styles.splashLogoText}>ZENTARY</Text>
        <Text style={styles.splashSubtitle}>Plataforma Residencial Inteligente</Text>

        {/* Building Silhouette Animated Icon */}
        <Animated.View style={[styles.buildingSkyline, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.buildingIcons}>🏢 🏙️ 🏢</Text>
        </Animated.View>

        <ActivityIndicator size="large" color="#FFCF36" style={{ marginTop: 28 }} />
      </View>
    );
  }

  // If user is not logged in, render the Onboarding & Authentication Flow
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.authSafeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0F1F" />
        <AuthFlowScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaView>
    );
  }

  const renderCurrentScreen = () => {
    switch (currentTab) {
      case 'Inicio':
        return (
          <HomeScreen
            onNavigateToVisitas={() => {
              setAutoOpenFastPass(false);
              setCurrentTab('Visitas');
            }}
            onNavigateToFastPass={() => {
              setAutoOpenFastPass(true);
              setCurrentTab('Visitas');
            }}
            onNavigateToPaquetes={() => setCurrentTab('Paquetes')}
            onNavigateToPQRS={() => setCurrentTab('PQRS')}
            onNavigateToPagos={() => setCurrentTab('Pagos')}
          />
        );
      case 'Visitas':
        return (
          <VisitasScreen
            autoOpenFastPass={autoOpenFastPass}
            onOpenFrequentModal={() => setIsFrequentModalOpen(true)}
          />
        );
      case 'PQRS':
        return <PQRSScreen />;
      case 'Paquetes':
        return <PaquetesScreen />;
      case 'Pagos':
        return <PaymentsScreen />;
      default:
        return (
          <HomeScreen
            onNavigateToVisitas={() => {
              setAutoOpenFastPass(false);
              setCurrentTab('Visitas');
            }}
            onNavigateToFastPass={() => {
              setAutoOpenFastPass(true);
              setCurrentTab('Visitas');
            }}
            onNavigateToPaquetes={() => setCurrentTab('Paquetes')}
            onNavigateToPQRS={() => setCurrentTab('PQRS')}
            onNavigateToPagos={() => setCurrentTab('Pagos')}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F1F" />

      {/* Main Screen Container */}
      <View style={styles.screenContainer}>{renderCurrentScreen()}</View>

      {/* Persistent Bottom Bar */}
      <BottomNavBar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onOpenMenu={() => setIsProfileMenuOpen(true)}
      />

      {/* Profile Menu Sheet */}
      <ProfileMenuModal
        visible={isProfileMenuOpen}
        user={{
          fullName: currentUser.fullName || 'Residente',
          email: currentUser.email || '',
          communityName: 'Residencial Zentary',
          unitNumber: 'Casa / Apt',
          avatarUrl: currentUser.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        }}
        onClose={() => setIsProfileMenuOpen(false)}
        onLogout={async () => {
          await deviceService.clearSession();
          setIsProfileMenuOpen(false);
          setIsLoggedIn(false);
        }}
      />

      {/* Frequent Access Dialog Modal */}
      <FrequentAccessModal
        visible={isFrequentModalOpen}
        onClose={() => setIsFrequentModalOpen(false)}
        onDonotShowAgainChange={(checked) => {
          console.log('Hide frequent access banner:', checked);
        }}
      />

      {/* Mandatory Change Password Modal for First Login */}
      <ChangePasswordModal
        visible={mustChangePassword}
        onPasswordChanged={async (newPass) => {
          try {
            const deviceId = await deviceService.getDeviceId();
            const res = await apiService.changePassword(newPass, deviceId);
            if (res.token && res.user) {
              await deviceService.saveSession(res.token, res.user);
            }
            setMustChangePassword(false);
          } catch (e) {
            console.error('Error changing password:', e);
            setMustChangePassword(false);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#0A0F1F',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  splashLogoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#FFCF36',
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1240',
  },
  splashLogoImage: {
    width: 88,
    height: 88,
    resizeMode: 'contain',
  },
  splashLogoText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
  },
  splashSubtitle: {
    color: '#FFCF36',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  buildingSkyline: {
    marginTop: 32,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(98, 3, 255, 0.15)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#6203FF',
  },
  buildingIcons: {
    fontSize: 36,
    letterSpacing: 8,
  },
  authSafeArea: {
    flex: 1,
    backgroundColor: '#0A0F1F',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0F1F',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#0A0F1F',
  },
});
