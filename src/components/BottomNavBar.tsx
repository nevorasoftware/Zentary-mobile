import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type TabType = 'Inicio' | 'Visitas' | 'Amenidades' | 'PQRS' | 'Paquetes' | 'Pagos' | 'Menú';

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
    { id: 'Visitas', label: 'Visitas', icon: '⚡' },
    { id: 'Amenidades', label: 'Amenidades', icon: '🏰' },
    { id: 'PQRS', label: 'PQRS', icon: '💬' },
    { id: 'Menú', label: 'Menú', icon: '👑' },
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
            activeOpacity={0.8}
            style={[styles.tabButton, isActive && styles.activeTabButton]}
            onPress={() => handlePress(tab.id)}
          >
            <View style={[styles.iconBadge, isActive && styles.activeIconBadge]}>
              <Text style={[styles.tabIcon, isActive && styles.activeIcon]}>{tab.icon}</Text>
            </View>
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
    height: 76,
    backgroundColor: '#0A0F1F',
    borderTopWidth: 2,
    borderTopColor: '#2A0A73',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    elevation: 12,
    shadowColor: '#6203FF',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeTabButton: {
    backgroundColor: 'rgba(98, 3, 255, 0.15)',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(42, 10, 115, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeIconBadge: {
    backgroundColor: '#1877F2',
    borderColor: '#FFCF36',
    borderWidth: 2,
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  tabIcon: {
    fontSize: 20,
  },
  activeIcon: {
    transform: [{ scale: 1.15 }],
  },
  tabLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  activeLabel: {
    color: '#FFCF36',
    fontWeight: '900',
  },
});

export default BottomNavBar;
