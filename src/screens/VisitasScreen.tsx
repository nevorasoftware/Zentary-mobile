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
  Clipboard,
  Linking,
  Share,
} from 'react-native';
import { apiService, VisitItem, VisitStatusType } from '../services/api';

interface VisitasScreenProps {
  onOpenFrequentModal?: () => void;
  autoOpenFastPass?: boolean;
}

export const VisitasScreen: React.FC<VisitasScreenProps> = ({ onOpenFrequentModal, autoOpenFastPass }) => {
  const [activeTab, setActiveTab] = useState<'EN_CURSO' | 'HISTORIAL' | 'OTRAS'>('EN_CURSO');
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // FastPass Special Modal State ("¿Cuándo te visitan? 🏃‍♀️")
  const [showFastPassModal, setShowFastPassModal] = useState(autoOpenFastPass || false);
  const [fastPassDateType, setFastPassDateType] = useState<'HOY' | 'MANANA' | 'OTRO'>('HOY');
  const [fastPassTimeSlot, setFastPassTimeSlot] = useState<'AHORA' | 'MEDIODIA' | 'TARDE' | 'NOCHE'>('AHORA');
  const [fastPassContactName, setFastPassContactName] = useState('');
  const [fastPassPhone, setFastPassPhone] = useState('');
  const [fastPassNotes, setFastPassNotes] = useState('');
  const [generatingFastPass, setGeneratingFastPass] = useState(false);

  // Resident Create Invitation Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitDate, setVisitDate] = useState('2026-08-26');
  const [validFrom, setValidFrom] = useState('09:00');
  const [notes, setNotes] = useState('');

  // WhatsApp Share Dialog State
  const [shareData, setShareData] = useState<{
    publicUrl: string;
    whatsappMessage: string;
    visitorName: string;
  } | null>(null);

  // Guard Scanner / Validation State
  const [showGuardModal, setShowGuardModal] = useState(false);
  const [qrInputToken, setQrInputToken] = useState('');
  const [validatingQr, setValidatingQr] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    valid?: boolean;
    message: string;
    visit?: any;
  } | null>(null);
  const [confirmingEntry, setConfirmingEntry] = useState(false);

  // Visit Detail Modal State
  const [selectedVisit, setSelectedVisit] = useState<VisitItem | null>(null);

  // Load visits from database on mount & tab change
  const fetchVisits = async () => {
    try {
      setLoading(true);
      const data = await apiService.getVisits();
      if (data.success && data.visits) {
        setVisits(data.visits);
      }
    } catch (error: any) {
      console.log('Error cargando visitas:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const handleTabChange = (tab: 'EN_CURSO' | 'HISTORIAL' | 'OTRAS') => {
    setActiveTab(tab);
    if (tab === 'OTRAS' && onOpenFrequentModal) {
      onOpenFrequentModal();
    }
  };

  // FastPass Generation Handler ("¿Cuándo te visitan? 🏃‍♀️")
  const handleCreateFastPass = async () => {
    if (!fastPassContactName.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa o selecciona un contacto para la visita.');
      return;
    }

    try {
      setGeneratingFastPass(true);

      const now = new Date();
      if (fastPassDateType === 'MANANA') {
        now.setDate(now.getDate() + 1);
      }
      const dateStr = now.toISOString().split('T')[0];

      let timeStr = '09:00';
      if (fastPassTimeSlot === 'MEDIODIA') timeStr = '12:00';
      if (fastPassTimeSlot === 'TARDE') timeStr = '18:00';
      if (fastPassTimeSlot === 'NOCHE') timeStr = '21:00';

      const res = await apiService.createVisit({
        visitorName: fastPassContactName.trim(),
        visitorPhone: fastPassPhone.trim() || undefined,
        visitDate: dateStr,
        validFrom: timeStr,
        notes: fastPassNotes.trim() || 'FastPass Generado Rápido',
      });

      if (res.success) {
        setShowFastPassModal(false);
        setFastPassContactName('');
        setFastPassPhone('');

        const waUrl = `whatsapp://send?text=${encodeURIComponent(res.whatsappMessage)}`;
        const canOpen = await Linking.canOpenURL(waUrl);

        if (canOpen) {
          await Linking.openURL(waUrl);
        } else {
          setShareData({
            publicUrl: res.publicUrl,
            whatsappMessage: res.whatsappMessage,
            visitorName: res.visit.visitorName,
          });
        }

        fetchVisits();
      }
    } catch (err: any) {
      Alert.alert('Error FastPass', err.message || 'No se pudo generar el FastPass.');
    } finally {
      setGeneratingFastPass(false);
    }
  };

  // Create Visit Handler
  const handleCreateVisit = async () => {
    if (!visitorName.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa el nombre del visitante.');
      return;
    }

    try {
      setCreating(true);
      const res = await apiService.createVisit({
        visitorName: visitorName.trim(),
        visitorPhone: visitorPhone.trim() || undefined,
        visitDate,
        validFrom,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setShowAddModal(false);
        setVisitorName('');
        setVisitorPhone('');
        setNotes('');
        
        // Show Share Modal with generated WhatsApp text & URL
        setShareData({
          publicUrl: res.publicUrl,
          whatsappMessage: res.whatsappMessage,
          visitorName: res.visit.visitorName,
        });

        // Refresh list from DB
        fetchVisits();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear la invitación.');
    } finally {
      setCreating(false);
    }
  };

  // WhatsApp Share Action
  const handleShareWhatsApp = async () => {
    if (!shareData) return;
    try {
      const url = `whatsapp://send?text=${encodeURIComponent(shareData.whatsappMessage)}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Share.share({
          message: shareData.whatsappMessage,
        });
      }
    } catch (e) {
      Alert.alert('Compartir', shareData.whatsappMessage);
    }
  };

  // Copy URL to Clipboard
  const handleCopyLink = () => {
    if (shareData) {
      Clipboard.setString(shareData.publicUrl);
      Alert.alert('¡Copiado!', 'El enlace del visitante ha sido copiado al portapapeles.');
    }
  };

  // Cancel Visit Handler
  const handleCancelVisit = async (visitId: string) => {
    Alert.alert(
      'Cancelar Invitación',
      '¿Estás seguro de cancelar esta visita? El enlace y los códigos QR quedarán invalidados inmediatamente.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiService.cancelVisit(visitId);
              if (res.success) {
                Alert.alert('Éxito', 'Invitación cancelada.');
                setSelectedVisit(null);
                fetchVisits();
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Error al cancelar la invitación.');
            }
          },
        },
      ]
    );
  };

  // Guard Scan QR Code Handler
  const handleScanQR = async () => {
    if (!qrInputToken.trim()) {
      Alert.alert('Requerido', 'Ingresa o escanea un código QR dinámico.');
      return;
    }

    try {
      setValidatingQr(true);
      setScanResult(null);
      const res = await apiService.scanQRToken(qrInputToken.trim());
      setScanResult(res);
    } catch (err: any) {
      setScanResult({
        success: false,
        valid: false,
        message: err.message || 'Código QR inválido o expirado.',
      });
    } finally {
      setValidatingQr(false);
    }
  };

  // Guard Confirm Entry Handler
  const handleConfirmEntry = async (visitId: string) => {
    try {
      setConfirmingEntry(true);
      const res = await apiService.confirmEntry(visitId, 'Puerta Principal');
      if (res.success) {
        Alert.alert(
          '✅ INGRESO CONFIRMADO',
          `El ingreso de ${res.visit.visitorName} ha sido procesado. Se han invalidado todos los tokens de acceso y notificado al residente.`
        );
        setShowGuardModal(false);
        setScanResult(null);
        setQrInputToken('');
        fetchVisits();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo confirmar el ingreso.');
    } finally {
      setConfirmingEntry(false);
    }
  };

  // Filter visits based on active tab
  const filteredVisits = visits.filter((v) => {
    if (activeTab === 'EN_CURSO') {
      return v.status === 'PENDIENTE_REGISTRO' || v.status === 'DATOS_COMPLETADOS' || v.status === 'IN_PROGRESS';
    } else if (activeTab === 'HISTORIAL') {
      return v.status === 'INGRESADA' || v.status === 'COMPLETED';
    } else {
      return v.status === 'CANCELADA' || v.status === 'VENCIDA';
    }
  });

  const getStatusBadge = (status: VisitStatusType) => {
    switch (status) {
      case 'PENDIENTE_REGISTRO':
        return { text: 'PENDIENTE DATOS', bg: '#FEF3C7', color: '#D97706' };
      case 'DATOS_COMPLETADOS':
        return { text: 'DATOS COMPLETOS (QR)', bg: '#DBEAFE', color: '#2563EB' };
      case 'INGRESADA':
      case 'COMPLETED':
        return { text: '🟢 INGRESADA', bg: '#DCFCE7', color: '#16A34A' };
      case 'CANCELADA':
        return { text: '❌ CANCELADA', bg: '#FEE2E2', color: '#DC2626' };
      case 'VENCIDA':
        return { text: '⚫ VENCIDA', bg: '#F3F4F6', color: '#4B5563' };
      default:
        return { text: status, bg: '#E5E7EB', color: '#374151' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Visitas & Accesos</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={[styles.guardHeaderBtn, { backgroundColor: '#1D4ED8' }]} onPress={() => setShowFastPassModal(true)}>
            <Text style={styles.guardHeaderBtnText}>🏃‍♀️ FastPass</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.guardHeaderBtn} onPress={() => setShowGuardModal(true)}>
            <Text style={styles.guardHeaderBtnText}>📷 Validar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Sub-Tabs */}
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
          style={[styles.tabItem, activeTab === 'OTRAS' && styles.activeTabItem]}
          onPress={() => handleTabChange('OTRAS')}
        >
          <Text style={[styles.tabText, activeTab === 'OTRAS' && styles.activeTabText]}>
            CANCELADAS / OTROS
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2B82FB" />
          <Text style={styles.loadingText}>Cargando visitas desde la base de datos...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {filteredVisits.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <View style={styles.illustrationWrap}>
                <View style={styles.mockWindow}>
                  <View style={styles.windowHeader} />
                  <Text style={styles.sadFace}>📋</Text>
                </View>
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'EN_CURSO'
                  ? 'No tienes visitas en curso'
                  : activeTab === 'HISTORIAL'
                  ? 'No tienes visitas registradas en el historial'
                  : 'No hay registros'}
              </Text>
              <Text style={styles.emptySubtitle}>
                Presiona el botón "+" para registrar una nueva invitación de visitante.
              </Text>
            </View>
          ) : (
            filteredVisits.map((item) => {
              const badge = getStatusBadge(item.status);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.visitCard}
                  onPress={() => setSelectedVisit(item)}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.visitorNameText}>{item.visitorName}</Text>
                    <View style={[styles.badgeContainer, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBodyInfo}>
                    <Text style={styles.infoLineText}>
                      📱 Teléfono: {item.visitorPhone || 'Sin registrar'}
                    </Text>
                    <Text style={styles.infoLineText}>
                      ⏰ Hora autorizada:{' '}
                      {item.validFrom
                        ? new Date(item.validFrom).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '6:00 PM'}
                    </Text>

                    {item.hasVehicle && (
                      <Text style={styles.infoLineText}>
                        🚗 Vehículo: {item.vehicleModel || ''} ({item.vehiclePlate || 'Con vehículo'})
                      </Text>
                    )}

                    {item.entryDate && (
                      <Text style={styles.entryTimeText}>
                        ✅ Ingreso confirmado: {new Date(item.entryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Floating Button '+' to Create Visit */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* MODAL 0: FastPass Modal ("¿Cuándo te visitan? 🏃‍♀️") */}
      <Modal visible={showFastPassModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={[styles.modalTitle, { fontSize: 20, color: '#1D4ED8' }]}>¿Cuándo te visitan? 🏃‍♀️</Text>
              <TouchableOpacity onPress={() => setShowFastPassModal(false)}>
                <Text style={{ fontSize: 18, color: '#64748B', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>Crea una invitación FastPass instantánea para enviar por WhatsApp.</Text>

            {/* Date Selection */}
            <Text style={styles.label}>1. Selecciona el Día de la Visita</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity
                style={[
                  styles.optionChip,
                  fastPassDateType === 'HOY' && styles.optionChipActive,
                ]}
                onPress={() => setFastPassDateType('HOY')}
              >
                <Text style={[styles.optionChipText, fastPassDateType === 'HOY' && styles.optionChipTextActive]}>
                  📅 Hoy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionChip,
                  fastPassDateType === 'MANANA' && styles.optionChipActive,
                ]}
                onPress={() => setFastPassDateType('MANANA')}
              >
                <Text style={[styles.optionChipText, fastPassDateType === 'MANANA' && styles.optionChipTextActive]}>
                  ☀️ Mañana
                </Text>
              </TouchableOpacity>
            </View>

            {/* Time Slot Selection */}
            <Text style={styles.label}>2. Selecciona la Hora Estimada</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {[
                { id: 'AHORA', label: '⚡ Ahora (09:00 AM)' },
                { id: 'MEDIODIA', label: '☀️ Mediodía (12:00 PM)' },
                { id: 'TARDE', label: '🌆 Tarde (06:00 PM)' },
                { id: 'NOCHE', label: '🌙 Noche (09:00 PM)' },
              ].map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.timeSlotChip,
                    fastPassTimeSlot === slot.id && styles.timeSlotChipActive,
                  ]}
                  onPress={() => setFastPassTimeSlot(slot.id as any)}
                >
                  <Text style={[styles.timeSlotChipText, fastPassTimeSlot === slot.id && styles.timeSlotChipTextActive]}>
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Contact / Phone Selection */}
            <Text style={styles.label}>3. Contacto / Visitante *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del visitante (Ej. Miguel Rodríguez)"
              value={fastPassContactName}
              onChangeText={setFastPassContactName}
            />

            <Text style={styles.label}>Número de WhatsApp (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 7000-0000"
              keyboardType="phone-pad"
              value={fastPassPhone}
              onChangeText={setFastPassPhone}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowFastPassModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: '#25D366' }]}
                onPress={handleCreateFastPass}
                disabled={generatingFastPass}
              >
                {generatingFastPass ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>📲 Enviar FastPass por WhatsApp</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 1: Create Invitation (Resident) */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Crear Nueva Invitación</Text>
            <Text style={styles.modalDesc}>El visitante completará sus datos personales desde el enlace enviad0.</Text>

            <Text style={styles.label}>Nombre completo del visitante *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Juan Pérez"
              value={visitorName}
              onChangeText={setVisitorName}
            />

            <Text style={styles.label}>Número de Teléfono (WhatsApp) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 7000-0000"
              keyboardType="phone-pad"
              value={visitorPhone}
              onChangeText={setVisitorPhone}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Fecha de visita</Text>
                <TextInput
                  style={styles.input}
                  placeholder="AAAA-MM-DD"
                  value={visitDate}
                  onChangeText={setVisitDate}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Hora inicio (Desde)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM (Ej. 18:00)"
                  value={validFrom}
                  onChangeText={setValidFrom}
                />
              </View>
            </View>

            <Text style={styles.label}>Notas adicionales (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Visita familiar"
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateVisit} disabled={creating}>
                {creating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Crear Invitación</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Automatic WhatsApp Sent Confirmation */}
      <Modal visible={!!shareData} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 32 }}>📲</Text>
              </View>
              <Text style={styles.modalTitle}>¡Invitación Enviada!</Text>
            </View>

            <Text style={{ fontSize: 14, color: '#1E293B', marginBottom: 12, textAlign: 'center', lineHeight: 20 }}>
              Se ha enviado automáticamente el enlace de registro por WhatsApp al número de <Text style={{ fontWeight: 'bold' }}>{shareData?.visitorName}</Text>.
            </Text>

            <View style={{ backgroundColor: '#F1F5F9', padding: 12, borderRadius: 12, marginBottom: 20 }}>
              <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', lineHeight: 16 }}>
                🔒 <Text style={{ fontWeight: 'bold' }}>Seguridad de Acceso:</Text> El enlace único se entrega directamente al número registrado para evitar que la invitación sea enviada a otra persona.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => setShareData(null)}
            >
              <Text style={styles.saveBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Guard Access Scanner */}
      <Modal visible={showGuardModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <Text style={styles.modalTitle}>📷 Validar Visitante (Caseta de Seguridad)</Text>
            <Text style={styles.modalDesc}>Escanea o ingresa el código de token dinámico del visitante.</Text>

            <TextInput
              style={[styles.input, { fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' }]}
              placeholder="Ej. ACCESS-8F92A7C1"
              value={qrInputToken}
              onChangeText={setQrInputToken}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleScanQR} disabled={validatingQr}>
              {validatingQr ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>🔍 Validar Código QR</Text>
              )}
            </TouchableOpacity>

            {/* Scan Result Details */}
            {scanResult && (
              <View style={{ marginTop: 16 }}>
                {!scanResult.valid ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerTitle}>❌ Acceso Denegado</Text>
                    <Text style={styles.errorBannerDesc}>{scanResult.message}</Text>
                  </View>
                ) : (
                  <View style={styles.successBanner}>
                    <Text style={styles.successBannerTitle}>✅ VISITANTE AUTORIZADO</Text>

                    <View style={styles.detailsBox}>
                      <Text style={styles.detailRow}>
                        <Text style={{ fontWeight: 'bold' }}>Visitante:</Text> {scanResult.visit.visitorName}
                      </Text>
                      <Text style={styles.detailRow}>
                        <Text style={{ fontWeight: 'bold' }}>Invitado por:</Text> {scanResult.visit.residentName}
                      </Text>
                      <Text style={styles.detailRow}>
                        <Text style={{ fontWeight: 'bold' }}>Propiedad:</Text> {scanResult.visit.propertyUnit}
                      </Text>
                      <Text style={styles.detailRow}>
                        <Text style={{ fontWeight: 'bold' }}>Documento ({scanResult.visit.documentType}):</Text>{' '}
                        {scanResult.visit.documentNumber}
                      </Text>

                      {scanResult.visit.hasVehicle && (
                        <Text style={styles.detailRow}>
                          <Text style={{ fontWeight: 'bold' }}>Vehículo:</Text> {scanResult.visit.vehicleModel} (Placa:{' '}
                          {scanResult.visit.vehiclePlate})
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.confirmEntryBtn}
                      onPress={() => handleConfirmEntry(scanResult.visit.id)}
                      disabled={confirmingEntry}
                    >
                      {confirmingEntry ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.confirmEntryBtnText}>✅ CONFIRMAR INGRESO</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.cancelBtn, { marginTop: 16, alignItems: 'center' }]}
              onPress={() => {
                setShowGuardModal(false);
                setScanResult(null);
                setQrInputToken('');
              }}
            >
              <Text style={styles.cancelBtnText}>Cerrar Scanner</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Visit Detail View */}
      <Modal visible={!!selectedVisit} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedVisit && (
              <>
                <Text style={styles.modalTitle}>Detalles de la Visita</Text>
                
                <View style={[styles.badgeContainer, { backgroundColor: getStatusBadge(selectedVisit.status).bg, alignSelf: 'flex-start', marginBottom: 12 }]}>
                  <Text style={[styles.badgeText, { color: getStatusBadge(selectedVisit.status).color }]}>
                    {getStatusBadge(selectedVisit.status).text}
                  </Text>
                </View>

                <View style={styles.detailsBox}>
                  <Text style={styles.detailRow}><Text style={{ fontWeight: 'bold' }}>Visitante:</Text> {selectedVisit.visitorName}</Text>
                  <Text style={styles.detailRow}><Text style={{ fontWeight: 'bold' }}>Teléfono:</Text> {selectedVisit.visitorPhone || 'No registrado'}</Text>
                  <Text style={styles.detailRow}><Text style={{ fontWeight: 'bold' }}>Documento:</Text> {selectedVisit.documentType || 'DUI'}: {selectedVisit.documentNumber || 'Pendiente'}</Text>
                  
                  {selectedVisit.hasVehicle && (
                    <Text style={styles.detailRow}><Text style={{ fontWeight: 'bold' }}>Vehículo:</Text> {selectedVisit.vehicleModel || ''} - Placa: {selectedVisit.vehiclePlate}</Text>
                  )}

                  {selectedVisit.entryDate && (
                    <Text style={styles.detailRow}><Text style={{ fontWeight: 'bold', color: '#16A34A' }}>Hora de ingreso:</Text> {new Date(selectedVisit.entryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  )}
                </View>

                {(selectedVisit.status === 'PENDIENTE_REGISTRO' || selectedVisit.status === 'DATOS_COMPLETADOS') && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleCancelVisit(selectedVisit.id)}
                  >
                    <Text style={styles.deleteBtnText}>🚫 Cancelar Invitación</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.cancelBtn, { marginTop: 12, alignItems: 'center' }]}
                  onPress={() => setSelectedVisit(null)}
                >
                  <Text style={styles.cancelBtnText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    height: 70,
    backgroundColor: '#2B82FB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  guardHeaderBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  guardHeaderBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabItem: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTabItem: { borderBottomWidth: 3, borderBottomColor: '#2B82FB' },
  tabText: { fontSize: 11, fontWeight: 'bold', color: '#94A3B8' },
  activeTabText: { color: '#2B82FB' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: '#64748B', fontSize: 14 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  emptyStateCard: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  illustrationWrap: { marginBottom: 20 },
  mockWindow: { width: 90, height: 80, borderWidth: 2, borderColor: '#CBD5E1', borderRadius: 12, alignItems: 'center', paddingTop: 8 },
  windowHeader: { width: 70, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginBottom: 12 },
  sadFace: { fontSize: 32 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  visitCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderHeight: 1, borderColor: '#E2E8F0', elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  visitorNameText: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  badgeContainer: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  cardBodyInfo: { gap: 4 },
  infoLineText: { fontSize: 13, color: '#475569' },
  entryTimeText: { fontSize: 12, color: '#16A34A', fontWeight: 'bold', marginTop: 4 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#2B82FB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  fabIcon: { color: '#FFFFFF', fontSize: 32, marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
  modalDesc: { fontSize: 12, color: '#64748B', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#475569', marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#0F172A' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { color: '#64748B', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2B82FB', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFFFFF', fontWeight: 'bold' },
  linkBox: { backgroundColor: '#F1F5F9', padding: 12, borderRadius: 12, marginBottom: 12 },
  linkText: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
  waBtn: { backgroundColor: '#25D366', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  waBtnText: { color: '#FFFFFF', fontWeight: 'bold' },
  copyBtn: { backgroundColor: '#E2E8F0', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  copyBtnText: { color: '#334155', fontWeight: 'bold' },
  optionChip: { flex: 1, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#F8FAFC', alignItems: 'center' },
  optionChipActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  optionChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  optionChipTextActive: { color: '#1D4ED8', fontWeight: 'bold' },
  timeSlotChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  timeSlotChipActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  timeSlotChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  timeSlotChipTextActive: { color: '#1D4ED8', fontWeight: 'bold' },
  errorBanner: { backgroundColor: '#FEE2E2', padding: 14, borderRadius: 12 },
  errorBannerTitle: { color: '#DC2626', fontWeight: 'bold', fontSize: 14 },
  errorBannerDesc: { color: '#991B1B', fontSize: 12, marginTop: 2 },
  successBanner: { backgroundColor: '#DCFCE7', padding: 14, borderRadius: 12 },
  successBannerTitle: { color: '#16A34A', fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  detailsBox: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 10, gap: 4, marginBottom: 10 },
  detailRow: { fontSize: 13, color: '#334155' },
  confirmEntryBtn: { backgroundColor: '#16A34A', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  confirmEntryBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  deleteBtn: { backgroundColor: '#FEE2E2', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  deleteBtnText: { color: '#DC2626', fontWeight: 'bold' },
});

export default VisitasScreen;
