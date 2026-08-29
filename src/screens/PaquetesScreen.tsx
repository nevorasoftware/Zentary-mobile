import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';

interface CarrierOption {
  id: string;
  name: string;
  bgColor: string;
  textColor: string;
  logoText: string;
  subText?: string;
  isCustom?: boolean;
}

const CARRIERS: CarrierOption[] = [
  {
    id: 'CARGO_EXPRESS',
    name: 'Cargo Express',
    bgColor: '#FFFFFF',
    textColor: '#DC2626',
    logoText: 'USA CARGO EXPRESS',
  },
  {
    id: 'DHL',
    name: 'DHL',
    bgColor: '#FFCC00',
    textColor: '#D97706',
    logoText: 'DHL',
  },
  {
    id: 'FEDEX',
    name: 'Fedex',
    bgColor: '#FFFFFF',
    textColor: '#4F46E5',
    logoText: 'FedEx Express',
  },
  {
    id: 'TRANS_EXPRESS',
    name: 'Trans Express',
    bgColor: '#1E293B',
    textColor: '#FFFFFF',
    logoText: 'TRANS-EXPRESS',
  },
  {
    id: 'UPS',
    name: 'UPS',
    bgColor: '#FFFFFF',
    textColor: '#B45309',
    logoText: 'ups',
  },
  {
    id: 'OTRO',
    name: 'Otro',
    bgColor: '#FFFFFF',
    textColor: '#2563EB',
    logoText: '👤',
    subText: '+',
    isCustom: true,
  },
];

export const PaquetesScreen: React.FC = () => {
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierOption | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [customName, setCustomName] = useState('');

  const handleSelectCarrier = (carrier: CarrierOption) => {
    setSelectedCarrier(carrier);
  };

  const handleSaveParcel = () => {
    if (!selectedCarrier) return;
    const name = selectedCarrier.isCustom ? customName || 'Otro' : selectedCarrier.name;
    alert(`Paquete de ${name} registrado correctamente.`);
    setSelectedCarrier(null);
    setTrackingNumber('');
    setCustomName('');
  };

  return (
    <View style={styles.container}>
      {/* Top Header matching Image 3 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paquete</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Grid of Carriers matching Image 3 */}
        <View style={styles.grid}>
          {CARRIERS.map((item) => (
            <View key={item.id} style={styles.gridItem}>
              <TouchableOpacity
                style={[styles.carrierCard, { backgroundColor: item.bgColor }]}
                onPress={() => handleSelectCarrier(item)}
              >
                {item.isCustom ? (
                  <View style={styles.customAvatarWrap}>
                    <Text style={styles.customIcon}>👤</Text>
                    <View style={styles.plusBadge}>
                      <Text style={styles.plusBadgeText}>+</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.carrierLogoText, { color: item.textColor }]}>
                    {item.logoText}
                  </Text>
                )}
              </TouchableOpacity>
              <Text style={styles.carrierName}>{item.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Parcel Detail Modal */}
      <Modal visible={!!selectedCarrier} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Registrar Recepción de Paquete: {selectedCarrier?.name}
            </Text>

            {selectedCarrier?.isCustom && (
              <>
                <Text style={styles.label}>Nombre de la Paquetería / Transportista *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Delivery Local / Correos"
                  value={customName}
                  onChangeText={setCustomName}
                />
              </>
            )}

            <Text style={styles.label}>Código de Rastreo / Guía (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 1Z9999999999999999"
              value={trackingNumber}
              onChangeText={setTrackingNumber}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedCarrier(null)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveParcel}>
                <Text style={styles.saveBtnText}>Registrar</Text>
              </TouchableOpacity>
            </View>
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
    height: 80,
    backgroundColor: '#2A0A73',
    borderBottomWidth: 3,
    borderBottomColor: '#6203FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: 20,
    padding: 5,
  },
  backArrow: {
    color: '#FFCF36',
    fontSize: 32,
    fontWeight: '900',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  content: {
    padding: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 24,
  },
  gridItem: {
    width: '30%',
    alignItems: 'center',
  },
  carrierCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginBottom: 8,
  },
  carrierLogoText: {
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  customAvatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customIcon: {
    fontSize: 36,
  },
  plusBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#2563EB',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  carrierName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#2B82FB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default PaquetesScreen;
