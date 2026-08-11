import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';

export const PQRSScreen: React.FC = () => {
  const [activeSegment, setActiveSegment] = useState<'Chat' | 'PQRS'>('PQRS');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [category, setCategory] = useState<'PETICION' | 'QUEJA' | 'RECLAMO' | 'SUGERENCIA'>('PETICION');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateSubmit = () => {
    if (!subject || !description) return;
    alert(`PQRS creada exitosamente: ${subject}`);
    setSubject('');
    setDescription('');
    setShowCreateModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Top Header matching Image 2 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comunicaciones</Text>
      </View>

      {/* Segmented Control: Chat vs PQRS matching Image 2 */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'Chat' ? styles.segmentActive : styles.segmentInactive]}
          onPress={() => setActiveSegment('Chat')}
        >
          <Text style={[styles.segmentText, activeSegment === 'Chat' && styles.segmentActiveText]}>
            Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'PQRS' ? styles.segmentActive : styles.segmentInactive]}
          onPress={() => setActiveSegment('PQRS')}
        >
          <Text style={[styles.segmentText, activeSegment === 'PQRS' && styles.segmentActiveText]}>
            PQRS
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area matching Image 2 */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Search input matching Image 2 */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Busca tus solicitudes"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Blue "+ Crear nueva PQRS" button matching Image 2 */}
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.createBtnPlus}>+</Text>
          <Text style={styles.createBtnText}>Crear nueva PQRS</Text>
        </TouchableOpacity>

        {/* Empty state matching Image 2 */}
        <View style={styles.emptyState}>
          <View style={styles.inboxIllustration}>
            <Text style={styles.sadEmoji}>😟</Text>
          </View>

          <Text style={styles.emptyTitle}>Nada por aqui...</Text>
          <Text style={styles.emptySubtitle}>
            Hmm, parece que aún no has creado ningún PQRS.
          </Text>
        </View>
      </ScrollView>

      {/* Modal for Creating PQRS */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Crear Nueva PQRS</Text>

            <Text style={styles.label}>Tipo de Solicitud</Text>
            <View style={styles.categoryPickerRow}>
              {(['PETICION', 'QUEJA', 'RECLAMO', 'SUGERENCIA'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catBadge, category === cat && styles.catBadgeActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catText, category === cat && styles.catTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Asunto *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Ruido en áreas comunes"
              value={subject}
              onChangeText={setSubject}
            />

            <Text style={styles.label}>Descripción detallada *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Explica en detalle tu reporte..."
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreateModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateSubmit}>
                <Text style={styles.saveBtnText}>Enviar PQRS</Text>
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
  backButton: {
    position: 'absolute',
    left: 15,
    top: 15,
    padding: 5,
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#2B82FB',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentActive: {
    backgroundColor: '#1D4ED8',
  },
  segmentInactive: {
    backgroundColor: 'transparent',
  },
  segmentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#93C5FD',
  },
  segmentActiveText: {
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 24,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 40,
  },
  createBtnPlus: {
    color: '#2B82FB',
    fontSize: 20,
    fontWeight: 'bold',
  },
  createBtnText: {
    color: '#2B82FB',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 20,
  },
  inboxIllustration: {
    width: 100,
    height: 80,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  sadEmoji: {
    fontSize: 34,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 20,
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
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  catBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  catBadgeActive: {
    backgroundColor: '#2B82FB',
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  catTextActive: {
    color: '#FFFFFF',
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
  textArea: {
    height: 90,
    textAlignVertical: 'top',
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

export default PQRSScreen;
