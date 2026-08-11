import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface HomeScreenProps {
  onNavigateToVisitas: () => void;
  onNavigateToPaquetes: () => void;
  onNavigateToPQRS: () => void;
  onNavigateToPagos: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToVisitas,
  onNavigateToPaquetes,
  onNavigateToPQRS,
  onNavigateToPagos,
}) => {
  return (
    <View style={styles.container}>
      {/* Blue Top Welcome Card */}
      <View style={styles.header}>
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.greetingText}>¡Hola, María!</Text>
            <Text style={styles.subGreetingText}>Residencia Zentary • Apt 502</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Quick Access Actions Grid */}
        <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={onNavigateToVisitas}>
            <Text style={styles.actionEmoji}>👥</Text>
            <Text style={styles.actionTitle}>Visitas</Text>
            <Text style={styles.actionSubtitle}>Crear pase QR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={onNavigateToPaquetes}>
            <Text style={styles.actionEmoji}>📦</Text>
            <Text style={styles.actionTitle}>Paquetes</Text>
            <Text style={styles.actionSubtitle}>Ver entregas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={onNavigateToPQRS}>
            <Text style={styles.actionEmoji}>📬</Text>
            <Text style={styles.actionTitle}>PQRS</Text>
            <Text style={styles.actionSubtitle}>Reportes y Soporte</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={onNavigateToPagos}>
            <Text style={styles.actionEmoji}>💳</Text>
            <Text style={styles.actionTitle}>Pagos</Text>
            <Text style={styles.actionSubtitle}>Mantenimiento</Text>
          </TouchableOpacity>
        </View>

        {/* Community Announcements Card */}
        <Text style={styles.sectionTitle}>Anuncios Residenciales</Text>
        <View style={styles.announcementCard}>
          <View style={styles.announcementTag}>
            <Text style={styles.announcementTagText}>MANTENIMIENTO</Text>
          </View>
          <Text style={styles.announcementTitle}>Mantenimiento de Piscina Principal</Text>
          <Text style={styles.announcementBody}>
            Estimados residentes, el área de la piscina permanecerá cerrada el próximo jueves por labores de limpieza general.
          </Text>
          <Text style={styles.announcementDate}>Publicado hoy a las 09:30 AM</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#2B82FB',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 25,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subGreetingText: {
    color: '#DBEAFE',
    fontSize: 14,
    marginTop: 4,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    fontSize: 20,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 14,
    marginTop: 10,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#2B82FB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  announcementTag: {
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  announcementTagText: {
    color: '#2B82FB',
    fontSize: 11,
    fontWeight: 'bold',
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  announcementBody: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 12,
  },
  announcementDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});

export default HomeScreen;
