import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { notificationService, AppNotification, NotificationConfig } from '../services/notificationService';
import NotificationSettingsModal from '../components/NotificationSettingsModal';

interface HomeScreenProps {
  onNavigateToVisitas: () => void;
  onNavigateToFastPass?: () => void;
  onNavigateToPaquetes: () => void;
  onNavigateToPQRS: () => void;
  onNavigateToPagos: () => void;
  onNavigateToAmenidades?: () => void;
}

const MOCK_PAYMENTS = [
  {
    id: 'pay-001',
    concept: 'Cuota de Mantenimiento Agosto 2026',
    amount: 85.0,
    dueDate: '30 Ago 2026',
    status: 'PENDING' as const,
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToVisitas,
  onNavigateToFastPass,
  onNavigateToPaquetes,
  onNavigateToPQRS,
  onNavigateToPagos,
  onNavigateToAmenidades,
}) => {
  const [pendingReminder, setPendingReminder] = useState<AppNotification | null>(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [notifConfig, setNotifConfig] = useState<NotificationConfig | null>(null);

  useEffect(() => {
    const loadReminders = async () => {
      const cfg = await notificationService.getConfig();
      setNotifConfig(cfg);

      const reminder = await notificationService.checkPendingPaymentReminder(MOCK_PAYMENTS);
      if (reminder) {
        setPendingReminder(reminder);
      }
    };
    loadReminders();
  }, []);

  return (
    <View style={styles.container}>
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.welcomeRow}>
          <View style={styles.userSection}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
            />
            <View>
              <Text style={styles.greetingText}>¡Hola, María! 👋</Text>
              <Text style={styles.subGreetingText}>Residencial Zentary • Apt 502</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.bellBtn} onPress={() => setIsNotifModalOpen(true)}>
            <Text style={styles.bellIcon}>🔔</Text>
            {pendingReminder && <View style={styles.redBadgeDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Recordatorio de Pago con Estilo Duolingo Badges */}
        {pendingReminder && notifConfig?.enabled && (
          <TouchableOpacity style={styles.reminderCard} onPress={onNavigateToPagos} activeOpacity={0.85}>
            <View style={styles.reminderHeader}>
              <View style={styles.reminderBadge}>
                <Text style={styles.reminderBadgeText}>
                  ⚡ RECORDATORIO ({notifConfig.frequency === 'DAILY' ? 'DIARIO' : 'PARAMETRIZADO'})
                </Text>
              </View>
              <Text style={styles.reminderTime}>{notifConfig.reminderTime}</Text>
            </View>
            <Text style={styles.reminderTitle}>{pendingReminder.title}</Text>
            <Text style={styles.reminderBody}>{pendingReminder.body}</Text>
            <View style={styles.reminderActionRow}>
              <Text style={styles.reminderActionText}>Pagar Cuota del Mes ($85.00) ›</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Action Grid (Iconografía Duolingo 3D + Colores Oficiales) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>ZENTARY PASS</Text>
          </View>
        </View>

        <View style={styles.actionGrid}>
          {/* Fast Pass Highlight */}
          <TouchableOpacity
            style={[styles.actionCard, styles.fastPassCard]}
            onPress={onNavigateToFastPass || onNavigateToVisitas}
            activeOpacity={0.85}
          >
            <View style={[styles.emojiBadge, { backgroundColor: '#FFCF36', borderColor: '#F59E0B' }]}>
              <Text style={styles.actionEmoji}>🏃‍♀️</Text>
            </View>
            <Text style={[styles.actionTitle, { color: '#FFCF36' }]}>Fast Pass</Text>
            <Text style={styles.actionSubtitle}>Invitación rápida QR</Text>
          </TouchableOpacity>

          {/* Visitas */}
          <TouchableOpacity style={styles.actionCard} onPress={onNavigateToVisitas} activeOpacity={0.85}>
            <View style={[styles.emojiBadge, { backgroundColor: '#1877F2', borderColor: '#0B3C91' }]}>
              <Text style={styles.actionEmoji}>👥</Text>
            </View>
            <Text style={styles.actionTitle}>Visitas</Text>
            <Text style={styles.actionSubtitle}>Crear pase QR</Text>
          </TouchableOpacity>

          {/* Amenidades */}
          <TouchableOpacity style={styles.actionCard} onPress={onNavigateToAmenidades} activeOpacity={0.85}>
            <View style={[styles.emojiBadge, { backgroundColor: '#FFCF36', borderColor: '#F59E0B' }]}>
              <Text style={styles.actionEmoji}>🏰</Text>
            </View>
            <Text style={styles.actionTitle}>Amenidades</Text>
            <Text style={styles.actionSubtitle}>Reservar áreas</Text>
          </TouchableOpacity>

          {/* Paquetes */}
          <TouchableOpacity style={styles.actionCard} onPress={onNavigateToPaquetes} activeOpacity={0.85}>
            <View style={[styles.emojiBadge, { backgroundColor: '#6203FF', borderColor: '#2A0A73' }]}>
              <Text style={styles.actionEmoji}>📦</Text>
            </View>
            <Text style={styles.actionTitle}>Paquetes</Text>
            <Text style={styles.actionSubtitle}>Ver entregas</Text>
          </TouchableOpacity>

          {/* PQRS */}
          <TouchableOpacity style={styles.actionCard} onPress={onNavigateToPQRS} activeOpacity={0.85}>
            <View style={[styles.emojiBadge, { backgroundColor: '#1877F2', borderColor: '#0B3C91' }]}>
              <Text style={styles.actionEmoji}>📬</Text>
            </View>
            <Text style={styles.actionTitle}>PQRS</Text>
            <Text style={styles.actionSubtitle}>Reportes y Soporte</Text>
          </TouchableOpacity>

          {/* Pagos Wompi */}
          <TouchableOpacity style={[styles.actionCard, styles.fullWidthCard]} onPress={onNavigateToPagos} activeOpacity={0.85}>
            <View style={styles.fullWidthContent}>
              <View style={[styles.emojiBadge, { backgroundColor: '#FFCF36', borderColor: '#F59E0B' }]}>
                <Text style={styles.actionEmoji}>💳</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Pagos y Mantenimiento Wompi 3DS</Text>
                <Text style={styles.actionSubtitle}>Paga tu cuota de forma 100% segura online</Text>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Anuncios Residenciales */}
        <Text style={styles.sectionTitle}>Anuncios Residenciales</Text>
        <View style={styles.announcementCard}>
          <View style={styles.announcementTag}>
            <Text style={styles.announcementTagText}>📢 MANTENIMIENTO</Text>
          </View>
          <Text style={styles.announcementTitle}>Mantenimiento de Piscina Principal</Text>
          <Text style={styles.announcementBody}>
            Estimados residentes, el área de la piscina permanecerá cerrada el próximo jueves por labores de limpieza general.
          </Text>
          <Text style={styles.announcementDate}>Publicado hoy a las 09:30 AM</Text>
        </View>
      </ScrollView>

      {/* Dialogo de Notificaciones */}
      <NotificationSettingsModal
        visible={isNotifModalOpen}
        onClose={async () => {
          setIsNotifModalOpen(false);
          const updatedCfg = await notificationService.getConfig();
          setNotifConfig(updatedCfg);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1F',
  },
  header: {
    backgroundColor: '#2A0A73',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 3,
    borderBottomColor: '#6203FF',
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFCF36',
  },
  greetingText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  subGreetingText: {
    color: '#FFCF36',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(24, 119, 242, 0.25)',
    borderWidth: 1.5,
    borderColor: '#1877F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    fontSize: 20,
  },
  redBadgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#0A0F1F',
  },
  content: {
    padding: 20,
  },
  reminderCard: {
    backgroundColor: '#1E1240',
    borderRadius: 22,
    padding: 18,
    borderWidth: 2,
    borderColor: '#6203FF',
    borderBottomWidth: 5,
    borderBottomColor: '#2A0A73',
    marginBottom: 22,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderBadge: {
    backgroundColor: '#FFCF36',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reminderBadgeText: {
    color: '#0A0F1F',
    fontSize: 11,
    fontWeight: '900',
  },
  reminderTime: {
    fontSize: 11,
    color: '#FFCF36',
    fontWeight: '700',
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  reminderBody: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 12,
  },
  reminderActionRow: {
    backgroundColor: '#1877F2',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    borderBottomWidth: 3,
    borderBottomColor: '#0B3C91',
  },
  reminderActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  proBadge: {
    backgroundColor: 'rgba(255, 207, 54, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCF36',
  },
  proBadgeText: {
    color: '#FFCF36',
    fontSize: 10,
    fontWeight: '900',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#141A2E',
    borderRadius: 22,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(98, 3, 255, 0.25)',
    borderBottomWidth: 5,
    borderBottomColor: '#2A0A73',
  },
  fastPassCard: {
    backgroundColor: '#1E1240',
    borderColor: '#FFCF36',
    borderBottomColor: '#6203FF',
  },
  fullWidthCard: {
    width: '100%',
    backgroundColor: '#141A2E',
    borderColor: '#1877F2',
    borderBottomColor: '#0B3C91',
  },
  fullWidthContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  chevronIcon: {
    fontSize: 24,
    color: '#FFCF36',
    fontWeight: '900',
  },
  announcementCard: {
    backgroundColor: '#141A2E',
    borderRadius: 22,
    padding: 18,
    borderWidth: 2,
    borderColor: '#6203FF',
    borderLeftWidth: 6,
    borderLeftColor: '#1877F2',
    borderBottomWidth: 4,
    borderBottomColor: '#2A0A73',
    marginBottom: 30,
  },
  announcementTag: {
    backgroundColor: 'rgba(24, 119, 242, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1877F2',
  },
  announcementTagText: {
    color: '#1877F2',
    fontSize: 11,
    fontWeight: '900',
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  announcementBody: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 12,
  },
  announcementDate: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
});

export default HomeScreen;
