import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
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

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabType>('Visitas');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isFrequentModalOpen, setIsFrequentModalOpen] = useState(false);

  // First Login Password Change Modal
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // User state
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: '',
    email: '',
    fullName: '',
    role: 'RESIDENT',
  });

  const handleLoginSuccess = (user: UserProfile, mustChangePass?: boolean) => {
    setCurrentUser(user);
    if (mustChangePass) {
      setMustChangePassword(true);
    }
    setIsLoggedIn(true);
  };

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
  };

  // If user is not logged in, render the Onboarding & Authentication Flow (Images 1, 2, 3)
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
            onNavigateToVisitas={() => setCurrentTab('Visitas')}
            onNavigateToPaquetes={() => setCurrentTab('Paquetes')}
            onNavigateToPQRS={() => setCurrentTab('PQRS')}
            onNavigateToPagos={() => setCurrentTab('Pagos')}
          />
        );
      case 'Visitas':
        return (
          <VisitasScreen
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
        onLogout={() => {
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
            await apiService.changePassword(newPass);
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
