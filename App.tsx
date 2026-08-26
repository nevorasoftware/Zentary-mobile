import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, ActivityIndicator, Text } from 'react-native';
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
  const [currentTab, setCurrentTab] = useState<TabType>('Visitas');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isFrequentModalOpen, setIsFrequentModalOpen] = useState(false);
  const [autoOpenFastPass, setAutoOpenFastPass] = useState(false);

  // First Login Password Change Modal
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // User state
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: '',
    email: '',
    fullName: '',
    role: 'RESIDENT',
  });

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
    registerForPushNotificationsAsync(user.email);
  };

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
  };

  // Splash Loading Indicator while restoring session
  if (isRestoringSession) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#2B82FB" />
        <Text style={styles.splashLogoText}>Zentary</Text>
        <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 24 }} />
      </View>
    );
  }

  // If user is not logged in, render the Onboarding & Authentication Flow
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.authSafeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
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
        return <VisitasScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2B82FB" />

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
    backgroundColor: '#2B82FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogoText: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 1,
  },
  authSafeArea: {
    flex: 1,
    backgroundColor: '#3B82F6',
  },
  container: {
    flex: 1,
    backgroundColor: '#2B82FB',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
