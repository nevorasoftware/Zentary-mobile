import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';

interface VisitasScreenProps {
  onOpenFrequentModal?: () => void;
}

export const VisitasScreen: React.FC<VisitasScreenProps> = ({ onOpenFrequentModal }) => {
  const [activeTab, setActiveTab] = useState<'EN_CURSO' | 'HISTORIAL' | 'FRECUENTES'>('EN_CURSO');
  const [showAddModal, setShowAddModal] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorDni, setVisitorDni] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  const handleTabChange = (tab: 'EN_CURSO' | 'HISTORIAL' | 'FRECUENTES') => {
    setActiveTab(tab);
    if (tab === 'FRECUENTES' && onOpenFrequentModal) {
      onOpenFrequentModal();
    }
  };

  const handleSaveVisit = () => {
    if (!visitorName) return;
    alert(`Visita para ${visitorName} registrada con éxito.`);
    setVisitorName('');
    setVisitorDni('');
    setVehiclePlate('');
    setShowAddModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Top Header matching Image 1 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Visitas</Text>
        <TouchableOpacity style={styles.gearButton}>
          <Text style={styles.gearIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Sub Tabs Bar matching Image 1 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'EN_CURSO' && styles.activeTabItem]}
          onPress={() => handleTabChange('EN_CURSO')}
        >
          <Text style={[styles.tabText, activeTab === 'EN_CURSO' && styles.activeTabText]}>
            EN CURSO
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'HISTORIAL' && styles.activeTabItem]}
          onPress={() => handleTabChange('HISTORIAL')}
        >
          <Text style={[styles.tabText, activeTab === 'HISTORIAL' && styles.activeTabText]}>
            HISTORIAL
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'FRECUENTES' && styles.activeTabItem]}
          onPress={() => handleTabChange('FRECUENTES')}
        >
          <Text style={[styles.tabText, activeTab === 'FRECUENTES' && styles.activeTabText]}>
            FRECUENTES
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area matching Empty State Image 1 */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.emptyStateCard}>
          {/* Illustration mock */}
          <View style={styles.illustrationWrap}>
            <View style={styles.mockWindow}>
              <View style={styles.windowHeader} />
              <Text style={styles.sadFace}>😟</Text>
            </View>
          </View>

          <Text style={styles.emptyTitle}>
            {activeTab === 'EN_CURSO'
              ? 'No tienes visitas en curso'
              : activeTab === 'HISTORIAL'
              ? 'No tienes historial de visitas'
              : 'No tienes accesos frecuentes registrados'}
          </Text>

          <Text style={styles.emptySubtitle}>
            Selecciona botón “+” para registrar nuevo acceso
          </Text>
        </View>
      </ScrollView>

      {/* Floating Add Access Button "+" */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Modal to Register New Access */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Registrar Nuevo Acceso</Text>

            <Text style={styles.label}>Nombre completo del visitante *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Juan Pérez"
              value={visitorName}
              onChangeText={setVisitorName}
            />

            <Text style={styles.label}>DNI / Documento Identidad</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 01234567-8"
              value={visitorDni}
              onChangeText={setVisitorDni}
            />

            <Text style={styles.label}>Placa de vehículo (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. P 123-456"
              value={vehiclePlate}
              onChangeText={setVehiclePlate}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveVisit}>
                <Text style={styles.saveBtnText}>Guardar</Text>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 70,
    backgroundColor: '#2B82FB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  gearButton: {
    position: 'absolute',
    right: 20,
    top: 25,
  },
  gearIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTabItem: {
    borderBottomWidth: 3,
    borderBottomColor: '#2B82FB',
  },
  tabText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#2B82FB',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyStateCard: {
    alignItems: 'center',
    maxWidth: 300,
  },
  illustrationWrap: {
    marginBottom: 25,
  },
  mockWindow: {
    width: 100,
    height: 90,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    borderRadius: 12,
    alignItems: 'center',
    paddingTop: 8,
  },
  windowHeader: {
    width: 80,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    marginBottom: 15,
  },
  sadFace: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2B82FB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#2B82FB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
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

export default VisitasScreen;
