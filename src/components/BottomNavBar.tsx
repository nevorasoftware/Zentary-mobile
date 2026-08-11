import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type TabType = 'Inicio' | 'Visitas' | 'PQRS' | 'Paquetes' | 'Pagos' | 'Menú';

interface BottomNavBarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenMenu: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onTabChange,
  onOpenMenu,
}) => {
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'Inicio', label: 'Inicio', icon: '🏠' },
    { id: 'Visitas', label: 'Visitas', icon: '👥' },
    { id: 'PQRS', label: 'PQRS', icon: '📬' },
    { id: 'Menú', label: 'Menú', icon: '🎛️' },
  ];

  const handlePress = (tabId: TabType) => {
    if (tabId === 'Menú') {
      onOpenMenu();
    } else {
      onTabChange(tabId);
    }
  };

  return (
    <View style={styles.navContainer}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => handlePress(tab.id)}
          >
            <Text style={[styles.tabIcon, isActive && styles.activeIcon]}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, isActive && styles.activeLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  activeIcon: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#2B82FB',
    fontWeight: 'bold',
  },
});

export default BottomNavBar;
