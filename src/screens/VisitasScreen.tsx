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
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../theme';
import { apiService, VisitItem, VisitStatusType } from '../services/api';
import { localDateISO, localTimeHM, isValidDateISO, isValidTimeHM, parseLocalDateTime } from '../utils/dates';
import { DateTimeField } from '../components/DateTimeField';

interface VisitasScreenProps {
  onOpenFrequentModal?: () => void;
  autoOpenFastPass?: boolean;
  userRole?: string;
}

// Estilo del campo de fecha/hora en web (tema claro de los formularios de esta pantalla)
const webLightInput = { backgroundColor: '#FFFFFF', color: '#0F172A', border: '1px solid #CBD5E1', colorScheme: 'light', fontWeight: 400, fontSize: 14, padding: '10px 14px' };

// Fecha y hora iniciales de una invitación: ahora, redondeado hacia arriba al siguiente múltiplo de 5 minutos
const initialVisitDateTime = () => {
  const stepMs = 5 * 60 * 1000;
  const rounded = new Date(Math.ceil(Date.now() / stepMs) * stepMs);
  return { date: localDateISO(rounded), time: localTimeHM(rounded) };
};

export const VisitasScreen: React.FC<VisitasScreenProps> = ({ onOpenFrequentModal, autoOpenFastPass, userRole }) => {
  // Las funciones de garita solo son para personal autorizado (no residentes ni rol desconocido)
  const canUseGuardFunctions = !!userRole && userRole !== 'RESIDENT';
  const [activeTab, setActiveTab] = useState<'EN_CURSO' | 'HISTORIAL' | 'OTRAS'>('EN_CURSO');
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // FastPass Special Modal State ("¿Cuándo te visitan? 🏃‍♀️")
  const [showFastPassModal, setShowFastPassModal] = useState(autoOpenFastPass || false);
  const [fastPassDateType, setFastPassDateType] = useState<'HOY' | 'MANANA' | 'OTRO'>('HOY');
  const [fastPassOtherDate, setFastPassOtherDate] = useState(localDateISO());
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
  const [visitDate, setVisitDate] = useState(() => initialVisitDateTime().date);
  const [validFrom, setValidFrom] = useState(() => initialVisitDateTime().time);
  const [notes, setNotes] = useState('');

  // WhatsApp Share Dialog State
  const [shareData, setShareData] = useState<{
    publicUrl: string;
    whatsappMessage: string;
    visitorName: string;
    sent: boolean;
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
  const fetchVisits = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setLoadError(false);
      const data = await apiService.getVisits();
      if (data.success && data.visits) {
        setVisits(data.visits);
      }
    } catch (error: any) {
      console.log('Error cargando visitas:', error.message);
      setLoadError(true);
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
    if (generatingFastPass) return;
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
      const dateStr = fastPassDateType === 'OTRO' ? fastPassOtherDate : localDateISO(now);
      if (!isValidDateISO(dateStr) || dateStr < localDateISO()) {
        Alert.alert('Fecha no válida', 'Selecciona una fecha de visita que no sea anterior a hoy.');
        return;
      }

      let timeStr = localTimeHM();
      if (fastPassTimeSlot === 'MEDIODIA') timeStr = '12:00';
      if (fastPassTimeSlot === 'TARDE') timeStr = '18:00';
      if (fastPassTimeSlot === 'NOCHE') timeStr = '21:00';
      // Los horarios del día de hoy que ya pasaron se envían con la hora actual
      if (dateStr === localDateISO() && timeStr < localTimeHM()) timeStr = localTimeHM();

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
            sent: (res as any).whatsappResult?.success === true,
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
    if (creating) return;
    if (!visitorName.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa el nombre del visitante.');
      return;
    }
    if (!isValidDateISO(visitDate) || !isValidTimeHM(validFrom)) {
      Alert.alert('Fecha u hora no válida', 'Selecciona una fecha y una hora de visita válidas.');
      return;
    }
    if (parseLocalDateTime(visitDate, validFrom).getTime() < Date.now() - 60000) {
      Alert.alert('Fecha u hora no válida', 'La fecha y la hora de la visita no pueden ser anteriores al momento actual.');
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
        const initial = initialVisitDateTime();
        setVisitDate(initial.date);
        setValidFrom(initial.time);
        
        // Show Share Modal with generated WhatsApp text & URL
        setShareData({
          publicUrl: res.publicUrl,
          whatsappMessage: res.whatsappMessage,
          visitorName: res.visit.visitorName,
          sent: (res as any).whatsappResult?.success === true,
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
            if (isCancelling) return;
            setIsCancelling(true);
            try {
              const res = await apiService.cancelVisit(visitId);
              if (res.success) {
                Alert.alert('Éxito', 'Invitación cancelada.');
                setSelectedVisit(null);
                fetchVisits();
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Error al cancelar la invitación.');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  // Guard Scan QR Code Handler
  const handleScanQR = async () => {
    if (validatingQr) return;
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
        return { text: 'Pendiente datos', bg: '#FEF3C7', color: '#92400E' };
      case 'DATOS_COMPLETADOS':
        return { text: 'Datos completos (QR)', bg: '#DBEAFE', color: '#1D4ED8' };
      case 'INGRESADA':
      case 'COMPLETED':
        return { text: '🟢 Ingresada', bg: '#DCFCE7', color: '#15803D' };
      case 'CANCELADA':
        return { text: '❌ Cancelada', bg: '#FEE2E2', color: '#B91C1C' };
      case 'VENCIDA':
        return { text: '⚫ Vencida', bg: '#F3F4F6', color: '#4B5563' };
      default:
        return { text: status, bg: '#E5E7EB', color: '#374151' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Visitas y accesos</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity accessibilityRole="button" style={[styles.guardHeaderBtn, { backgroundColor: '#1D4ED8' }]} onPress={() => setShowFastPassModal(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text accessibilityLabel="FastPass" style={styles.guardHeaderBtnText}>🏃‍♀️ FastPass</Text>
          </TouchableOpacity>
          {canUseGuardFunctions && (
            <TouchableOpacity accessibilityRole="button" style={styles.guardHeaderBtn} onPress={() => setShowGuardModal(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.guardHeaderBtnText}>Validar código</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Navigation Sub-Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          accessibilityRole="tab" accessibilityState={{ selected: activeTab === 'EN_CURSO' }}
          style={[styles.tabItem, activeTab === 'EN_CURSO' && styles.activeTabItem]}
          onPress={() => handleTabChange('EN_CURSO')}
          hitSlop={{ top: 4, bottom: 4 }}
        >
          <Text style={[styles.tabText, activeTab === 'EN_CURSO' && styles.activeTabText]}>
            En curso
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="tab" accessibilityState={{ selected: activeTab === 'HISTORIAL' }}
          style={[styles.tabItem, activeTab === 'HISTORIAL' && styles.activeTabItem]}
          onPress={() => handleTabChange('HISTORIAL')}
          hitSlop={{ top: 4, bottom: 4 }}
        >
          <Text style={[styles.tabText, activeTab === 'HISTORIAL' && styles.activeTabText]}>
            Historial
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="tab" accessibilityState={{ selected: activeTab === 'OTRAS' }}
          style={[styles.tabItem, activeTab === 'OTRAS' && styles.activeTabItem]}
          onPress={() => handleTabChange('OTRAS')}
          hitSlop={{ top: 4, bottom: 4 }}
        >
          <Text style={[styles.tabText, activeTab === 'OTRAS' && styles.activeTabText]}>
            Canceladas / otros
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1D6BE0" />
          <Text style={styles.loadingText}>Cargando visitas...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchVisits(true);
              }}
              colors={['#1D6BE0']}
            />
          }
        >
          {loadError ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyTitle}>No se pudieron cargar las visitas</Text>
              <Text style={styles.emptySubtitle}>Revisa tu conexión e intenta de nuevo.</Text>
              <TouchableOpacity accessibilityRole="button" style={styles.retryBtn} onPress={() => fetchVisits()}>
                <Text style={styles.retryBtnText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : filteredVisits.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <View style={styles.illustrationWrap}>
                <View style={styles.mockWindow}>
                  <View style={styles.windowHeader} />
                  <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.sadFace}>📋</Text>
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
                  accessibilityRole="button"
                  key={item.id}
                  style={styles.visitCard}
                  onPress={() => setSelectedVisit(item)}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.visitorNameText}>{item.visitorName}</Text>
                    <View style={[styles.badgeContainer, { backgroundColor: badge.bg }]}>
                      <Text accessibilityLabel={badge.text.replace(/^[^\p{L}]+/u, "")} style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBodyInfo}>
                    <Text accessibilityLabel={`Teléfono: ${item.visitorPhone || "Sin registrar"}`} style={styles.infoLineText}>
                      📱 Teléfono: {item.visitorPhone || 'Sin registrar'}
                    </Text>
                    <Text accessibilityLabel={`Hora autorizada: ${item.validFrom ? new Date(item.validFrom).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Sin dato"}`} style={styles.infoLineText}>
                      ⏰ Hora autorizada:{' '}
                      {item.validFrom
                        ? new Date(item.validFrom).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </Text>

                    {item.hasVehicle && (
                      <Text accessibilityLabel={`Vehículo: ${item.vehicleModel || ""} (${item.vehiclePlate || "Con vehículo"})`} style={styles.infoLineText}>
                        🚗 Vehículo: {item.vehicleModel || ''} ({item.vehiclePlate || 'Con vehículo'})
                      </Text>
                    )}

                    {item.entryDate && (
                      <Text accessibilityLabel={`Ingreso confirmado: ${new Date(item.entryDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`} style={styles.entryTimeText}>
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
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Nueva invitación" style={styles.fab} onPress={() => {
        const initial = initialVisitDateTime();
        setVisitDate(initial.date);
        setValidFrom(initial.time);
        setShowAddModal(true);
      }}>
        <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* MODAL 0: FastPass Modal ("¿Cuándo te visitan? 🏃‍♀️") */}
      <Modal visible={showFastPassModal} transparent animationType="slide" onRequestClose={() => setShowFastPassModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={{ width: '100%' }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text accessibilityLabel="¿Cuándo te visitan?" style={[styles.modalTitle, { fontSize: 20, color: '#1D4ED8' }]}>¿Cuándo te visitan? 🏃‍♀️</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => setShowFastPassModal(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text accessibilityElementsHidden importantForAccessibility="no" style={{ fontSize: 18, color: '#64748B', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>Crea una invitación FastPass instantánea para enviar por WhatsApp.</Text>

            {/* Date Selection */}
            <Text style={styles.label}>1. Selecciona el Día de la Visita</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity
                accessibilityRole="button" accessibilityState={{ selected: fastPassDateType === 'HOY' }}
                style={[
                  styles.optionChip,
                  fastPassDateType === 'HOY' && styles.optionChipActive,
                ]}
                onPress={() => setFastPassDateType('HOY')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text accessibilityLabel="Hoy" style={[styles.optionChipText, fastPassDateType === 'HOY' && styles.optionChipTextActive]}>
                  📅 Hoy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button" accessibilityState={{ selected: fastPassDateType === 'MANANA' }}
                style={[
                  styles.optionChip,
                  fastPassDateType === 'MANANA' && styles.optionChipActive,
                ]}
                onPress={() => setFastPassDateType('MANANA')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text accessibilityLabel="Mañana" style={[styles.optionChipText, fastPassDateType === 'MANANA' && styles.optionChipTextActive]}>
                  ☀️ Mañana
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button" accessibilityState={{ selected: fastPassDateType === 'OTRO' }}
                style={[
                  styles.optionChip,
                  fastPassDateType === 'OTRO' && styles.optionChipActive,
                ]}
                onPress={() => setFastPassDateType('OTRO')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text accessibilityLabel="Otro día" style={[styles.optionChipText, fastPassDateType === 'OTRO' && styles.optionChipTextActive]}>
                  🗓️ Otro día
                </Text>
              </TouchableOpacity>
            </View>
            {fastPassDateType === 'OTRO' && (
              <View style={{ marginBottom: 12 }}>
                <DateTimeField
                  mode="date"
                  accessibilityLabel="Fecha de la visita"
                  value={fastPassOtherDate}
                  onChange={setFastPassOtherDate}
                  minDate={localDateISO()}
                  style={styles.input}
                  textStyle={styles.dateFieldText}
                  webStyle={webLightInput}
                />
              </View>
            )}

            {/* Time Slot Selection */}
            <Text style={styles.label}>2. Selecciona la Hora Estimada</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {[
                { id: 'AHORA', label: '⚡ Ahora' },
                { id: 'MEDIODIA', label: '☀️ Mediodía (12:00 PM)' },
                { id: 'TARDE', label: '🌆 Tarde (06:00 PM)' },
                { id: 'NOCHE', label: '🌙 Noche (09:00 PM)' },
              ].map((slot) => (
                <TouchableOpacity
                  accessibilityRole="button" accessibilityState={{ selected: fastPassTimeSlot === slot.id }}
                  key={slot.id}
                  style={[
                    styles.timeSlotChip,
                    fastPassTimeSlot === slot.id && styles.timeSlotChipActive,
                  ]}
                  onPress={() => setFastPassTimeSlot(slot.id as any)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text accessibilityLabel={slot.label.replace(/^[^\p{L}]+/u, "")} style={[styles.timeSlotChipText, fastPassTimeSlot === slot.id && styles.timeSlotChipTextActive]}>
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Contact / Phone Selection */}
            <Text style={styles.label}>3. Contacto / Visitante *</Text>
            <TextInput
              accessibilityLabel="Nombre del visitante"
              style={styles.input}
              placeholder="Nombre del visitante (Ej. Miguel Rodríguez)"
              value={fastPassContactName}
              onChangeText={setFastPassContactName}
            />

            <Text style={styles.label}>Número de WhatsApp (Opcional)</Text>
            <TextInput
              accessibilityLabel="Número de WhatsApp"
              style={styles.input}
              placeholder="Ej. 7000-0000"
              keyboardType="phone-pad"
              returnKeyType="done"
              onSubmitEditing={handleCreateFastPass}
              value={fastPassPhone}
              onChangeText={setFastPassPhone}
            />

            <Text style={styles.label}>Notas adicionales (Opcional)</Text>
            <TextInput
              accessibilityLabel="Notas del FastPass"
              style={styles.input}
              placeholder="Ej. Visita familiar"
              value={fastPassNotes}
              onChangeText={setFastPassNotes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity accessibilityRole="button" style={styles.cancelBtn} onPress={() => setShowFastPassModal(false)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                style={[styles.saveBtn, { backgroundColor: '#16803C' }]}
                onPress={handleCreateFastPass}
                disabled={generatingFastPass}
              >
                {generatingFastPass ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text accessibilityLabel="Enviar FastPass por WhatsApp" style={styles.saveBtnText}>📲 Enviar FastPass por WhatsApp</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 1: Create Invitation (Resident) */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={{ width: '100%' }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Crear Nueva Invitación</Text>
            <Text style={styles.modalDesc}>El visitante completará sus datos personales desde el enlace enviado.</Text>

            <Text style={styles.label}>Nombre completo del visitante *</Text>
            <TextInput
              accessibilityLabel="Nombre completo del visitante"
              style={styles.input}
              placeholder="Ej. Juan Pérez"
              value={visitorName}
              onChangeText={setVisitorName}
            />

            <Text style={styles.label}>Número de Teléfono (WhatsApp) (Opcional)</Text>
            <TextInput
              accessibilityLabel="Número de teléfono"
              style={styles.input}
              placeholder="Ej. 7000-0000"
              keyboardType="phone-pad"
              value={visitorPhone}
              onChangeText={setVisitorPhone}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Fecha de visita</Text>
                <DateTimeField
                  mode="date"
                  accessibilityLabel="Fecha de visita"
                  value={visitDate}
                  onChange={setVisitDate}
                  minDate={localDateISO()}
                  style={styles.input}
                  textStyle={styles.dateFieldText}
                  webStyle={webLightInput}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Hora inicio (Desde)</Text>
                <DateTimeField
                  mode="time"
                  accessibilityLabel="Hora de inicio"
                  value={validFrom}
                  onChange={setValidFrom}
                  style={styles.input}
                  textStyle={styles.dateFieldText}
                  webStyle={webLightInput}
                />
              </View>
            </View>

            <Text style={styles.label}>Notas adicionales (Opcional)</Text>
            <TextInput
              accessibilityLabel="Notas adicionales"
              style={styles.input}
              placeholder="Ej. Visita familiar"
              returnKeyType="done"
              onSubmitEditing={handleCreateVisit}
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity accessibilityRole="button" style={styles.cancelBtn} onPress={() => setShowAddModal(false)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" style={styles.saveBtn} onPress={handleCreateVisit} disabled={creating}>
                {creating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Crear invitación</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 2: Automatic WhatsApp Sent Confirmation */}
      <Modal visible={!!shareData} transparent animationType="fade" onRequestClose={() => setShareData(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <Text accessibilityElementsHidden importantForAccessibility="no" style={{ fontSize: 32 }}>📲</Text>
              </View>
              <Text style={styles.modalTitle}>{shareData?.sent ? '¡Invitación Enviada!' : 'Comparte la invitación'}</Text>
            </View>

            <Text style={{ fontSize: 14, color: '#1E293B', marginBottom: 12, textAlign: 'center', lineHeight: 20 }}>
              {shareData?.sent ? (
                <>Se ha enviado automáticamente el enlace de registro por WhatsApp al número de <Text style={{ fontWeight: 'bold' }}>{shareData?.visitorName}</Text>.</>
              ) : (
                <>La invitación de <Text style={{ fontWeight: 'bold' }}>{shareData?.visitorName}</Text> se creó, pero no se envió automáticamente por WhatsApp. Compártela o copia el enlace.</>
              )}
            </Text>

            <View style={{ backgroundColor: '#F1F5F9', padding: 12, borderRadius: 12, marginBottom: 20 }}>
              <Text accessibilityLabel="Seguridad de Acceso: El enlace único se entrega directamente al número registrado para evitar que la invitación sea enviada a otra persona." style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 16 }}>
                🔒 <Text style={{ fontWeight: 'bold' }}>Seguridad de Acceso:</Text> El enlace único se entrega directamente al número registrado para evitar que la invitación sea enviada a otra persona.
              </Text>
            </View>

            {!shareData?.sent && (
              <>
                <TouchableOpacity accessibilityRole="button" style={[styles.saveBtn, { marginBottom: 8 }]} onPress={handleShareWhatsApp}>
                  <Text style={styles.saveBtnText}>Compartir</Text>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" style={[styles.cancelBtn, { alignItems: 'center', marginBottom: 8 }]} onPress={handleCopyLink}>
                  <Text style={styles.cancelBtnText}>Copiar enlace</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              accessibilityRole="button"
              style={shareData?.sent ? styles.saveBtn : [styles.cancelBtn, { alignItems: 'center' }]}
              onPress={() => setShareData(null)}
            >
              <Text style={shareData?.sent ? styles.saveBtnText : styles.cancelBtnText}>{shareData?.sent ? 'Entendido' : 'Cerrar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Guard Access Scanner */}
      <Modal
        visible={canUseGuardFunctions && showGuardModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowGuardModal(false);
          setScanResult(null);
          setQrInputToken('');
        }}
      >
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={{ width: '100%' }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <Text style={styles.modalTitle}>Validar Visitante (Caseta de Seguridad)</Text>
            <Text style={styles.modalDesc}>Escanea o ingresa el código de token dinámico del visitante.</Text>

            <TextInput
              accessibilityLabel="Código de acceso del visitante"
              style={[styles.input, { fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' }]}
              placeholder="Ej. ACCESS-8F92A7C1"
              returnKeyType="done"
              onSubmitEditing={handleScanQR}
              value={qrInputToken}
              onChangeText={setQrInputToken}
            />

            <TouchableOpacity accessibilityRole="button" style={styles.saveBtn} onPress={handleScanQR} disabled={validatingQr}>
              {validatingQr ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text accessibilityLabel="Validar Código QR" style={styles.saveBtnText}>🔍 Validar Código QR</Text>
              )}
            </TouchableOpacity>

            {/* Scan Result Details */}
            {scanResult && (
              <View style={{ marginTop: 16 }}>
                {!scanResult.valid ? (
                  <View style={styles.errorBanner}>
                    <Text accessibilityLabel="Acceso Denegado" style={styles.errorBannerTitle}>❌ Acceso Denegado</Text>
                    <Text style={styles.errorBannerDesc}>{scanResult.message}</Text>
                  </View>
                ) : (
                  <View style={styles.successBanner}>
                    <Text accessibilityLabel="Visitante autorizado" style={styles.successBannerTitle}>✅ VISITANTE AUTORIZADO</Text>

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
                      accessibilityRole="button"
                      style={styles.confirmEntryBtn}
                      onPress={() => handleConfirmEntry(scanResult.visit.id)}
                      disabled={confirmingEntry}
                    >
                      {confirmingEntry ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text accessibilityLabel="Confirmar ingreso" style={styles.confirmEntryBtnText}>✅ Confirmar ingreso</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.cancelBtn, { marginTop: 16, alignItems: 'center' }]}
              onPress={() => {
                setShowGuardModal(false);
                setScanResult(null);
                setQrInputToken('');
              }}
            >
              <Text style={styles.cancelBtnText}>Cerrar escáner</Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 4: Visit Detail View */}
      <Modal visible={!!selectedVisit} transparent animationType="fade" onRequestClose={() => setSelectedVisit(null)}>
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
                  <Text style={styles.detailRow}><Text style={{ fontWeight: 'bold' }}>Documento:</Text> {selectedVisit.documentType ? `${selectedVisit.documentType}: ` : ''}{selectedVisit.documentNumber || 'Sin dato'}</Text>
                  
                  {selectedVisit.hasVehicle && (
                    <Text style={styles.detailRow}><Text style={{ fontWeight: 'bold' }}>Vehículo:</Text> {selectedVisit.vehicleModel || ''} - Placa: {selectedVisit.vehiclePlate}</Text>
                  )}

                  {selectedVisit.entryDate && (
                    <Text style={styles.detailRow}><Text style={{ fontWeight: 'bold', color: '#15803D' }}>Hora de ingreso:</Text> {new Date(selectedVisit.entryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  )}
                </View>

                {(selectedVisit.status === 'PENDIENTE_REGISTRO' || selectedVisit.status === 'DATOS_COMPLETADOS') && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={styles.deleteBtn}
                    onPress={() => handleCancelVisit(selectedVisit.id)}
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <ActivityIndicator color="#DC2626" />
                    ) : (
                      <Text accessibilityLabel="Cancelar Invitación" style={styles.deleteBtnText}>🚫 Cancelar Invitación</Text>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  accessibilityRole="button"
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
  container: { flex: 1, backgroundColor: '#0A0F1F' },
  header: {
    minHeight: 80,
    backgroundColor: '#2A0A73',
    borderBottomWidth: 3,
    borderBottomColor: '#6203FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  guardHeaderBtn: { backgroundColor: 'rgba(29, 107, 224, 0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: colors.primary },
  guardHeaderBtnText: { color: '#FFCF36', fontWeight: '900', fontSize: 12 },
  tabBar: { flexDirection: 'row', backgroundColor: '#141A2E', borderBottomWidth: 2, borderBottomColor: '#2A0A73' },
  tabItem: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  activeTabItem: { borderBottomWidth: 3, borderBottomColor: '#FFCF36' },
  tabText: { fontSize: 12, fontWeight: '800', color: '#94A3B8', textAlign: 'center' },
  activeTabText: { color: '#FFCF36' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: '#94A3B8', fontSize: 14 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  emptyStateCard: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  illustrationWrap: { marginBottom: 20 },
  mockWindow: { width: 90, height: 80, borderWidth: 2, borderColor: '#6203FF', borderRadius: 12, alignItems: 'center', paddingTop: 8, backgroundColor: '#141A2E' },
  windowHeader: { width: 70, height: 4, backgroundColor: '#2A0A73', borderRadius: 2, marginBottom: 12 },
  sadFace: { fontSize: 32 },
  retryBtn: { minHeight: 44, justifyContent: 'center', marginTop: 16, backgroundColor: '#1D6BE0', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
  visitCard: { backgroundColor: '#141A2E', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'rgba(98, 3, 255, 0.3)', borderBottomWidth: 4, borderBottomColor: '#2A0A73' },
  cardHeaderRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  visitorNameText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  badgeContainer: { flexShrink: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '900' },
  cardBodyInfo: { gap: 4 },
  infoLineText: { fontSize: 13, color: '#CBD5E1' },
  entryTimeText: { fontSize: 12, color: '#10B981', fontWeight: '900', marginTop: 4 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    borderBottomWidth: 4,
    borderBottomColor: '#0B3C91',
  },
  fabIcon: { color: '#FFFFFF', fontSize: 32, marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
  modalDesc: { fontSize: 12, color: '#64748B', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#475569', marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#0F172A' },
  dateFieldText: { fontSize: 14, color: '#0F172A' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  cancelBtn: { minHeight: 44, justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { color: '#64748B', fontWeight: '600' },
  saveBtn: { minHeight: 44, justifyContent: 'center', backgroundColor: '#1D6BE0', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFFFFF', fontWeight: 'bold' },
  linkBox: { backgroundColor: '#F1F5F9', padding: 12, borderRadius: 12, marginBottom: 12 },
  linkText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  waBtn: { backgroundColor: '#16803C', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  waBtnText: { color: '#FFFFFF', fontWeight: 'bold' },
  copyBtn: { backgroundColor: '#E2E8F0', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  copyBtnText: { color: '#334155', fontWeight: 'bold' },
  optionChip: { flex: 1, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#F8FAFC', alignItems: 'center' },
  optionChipActive: { borderColor: colors.primary, backgroundColor: '#EFF6FF' },
  optionChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  optionChipTextActive: { color: '#1D4ED8', fontWeight: 'bold' },
  timeSlotChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  timeSlotChipActive: { borderColor: colors.primary, backgroundColor: '#EFF6FF' },
  timeSlotChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  timeSlotChipTextActive: { color: '#1D4ED8', fontWeight: 'bold' },
  errorBanner: { backgroundColor: '#FEE2E2', padding: 14, borderRadius: 12 },
  errorBannerTitle: { color: '#DC2626', fontWeight: 'bold', fontSize: 14 },
  errorBannerDesc: { color: '#991B1B', fontSize: 12, marginTop: 2 },
  successBanner: { backgroundColor: '#DCFCE7', padding: 14, borderRadius: 12 },
  successBannerTitle: { color: '#16A34A', fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  detailsBox: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 10, gap: 4, marginBottom: 10 },
  detailRow: { fontSize: 13, color: '#334155' },
  confirmEntryBtn: { minHeight: 44, justifyContent: 'center', backgroundColor: '#16A34A', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  confirmEntryBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  deleteBtn: { minHeight: 44, justifyContent: 'center', backgroundColor: '#FEE2E2', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  deleteBtnText: { color: '#DC2626', fontWeight: 'bold' },
});

export default VisitasScreen;
