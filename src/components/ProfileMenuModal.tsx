import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Image, Linking, Alert } from 'react-native';
import Constants from 'expo-constants';
import NotificationSettingsModal from './NotificationSettingsModal';
import { apiService } from '../services/api';

export const PRIVACY_URL = 'https://nevorasoftware.com/#/privacidad';

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
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleRequestDeletion = () => {
    Alert.alert(
      'Solicitar eliminación de cuenta',
      'Se enviará una solicitud a la administración de tu residencial para eliminar tu cuenta y tus datos personales. ¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar solicitud',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.createPqrs({
                category: 'PETICION',
                subject: 'Solicitud de eliminación de cuenta',
                description: 'El usuario solicita eliminar su cuenta y sus datos personales.',
              });
              Alert.alert('Solicitud enviada', 'La administración de tu residencial la atenderá.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo enviar la solicitud.');
            }
          },
        },
      ],
    );
  };

  const initials =
    user.fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('') || '?';
  const unitLabel = [user.communityName, user.unitNumber].filter(Boolean).join(' • ');

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cerrar menú" style={styles.backdrop} activeOpacity={1} onPress={onClose}>
          <View style={styles.sheetContainer} onStartShouldSetResponder={() => true}>
            {/* Top Avatar badge matching Image 4 */}
            <View style={styles.avatarWrapper}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarInitialsBox}>
                  <Text style={styles.avatarInitialsText}>{initials}</Text>
                </View>
              )}
            </View>

            {/* Close button top right */}
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cerrar" style={styles.closeButton} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>

            {/* Profile Name info */}
            <View style={styles.profileHeader}>
              <Text style={styles.userName}>{user.fullName}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              {!!unitLabel && <Text style={styles.userEmail}>{unitLabel}</Text>}
            </View>

            {/* Menu Options */}
            <View style={styles.menuOptions}>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.menuItem}
                onPress={() => setIsNotifModalOpen(true)}
              >
                <View style={styles.menuLeft}>
                  <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.menuIcon}>🔔</Text>
                  <Text style={styles.menuText}>Notificaciones y Recordatorios</Text>
                </View>
                <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.chevron}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity accessibilityRole="link" style={styles.menuItem} onPress={() => Linking.openURL(PRIVACY_URL)}>
                <View style={styles.menuLeft}>
                  <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.menuIcon}>🔒</Text>
                  <Text style={styles.menuText}>Política de privacidad</Text>
                </View>
                <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.chevron}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity accessibilityRole="button" style={styles.menuItem} onPress={handleRequestDeletion}>
                <View style={styles.menuLeft}>
                  <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.menuIcon}>🗑️</Text>
                  <Text style={styles.menuText}>Solicitar eliminación de cuenta</Text>
                </View>
                <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.chevron}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity accessibilityRole="button" style={styles.menuItem} onPress={() => setIsLogoutConfirmOpen(true)}>
                <View style={styles.menuLeft}>
                  <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.menuIcon}>🚪</Text>
                  <Text style={styles.menuText}>Cerrar sesión</Text>
                </View>
                <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Version Footer */}
            <View style={styles.footer}>
              <Text style={styles.versionText}>{Constants.expoConfig?.version ? `V ${Constants.expoConfig.version}` : ''}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isLogoutConfirmOpen} transparent animationType="fade" onRequestClose={() => setIsLogoutConfirmOpen(false)}>
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Cerrar sesión</Text>
            <Text style={styles.confirmMessage}>¿Seguro que deseas cerrar tu sesión?</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity accessibilityRole="button" style={styles.confirmCancelBtn} onPress={() => setIsLogoutConfirmOpen(false)}>
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.confirmLogoutBtn}
                onPress={() => {
                  setIsLogoutConfirmOpen(false);
                  onLogout();
                }}
              >
                <Text style={styles.confirmLogoutText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  avatarInitialsBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#6203FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialsText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 5,
  },
  closeIcon: {
    color: '#6B7280',
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
    minHeight: 44,
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
    color: '#6B7280',
  },
  footer: {
    marginTop: 25,
    alignItems: 'center',
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  confirmMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  confirmCancelBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  confirmCancelText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  confirmLogoutBtn: {
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  confirmLogoutText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  versionText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default ProfileMenuModal;
