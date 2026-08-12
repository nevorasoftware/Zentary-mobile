import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import VisitasScreen from './src/screens/VisitasScreen';
import PQRSScreen from './src/screens/PQRSScreen';
import PaquetesScreen from './src/screens/PaquetesScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import BottomNavBar, { TabType } from './src/components/BottomNavBar';
import ProfileMenuModal from './src/components/ProfileMenuModal';
import FrequentAccessModal from './src/components/FrequentAccessModal';
import ChangePasswordModal from './src/components/ChangePasswordModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('Visitas');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isFrequentModalOpen, setIsFrequentModalOpen] = useState(false);

  // User state including mustChangePassword and Community Name
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [currentUser, setCurrentUser] = useState({
    fullName: 'María Camila Rodríguez',
    email: 'residente.zentary@gmail.com',
    communityName: 'Residencial Zentary',
    unitNumber: 'Apt 502',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  });

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
  };

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
        user={currentUser}
        onClose={() => setIsProfileMenuOpen(false)}
        onLogout={() => {
          setIsProfileMenuOpen(false);
          alert('Sesión cerrada');
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
        onPasswordChanged={(newPass) => {
          console.log('Password updated successfully:', newPass);
          setMustChangePassword(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2B82FB',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
