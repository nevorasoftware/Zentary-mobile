import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { notificationService, NotificationConfig } from '../services/notificationService';

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const [config, setConfig] = useState<NotificationConfig>({
    enabled: true,
    frequency: 'DAILY',
    reminderTime: '09:00 AM',
    soundEnabled: true,
  });

  useEffect(() => {
    if (visible) {
      notificationService.getConfig().then(setConfig);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🔔 Centro de Notificaciones</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.adminBadgeBox}>
              <Text style={styles.adminBadgeTitle}>🛡️ CONFIGURACIÓN ADMINISTRATIVA</Text>
              <Text style={styles.adminBadgeSub}>
                Los parámetros de recordatorios de pago y anuncios residenciales son gestionados directamente por la Administración de Zentary.
              </Text>
            </View>

            <View style={styles.cardSection}>
              <Text style={styles.sectionLabel}>RECORDATORIOS</Text>
              <Text style={styles.adminBadgeSub}>No tienes recordatorios activos.</Text>
            </View>

            <TouchableOpacity style={styles.closeActionBtn} onPress={onClose}>
              <Text style={styles.closeActionBtnText}>Entendido</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  adminBadgeBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  adminBadgeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  adminBadgeSub: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 17,
  },
  cardSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  reminderCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reminderTypeTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  statusActiveBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#78350F',
    marginBottom: 6,
  },
  reminderBody: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
    marginBottom: 12,
  },
  metaDivider: {
    height: 1,
    backgroundColor: '#FCD34D',
    marginVertical: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: '#B45309',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#78350F',
  },
  closeActionBtn: {
    backgroundColor: '#1D6BE0',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  closeActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default NotificationSettingsModal;
