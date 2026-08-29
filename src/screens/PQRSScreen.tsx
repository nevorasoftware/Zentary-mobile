import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { apiService, PqrsItem, PqrsDetailItem } from '../services/api';

export const PQRSScreen: React.FC = () => {
  const [activeSegment, setActiveSegment] = useState<'Chat' | 'PQRS'>('PQRS');
  const [searchQuery, setSearchQuery] = useState('');
  const [pqrsList, setPqrsList] = useState<PqrsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [category, setCategory] = useState<'PETICION' | 'QUEJA' | 'RECLAMO' | 'SUGERENCIA'>('PETICION');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail & Chat Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPqrs, setSelectedPqrs] = useState<PqrsDetailItem | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const fetchPqrsList = async (query = '', isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await apiService.getPqrsList(query);
      if (res.success && res.pqrsList) {
        setPqrsList(res.pqrsList);
      }
    } catch (error: any) {
      console.log('Error fetching PQRS list:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPqrsList(searchQuery);
  }, [searchQuery]);

  const handleCreateSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Campos requeridos', 'Por favor ingresa un asunto y descripción.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiService.createPqrs({
        category,
        subject: subject.trim(),
        description: description.trim(),
      });

      if (res.success) {
        Alert.alert('PQRS Creada', 'Tu solicitud ha sido enviada a la administración con éxito.');
        setSubject('');
        setDescription('');
        setShowCreateModal(false);
        fetchPqrsList();
      } else {
        Alert.alert('Error', 'No se pudo crear la solicitud.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Ocurrió un error al guardar la PQRS.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDetail = async (pqrsId: string) => {
    setShowDetailModal(true);
    setIsLoadingDetail(true);
    try {
      const res = await apiService.getPqrsDetail(pqrsId);
      if (res.success && res.pqrs) {
        setSelectedPqrs(res.pqrs);
      }
    } catch (error) {
      console.log('Error loading PQRS detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedPqrs || !replyText.trim() || isSendingReply) return;

    setIsSendingReply(true);
    const messageContent = replyText.trim();
    setReplyText('');

    try {
      const res = await apiService.sendPqrsMessage(selectedPqrs.id, messageContent);
      if (res.success && res.message) {
        setSelectedPqrs((prev) =>
          prev
            ? {
                ...prev,
                messages: [...(prev.messages || []), res.message],
              }
            : null
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar el mensaje.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
            <Text style={[styles.statusBadgeText, { color: '#B45309' }]}>ABIERTA</Text>
          </View>
        );
      case 'IN_PROGRESS':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' }]}>
            <Text style={[styles.statusBadgeText, { color: '#1E40AF' }]}>EN PROCESO</Text>
          </View>
        );
      case 'RESOLVED':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5', borderColor: '#10B981' }]}>
            <Text style={[styles.statusBadgeText, { color: '#047857' }]}>RESUELTA</Text>
          </View>
        );
      case 'CLOSED':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#F3F4F6', borderColor: '#9CA3AF' }]}>
            <Text style={[styles.statusBadgeText, { color: '#4B5563' }]}>CERRADA</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#EFF6FF', borderColor: '#2B82FB' }]}>
            <Text style={[styles.statusBadgeText, { color: '#2B82FB' }]}>{status}</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comunicaciones</Text>
      </View>

      {/* Segmented Control */}
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

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPqrsList(searchQuery, true)}
            colors={['#2B82FB']}
          />
        }
      >
        {/* Search input */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Busca tus solicitudes..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Blue "+ Crear nueva PQRS" button */}
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.createBtnPlus}>+</Text>
          <Text style={styles.createBtnText}>Crear nueva PQRS</Text>
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator size="large" color="#2B82FB" style={{ marginTop: 40 }} />
        ) : pqrsList.length === 0 ? (
          /* Empty state */
          <View style={styles.emptyState}>
            <View style={styles.inboxIllustration}>
              <Text style={styles.sadEmoji}>😟</Text>
            </View>

            <Text style={styles.emptyTitle}>Nada por aquí...</Text>
            <Text style={styles.emptySubtitle}>
              Hmm, parece que aún no has creado ningún PQRS o no se encontraron resultados.
            </Text>
          </View>
        ) : (
          /* PQRS Cards List */
          <View style={styles.pqrsListContainer}>
            {pqrsList.map((item) => {
              const formattedDate = new Date(item.createdAt).toLocaleDateString([], {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.pqrsCard}
                  onPress={() => handleOpenDetail(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.pqrsCardHeader}>
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryTagText}>{item.category}</Text>
                    </View>
                    {renderStatusBadge(item.status)}
                  </View>

                  <Text style={styles.pqrsSubject}>{item.subject}</Text>
                  <Text style={styles.pqrsDescription} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={styles.pqrsFooter}>
                    <Text style={styles.pqrsDate}>{formattedDate}</Text>
                    <Text style={styles.pqrsTapText}>Ver conversación ›</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
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
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCreateModal(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, isSubmitting && { opacity: 0.6 }]}
                onPress={handleCreateSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Enviar PQRS</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for Viewing PQRS Detail & Chat */}
      <Modal visible={showDetailModal} animationType="slide">
        <SafeAreaViewStyleWrapper>
          <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#F8FAFC' }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Modal Top Header */}
            <View style={styles.detailHeader}>
              <TouchableOpacity style={styles.closeDetailBtn} onPress={() => setShowDetailModal(false)}>
                <Text style={styles.closeDetailText}>‹ Volver</Text>
              </TouchableOpacity>
              <Text style={styles.detailHeaderTitle} numberOfLines={1}>
                {selectedPqrs?.subject || 'Detalle PQRS'}
              </Text>
              <View style={{ width: 60 }} />
            </View>

            {isLoadingDetail || !selectedPqrs ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2B82FB" />
                <Text style={{ marginTop: 12, color: '#64748B' }}>Cargando conversación...</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                {/* Header Summary Info */}
                <View style={styles.detailBanner}>
                  <View style={styles.detailBannerRow}>
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryTagText}>{selectedPqrs.category}</Text>
                    </View>
                    {renderStatusBadge(selectedPqrs.status)}
                  </View>
                  <Text style={styles.detailDescriptionLabel}>Detalle inicial:</Text>
                  <Text style={styles.detailDescriptionText}>{selectedPqrs.description}</Text>
                </View>

                {/* Messages Chat List */}
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 20 }}>
                  {selectedPqrs.messages && selectedPqrs.messages.length > 0 ? (
                    selectedPqrs.messages.map((m) => {
                      const isStaff = m.isStaff;
                      const senderName = m.sender?.fullName || (isStaff ? 'Administración' : 'Tú');
                      const timeStr = new Date(m.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <View
                          key={m.id}
                          style={[
                            styles.chatBubbleContainer,
                            isStaff ? styles.chatStaffAlign : styles.chatUserAlign,
                          ]}
                        >
                          <View
                            style={[
                              styles.chatBubble,
                              isStaff ? styles.chatStaffBubble : styles.chatUserBubble,
                            ]}
                          >
                            <Text
                              style={[
                                styles.chatSenderName,
                                isStaff ? styles.chatStaffSender : styles.chatUserSender,
                              ]}
                            >
                              {senderName}
                            </Text>
                            <Text
                              style={[
                                styles.chatMessageText,
                                isStaff ? styles.chatStaffText : styles.chatUserText,
                              ]}
                            >
                              {m.message}
                            </Text>
                            <Text
                              style={[
                                styles.chatTime,
                                isStaff ? styles.chatStaffTime : styles.chatUserTime,
                              ]}
                            >
                              {timeStr}
                            </Text>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={{ textAlign: 'center', color: '#94A3B8', marginVertical: 20 }}>
                      Sin mensajes aún.
                    </Text>
                  )}
                </ScrollView>

                {/* Reply Input Bar */}
                {selectedPqrs.status !== 'RESOLVED' && selectedPqrs.status !== 'CLOSED' && (
                  <View style={styles.replyBar}>
                    <TextInput
                      style={styles.replyInput}
                      placeholder="Escribe tu mensaje a la administración..."
                      placeholderTextColor="#94A3B8"
                      value={replyText}
                      onChangeText={setReplyText}
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendReplyBtn,
                        (!replyText.trim() || isSendingReply) && { opacity: 0.5 },
                      ]}
                      onPress={handleSendReply}
                      disabled={!replyText.trim() || isSendingReply}
                    >
                      {isSendingReply ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.sendReplyBtnText}>Enviar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </KeyboardAvoidingView>
        </SafeAreaViewStyleWrapper>
      </Modal>
    </View>
  );
};

const SafeAreaViewStyleWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={{ flex: 1, paddingTop: Platform.OS === 'ios' ? 44 : 0, backgroundColor: '#0A0F1F' }}>
    {children}
  </View>
);

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
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A0A73',
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
    backgroundColor: '#1877F2',
  },
  segmentInactive: {
    backgroundColor: 'transparent',
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#94A3B8',
  },
  segmentActiveText: {
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141A2E',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#2A0A73',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(24, 119, 242, 0.15)',
    borderRadius: 22,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#1877F2',
    borderBottomWidth: 4,
    borderBottomColor: '#0B3C91',
  },
  createBtnPlus: {
    color: '#FFCF36',
    fontSize: 20,
    fontWeight: '900',
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  pqrsListContainer: {
    gap: 12,
  },
  pqrsCard: {
    backgroundColor: '#141A2E',
    borderRadius: 22,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(98, 3, 255, 0.3)',
    borderBottomWidth: 4,
    borderBottomColor: '#2A0A73',
    marginBottom: 12,
  },
  pqrsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: 'rgba(98, 3, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6203FF',
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFCF36',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  pqrsSubject: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pqrsDescription: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 12,
  },
  pqrsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  pqrsDate: {
    fontSize: 12,
    color: '#64748B',
  },
  pqrsTapText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFCF36',
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

  // Detail Modal Styles
  detailHeader: {
    height: 60,
    backgroundColor: '#2B82FB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  closeDetailBtn: {
    padding: 8,
  },
  closeDetailText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    maxWidth: 200,
  },
  detailBanner: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailDescriptionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 4,
  },
  detailDescriptionText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
    marginTop: 2,
  },

  // Chat Bubbles
  chatBubbleContainer: {
    marginBottom: 12,
  },
  chatStaffAlign: {
    alignItems: 'flex-start',
  },
  chatUserAlign: {
    alignItems: 'flex-end',
  },
  chatBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
  },
  chatStaffBubble: {
    backgroundColor: '#E0F2FE',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  chatUserBubble: {
    backgroundColor: '#2B82FB',
    borderBottomRightRadius: 4,
  },
  chatSenderName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chatStaffSender: {
    color: '#0369A1',
  },
  chatUserSender: {
    color: '#DBEAFE',
  },
  chatMessageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatStaffText: {
    color: '#0C4A6E',
  },
  chatUserText: {
    color: '#FFFFFF',
  },
  chatTime: {
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },
  chatStaffTime: {
    color: '#38BDF8',
  },
  chatUserTime: {
    color: '#BFDBFE',
  },

  // Reply Bar
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  sendReplyBtn: {
    backgroundColor: '#2B82FB',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  sendReplyBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default PQRSScreen;
