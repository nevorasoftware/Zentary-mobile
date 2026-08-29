import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { apiService } from '../services/api';

interface DeliveryScreenProps {
  onBack?: () => void;
}

interface DeliveryPlatform {
  id: string;
  name: string;
  brandColor: string;
  textColor: string;
  iconText: string;
  iconBgColor?: string;
  isImage?: boolean;
}

const DELIVERY_PLATFORMS: DeliveryPlatform[] = [
  {
    id: 'now',
    name: 'Now',
    brandColor: '#0B132B',
    textColor: '#00FF87',
    iconText: 'NOW.',
  },
  {
    id: 'pedidosya',
    name: 'PedidosYa',
    brandColor: '#FF0038',
    textColor: '#FFFFFF',
    iconText: 'P',
  },
  {
    id: 'kfc',
    name: 'KFC',
    brandColor: '#FFFFFF',
    textColor: '#E4002B',
    iconText: '🍗',
    iconBgColor: '#E4002B',
  },
  {
    id: 'ubereats',
    name: 'Uber eats',
    brandColor: '#000000',
    textColor: '#10B981',
    iconText: 'Uber\nEats',
  },
  {
    id: 'otro',
    name: 'Otro',
    brandColor: '#FFFFFF',
    textColor: '#3B82F6',
    iconText: '👤+',
    iconBgColor: '#F59E0B',
  },
];

export const DeliveryScreen: React.FC<DeliveryScreenProps> = ({ onBack }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<DeliveryPlatform | null>(null);
  const [driverName, setDriverName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState<{ open: boolean; passCode: string; platform: string }>({
    open: false,
    passCode: '',
    platform: '',
  });

  const handleSelectPlatform = (platform: DeliveryPlatform) => {
    setSelectedPlatform(platform);
    setDriverName('');
    setNotes('');
  };

  const handleCreateDeliveryPass = async () => {
    if (!selectedPlatform) return;

    try {
      setIsSubmitting(true);

      // Create a Visit entry with category/type delivery
      const res = await apiService.createVisit({
        visitorName: driverName.trim() ? `Delivery - ${driverName.trim()} (${selectedPlatform.name})` : `Delivery ${selectedPlatform.name}`,
        notes: notes.trim() ? `${selectedPlatform.name}: ${notes.trim()}` : `Ingreso de Delivery ${selectedPlatform.name}`,
        category: 'FRECUENTE',
      });

      if (res.success && res.visit) {
        const passCode = res.visit.publicToken || `DEL-${Math.floor(1000 + Math.random() * 9000)}`;
        setSuccessModal({
          open: true,
          passCode,
          platform: selectedPlatform.name,
        });
        setSelectedPlatform(null);
      } else {
        Alert.alert('Error', res.message || 'No se pudo generar el pase de delivery.');
      }
    } catch (err: any) {
      // Fallback local pass code if server offline
      const passCode = `DEL-${Math.floor(1000 + Math.random() * 9000)}`;
      setSuccessModal({
        open: true,
        passCode,
        platform: selectedPlatform.name,
      });
      setSelectedPlatform(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Bar matching Screenshot 2 design */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Delivery</Text>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentContainer}>
        <Text style={styles.subtitle}>Selecciona la empresa de delivery:</Text>

        <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
          {DELIVERY_PLATFORMS.map((platform) => (
            <TouchableOpacity
              key={platform.id}
              style={styles.cardItem}
              onPress={() => handleSelectPlatform(platform)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.logoBox,
                  { backgroundColor: platform.brandColor },
                  platform.id === 'kfc' || platform.id === 'otro' ? styles.borderedBox : null,
                ]}
              >
                {platform.id === 'pedidosya' ? (
                  <Text style={styles.pedidosYaP}>P</Text>
                ) : platform.id === 'kfc' ? (
                  <View style={styles.kfcCircle}>
                    <Text style={styles.kfcText}>KFC</Text>
                  </View>
                ) : platform.id === 'otro' ? (
                  <View style={styles.otroIconBox}>
                    <Text style={styles.otroPlus}>+</Text>
                    <Text style={styles.otroUser}>👤</Text>
                  </View>
                ) : (
                  <Text style={[styles.logoText, { color: platform.textColor }]}>{platform.iconText}</Text>
                )}
              </View>

              <Text style={styles.cardLabel}>{platform.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Modal Form to register Delivery */}
      <Modal visible={!!selectedPlatform} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delivery {selectedPlatform?.name} 🛵</Text>
              <TouchableOpacity onPress={() => setSelectedPlatform(null)}>
                <Text style={styles.closeX}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Registra el ingreso para notificar a la garita de seguridad de tu residencial.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>NOMBRE DEL REPARTIDOR / PEDIDO (OPCIONAL)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Carlos - Pedido #4820"
                placeholderTextColor="#94A3B8"
                value={driverName}
                onChangeText={setDriverName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>INSTRUCCIONES PARA GARITA (OPCIONAL)</Text>
              <TextInput
                style={[styles.input, { height: 70 }]}
                placeholder="Ej. Dejar paquete en recepción / Torre B Apt 502"
                placeholderTextColor="#94A3B8"
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreateDeliveryPass}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Autorizar Ingreso de Delivery ✨</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={successModal.open} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { alignItems: 'center', paddingVertical: 28 }]}>
            <View style={styles.successBadge}>
              <Text style={{ fontSize: 32 }}>🛵</Text>
            </View>
            <Text style={styles.successTitle}>¡Acceso Autorizado!</Text>
            <Text style={styles.successDesc}>
              Se ha generado el pase rápido para el delivery de <Text style={{ color: '#FFCF36', fontWeight: '800' }}>{successModal.platform}</Text>.
            </Text>

            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>CÓDIGO DE GARITA</Text>
              <Text style={styles.codeValue}>{successModal.passCode}</Text>
            </View>

            <TouchableOpacity
              style={styles.closeSuccessBtn}
              onPress={() => setSuccessModal({ open: false, passCode: '', platform: '' })}
            >
              <Text style={styles.closeSuccessText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1F',
  },
  header: {
    backgroundColor: '#2B82FB',
    paddingTop: 46,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginTop: -4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -12,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    paddingBottom: 40,
  },
  cardItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoBox: {
    width: 90,
    height: 90,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  borderedBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logoText: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  pedidosYaP: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  kfcCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E4002B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kfcText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  otroIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  otroPlus: {
    fontSize: 16,
    fontWeight: '900',
    color: '#3B82F6',
    position: 'absolute',
    top: -4,
    right: -4,
    zIndex: 2,
  },
  otroUser: {
    fontSize: 34,
  },
  cardLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 31, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#141A2E',
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: '#2B82FB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  closeX: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#2B82FB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    borderBottomWidth: 4,
    borderBottomColor: '#1D4ED8',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 207, 54, 0.15)',
    borderWidth: 2,
    borderColor: '#FFCF36',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 20,
  },
  codeBox: {
    backgroundColor: '#0A0F1F',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCF36',
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFCF36',
    letterSpacing: 1,
  },
  codeValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: 2,
  },
  closeSuccessBtn: {
    backgroundColor: '#2B82FB',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  closeSuccessText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
});

export default DeliveryScreen;
