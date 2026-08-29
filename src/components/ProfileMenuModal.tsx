import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Image } from 'react-native';
import NotificationSettingsModal from './NotificationSettingsModal';

interface ProfileMenuModalProps {
  visible: boolean;
  user: {
    fullName: string;
    email: string;
    communityName?: string;
    unitNumber?: string;
    avatarUrl?: string;
  };
  onClose: () => void;
  onLogout: () => void;
}

export const ProfileMenuModal: React.FC<ProfileMenuModalProps> = ({
  visible,
  user,
  onClose,
  onLogout,
}) => {
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  return (
    <>
      <Modal visible={visible} transparent animationType="slide">
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
          <View style={styles.sheetContainer}>
            {/* Top Avatar badge matching Image 4 */}
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri: user.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
                }}
                style={styles.avatarImage}
              />
            </View>

            {/* Close button top right */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>

            {/* Profile Name info */}
            <View style={styles.profileHeader}>
              <Text style={styles.userName}>{user.fullName}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>

            {/* Menu Options */}
            <View style={styles.menuOptions}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setIsNotifModalOpen(true)}
              >
                <View style={styles.menuLeft}>
                  <Text style={styles.menuIcon}>🔔</Text>
                  <Text style={styles.menuText}>Notificaciones y Recordatorios</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setIsNotifModalOpen(true)}
              >
                <View style={styles.menuLeft}>
                  <Text style={styles.menuIcon}>⚙️</Text>
                  <Text style={styles.menuText}>Configuraciones</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <Text style={styles.menuIcon}>🎧</Text>
                  <Text style={styles.menuText}>Soporte técnico</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
                <View style={styles.menuLeft}>
                  <Text style={styles.menuIcon}>🚪</Text>
                  <Text style={styles.menuText}>Cerrar sesión</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Version Footer */}
            <View style={styles.footer}>
              <Text style={styles.versionText}>V 2.52.0</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <NotificationSettingsModal
        visible={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingBottom: 30,
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#F3F4F6',
    marginTop: -45,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 5,
  },
  closeIcon: {
    color: '#9CA3AF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  menuOptions: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    fontSize: 18,
  },
  menuText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  footer: {
    marginTop: 25,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default ProfileMenuModal;
