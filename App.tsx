import React, { useState, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { StyleSheet, Platform, View, SafeAreaView, StatusBar, ActivityIndicator, Text, Image, Animated, BackHandler } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import VisitasScreen from './src/screens/VisitasScreen';
import PQRSScreen from './src/screens/PQRSScreen';
import PaquetesScreen from './src/screens/PaquetesScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import AmenidadesScreen from './src/screens/AmenidadesScreen';
import DeliveryScreen from './src/screens/DeliveryScreen';
import AuthFlowScreen from './src/screens/AuthFlowScreen';
import BottomNavBar, { TabType } from './src/components/BottomNavBar';
import ProfileMenuModal from './src/components/ProfileMenuModal';
import ChangePasswordModal from './src/components/ChangePasswordModal';
import { apiService, UserProfile } from './src/services/api';
import { deviceService } from './src/services/device';
import { registerForPushNotificationsAsync, setupNotificationListeners } from './src/services/notification';

export default function App() {
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Requirement: Default start tab set to 'Inicio'
  const [currentTab, setCurrentTab] = useState<TabType>('Inicio');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [pendingPqrsId, setPendingPqrsId] = useState<string | null>(null);
  const [autoOpenFastPass, setAutoOpenFastPass] = useState(false);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // First Login Password Change Modal
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Subtle pulse animation for unframed logo on splash screen
  const opacityAnim = useRef(new Animated.Value(0.8)).current;

  // User state
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: '',
    email: '',
    fullName: '',
    role: 'RESIDENT',
  });

  useEffect(() => {
    const animationLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animationLoop.start();
    return () => animationLoop.stop();
  }, [opacityAnim]);

  // Detect offline mode
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false || state.isInternetReachable === false);
    });
    return () => unsubscribe();
  }, []);

  // Restore session
  useEffect(() => {
    apiService.onAuthError(async () => {
      await deviceService.clearSession();
      setIsLoggedIn(false);
    });

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

    const cleanupNotificationListener = setupNotificationListeners((pqrsId) => {
      setPendingPqrsId(pqrsId);
      setIsDeliveryOpen(false);
      setCurrentTab('PQRS');
    });

    return () => {
      apiService.onAuthError(null);
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

  // Botón Atrás de Android: cierra Delivery, luego vuelve a Inicio; en Inicio sale de la app
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isDeliveryOpen) {
        setIsDeliveryOpen(false);
        return true;
      }
      if (currentTab !== 'Inicio') {
        setCurrentTab('Inicio');
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [isDeliveryOpen, currentTab]);

  const handleTabChange = (tab: TabType) => {
    setIsDeliveryOpen(false);
    setCurrentTab(tab);
  };

  // Clean Splash Loading Screen: Unframed Logo, "ZENTARY", Gold #FFCF36 Spinner (No Buildings, No Box Border)
  if (isRestoringSession) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0F1F" />
        <Animated.View style={{ opacity: opacityAnim, marginBottom: 16 }}>
          <Image source={require('./assets/logo.png')} style={styles.cleanSplashLogo} />
        </Animated.View>

        <Text style={styles.splashLogoText}>ZENTARY</Text>
        <Text style={styles.splashSubtitle}>Plataforma Residencial Inteligente</Text>

        <ActivityIndicator size="large" color="#FFCF36" style={{ marginTop: 36 }} />
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
    if (isDeliveryOpen) {
      return <DeliveryScreen onBack={() => setIsDeliveryOpen(false)} />;
    }

    switch (currentTab) {
      case 'Inicio':
        return (
          <HomeScreen
            user={currentUser}
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
            onNavigateToAmenidades={() => setCurrentTab('Amenidades')}
            onNavigateToDelivery={() => setIsDeliveryOpen(true)}
          />
        );
      case 'Visitas':
        return (
          <VisitasScreen
            autoOpenFastPass={autoOpenFastPass}
            userRole={currentUser.role}
          />
        );
      case 'Amenidades':
        return <AmenidadesScreen />;
      case 'PQRS':
        return <PQRSScreen initialPqrsId={pendingPqrsId} onInitialPqrsHandled={() => setPendingPqrsId(null)} />;
      case 'Paquetes':
        return <PaquetesScreen />;
      case 'Pagos':
        return <PaymentsScreen />;
      default:
        return (
          <HomeScreen
            user={currentUser}
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
            onNavigateToAmenidades={() => setCurrentTab('Amenidades')}
            onNavigateToDelivery={() => setIsDeliveryOpen(true)}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F1F" />

      {/* Main Screen Container */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>Sin conexión. Revisa tu internet.</Text>
        </View>
      )}
      <View style={styles.screenContainer}>{renderCurrentScreen()}</View>

      {/* Persistent Bottom Bar */}
      <BottomNavBar
        currentTab={isDeliveryOpen || currentTab === 'Pagos' || currentTab === 'Paquetes' ? 'Inicio' : currentTab}
        onTabChange={handleTabChange}
        onOpenMenu={() => setIsProfileMenuOpen(true)}
      />

      {/* Profile Menu Sheet */}
      <ProfileMenuModal
        visible={isProfileMenuOpen}
        user={{
          fullName: currentUser.fullName || 'Residente',
          email: currentUser.email || '',
          communityName: currentUser.community?.name,
          unitNumber: currentUser.property?.unitNumber,
          avatarUrl: currentUser.avatarUrl,
        }}
        onClose={() => setIsProfileMenuOpen(false)}
        onLogout={async () => {
          await deviceService.clearSession();
          setIsProfileMenuOpen(false);
          setIsLoggedIn(false);
        }}
      />

      {/* Mandatory Change Password Modal for First Login */}
      <ChangePasswordModal
        visible={mustChangePassword}
        onPasswordChanged={async (newPass) => {
          // Si la API falla, el error se propaga al modal para que siga abierto y lo muestre
          const deviceId = await deviceService.getDeviceId();
          const res = await apiService.changePassword(newPass, deviceId);
          if (res.token && res.user) {
            await deviceService.saveSession(res.token, res.user);
          }
          setMustChangePassword(false);
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
  cleanSplashLogo: {
    width: 110,
    height: 110,
    resizeMode: 'contain',
  },
  splashLogoText: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 3,
  },
  splashSubtitle: {
    color: '#FFCF36',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.8,
  },
  authSafeArea: {
    flex: 1,
    // Android 15+ dibuja la app bajo la barra de estado (edge-to-edge)
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#0A0F1F',
  },
  container: {
    flex: 1,
    // Android 15+ dibuja la app bajo la barra de estado (edge-to-edge)
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#0A0F1F',
  },
  offlineBanner: {
    backgroundColor: '#B45309',
    paddingVertical: 6,
    alignItems: 'center',
  },
  offlineBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#0A0F1F',
  },
});
