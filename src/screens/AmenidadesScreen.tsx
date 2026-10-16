import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// @ts-ignore
import * as WebBrowser from 'expo-web-browser';
import { apiService } from '../services/api';
import { localDateISO, isValidTimeHM, parseLocalDateTime, formatDateLocal } from '../utils/dates';
import { DateTimeField } from '../components/DateTimeField';
import { colors } from '../theme';

try {
  WebBrowser.maybeCompleteAuthSession();
} catch (e) {
  console.log('WebBrowser auth session init error:', e);
}

interface Amenity {
  id: string;
  name: string;
  type: string;
  imageUrl?: string;
  price: number;
  maxReservationTime: number;
  availableDays: string;
  startTime: string;
  endTime: string;
  active: boolean;
}

interface PendingReservation {
  id: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  reservationStatus: string;
  paymentStatus: string;
  price: number;
  amenity: { id: string; name: string; price: number };
}

interface ReservationSlot {
  id: string;
  startTime: string;
  endTime: string;
  reservationStatus: string;
}

export const AmenidadesScreen: React.FC = () => {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [pendingReservations, setPendingReservations] = useState<PendingReservation[]>([]);

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return localDateISO();
  });
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [notes, setNotes] = useState('');
  const [bookedSlots, setBookedSlots] = useState<ReservationSlot[]>([]);
  const [checkingSlots, setCheckingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wompi Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingReservationId, setPendingReservationId] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessingWompi, setIsProcessingWompi] = useState(false);

  // Success Confirmation Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [resultTitle, setResultTitle] = useState('¡Reserva Confirmada!');
  const [resultIcon, setResultIcon] = useState('🎉');

  useEffect(() => {
    fetchAmenities();
  }, []);

  useEffect(() => {
    if (selectedAmenity && isBookingModalOpen) {
      checkAvailability(selectedAmenity.id, selectedDate);
    }
  }, [selectedAmenity, selectedDate, isBookingModalOpen]);

  // Reservas propias pendientes de pago (con monto a cobrar) para poder retomar el pago
  const fetchPendingReservations = async () => {
    try {
      const res = await apiService.getMyReservations('PENDING');
      if (res.success) {
        setPendingReservations(
          (res.reservations || []).filter(
            (r) => r.reservationStatus === 'PENDING' && r.paymentStatus === 'PENDING' && Number(r.price) > 0
          )
        );
      }
    } catch (err) {
      console.error('Error fetching pending reservations:', err);
    }
  };

  const handleResumePayment = (r: PendingReservation) => {
    const known = amenities.find((a) => a.id === r.amenity.id);
    setSelectedAmenity({ ...(known || r.amenity), price: Number(r.price) } as Amenity);
    setPendingReservationId(r.id);
    setIsPaymentModalOpen(true);
  };

  const fetchAmenities = async (isRefresh = false) => {
    fetchPendingReservations();
    try {
      if (!isRefresh) setLoading(true);
      setLoadError(false);
      const res = await apiService.getResidentAmenities();
      if (res.success) {
        setAmenities(res.amenities || []);
      }
    } catch (err) {
      console.error('Error fetching resident amenities:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkAvailability = async (amenityId: string, dateStr: string) => {
    try {
      setCheckingSlots(true);
      const res = await apiService.getAmenityAvailability(amenityId, dateStr);
      if (res.success) {
        setBookedSlots(res.bookedSlots || []);
      }
    } catch (err) {
      console.error('Error checking availability:', err);
    } finally {
      setCheckingSlots(false);
    }
  };

  const openBookingModal = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
    const today = localDateISO();
    setSelectedDate(today);
    setStartTime(amenity.startTime || '10:00');

    // Default duration: 2 hours or max
    const startHour = parseInt((amenity.startTime || '10:00').split(':')[0], 10);
    const endHour = Math.min(startHour + Math.min(amenity.maxReservationTime, 2), 22);
    const endHourStr = endHour < 10 ? `0${endHour}:00` : `${endHour}:00`;
    setEndTime(endHourStr);

    setNotes('');
    setIsBookingModalOpen(true);
  };

  // Helper date selector for next 7 days
  const getNext7Days = () => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = localDateISO(d);
      const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' });
      const dayNum = d.getDate();
      list.push({ iso, dayName: dayName.toUpperCase(), dayNum });
    }
    return list;
  };

  const dateOptions = getNext7Days();

  const handleConfirmReservation = async () => {
    if (!selectedAmenity) return;

    if (!isValidTimeHM(startTime) || !isValidTimeHM(endTime)) {
      Alert.alert('Horario no válido', 'Selecciona una hora de inicio y una hora de fin válidas.');
      return;
    }
    if (parseLocalDateTime(selectedDate, startTime).getTime() < Date.now()) {
      Alert.alert('Horario no válido', 'La fecha y la hora de inicio no pueden ser anteriores al momento actual.');
      return;
    }
    if (endTime <= startTime) {
      Alert.alert('Horario no válido', 'La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }
    if (
      isValidTimeHM(selectedAmenity.startTime) && isValidTimeHM(selectedAmenity.endTime) &&
      (startTime < selectedAmenity.startTime || endTime > selectedAmenity.endTime)
    ) {
      Alert.alert('Horario no válido', `Esta amenidad está disponible de ${selectedAmenity.startTime} a ${selectedAmenity.endTime}.`);
      return;
    }
    const overlap = bookedSlots.find((b) => startTime < b.endTime && endTime > b.startTime);
    if (overlap) {
      Alert.alert('Horario ocupado', `El horario se cruza con una reserva existente (${overlap.startTime} - ${overlap.endTime}).`);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiService.createReservation({
        amenityId: selectedAmenity.id,
        reservationDate: selectedDate,
        startTime,
        endTime,
        notes,
      });

      if (res.success) {
        setIsBookingModalOpen(false);

        if (res.requirePayment && res.reservation?.id) {
          // Open Wompi payment modal
          setPendingReservationId(res.reservation.id);
          setIsPaymentModalOpen(true);
          fetchPendingReservations();
        } else {
          // Free reservation confirmed directly
          setResultTitle('¡Reserva Confirmada!');
          setResultIcon('🎉');
          setSuccessMessage(`¡Tu reservación para "${selectedAmenity.name}" ha sido confirmada exitosamente!`);
          setIsSuccessModalOpen(true);
          fetchAmenities();
        }
      } else {
        Alert.alert('Reserva No Permitida', res.message || 'Error al procesar reserva.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error de comunicación con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Consulta el estado real de la reserva propia: 'PAID' | 'FAILED' (cancelada, vencida, rechazada o pago fallido) | 'PENDING'
  const getReservationPaymentOutcome = async (reservationId: string): Promise<'PAID' | 'FAILED' | 'PENDING'> => {
    try {
      const res = await apiService.getMyReservation(reservationId);
      const { reservationStatus, paymentStatus } = res.reservation || ({} as any);
      if (paymentStatus === 'PAID') return 'PAID';
      if (
        ['CANCELLED', 'EXPIRED', 'REJECTED'].includes(reservationStatus) ||
        ['FAILED', 'CANCELLED'].includes(paymentStatus)
      ) {
        return 'FAILED';
      }
      return 'PENDING';
    } catch (err) {
      return 'PENDING';
    }
  };

  // Avisa que la reserva queda pendiente al cerrar el modal de pago
  const handleClosePaymentModal = () => {
    Alert.alert(
      'Pago pendiente',
      'Si cierras esta ventana, tu reserva quedará pendiente de pago y el espacio seguirá apartado hasta que se confirme o se cancele. ¿Deseas cerrarla?',
      [
        { text: 'Seguir pagando', style: 'cancel' },
        { text: 'Cerrar', style: 'destructive', onPress: () => setIsPaymentModalOpen(false) },
      ]
    );
  };

  const handleProcessWompiPayment = async () => {
    if (!pendingReservationId || !selectedAmenity) return;

    if (!cardNumber || cardNumber.length < 15) {
      Alert.alert('Dato Requerido', 'Por favor ingresa un número de tarjeta válido.');
      return;
    }
    if (!cvv || cvv.length < 3) {
      Alert.alert('Dato Requerido', 'Por favor ingresa el código CVV.');
      return;
    }
    if (!expiryMonth || !expiryYear) {
      Alert.alert('Dato Requerido', 'Por favor ingresa la fecha de vencimiento de la tarjeta.');
      return;
    }

    try {
      setIsProcessingWompi(true);
      const nameParts = (cardHolder || 'Residente Zentary').trim().split(' ');
      const firstName = nameParts[0] || 'Residente';
      const lastName = nameParts.slice(1).join(' ') || 'Zentary';

      const res = await apiService.createReservationWompiPayment(pendingReservationId, {
        numeroTarjeta: cardNumber.replace(/\s+/g, ''),
        cvv,
        mesVencimiento: parseInt(expiryMonth, 10),
        anioVencimiento: parseInt(expiryYear, 10),
        nombre: firstName,
        apellido: lastName,
      });

      if (res.success && res.urlCompletarPago3Ds) {
        setIsPaymentModalOpen(false);

        try {
          // Open 3DS WebBrowser redirect window
          const authResult = await WebBrowser.openAuthSessionAsync(
            res.urlCompletarPago3Ds,
            'zentary://amenities'
          );

          // El resultado del navegador no confirma el pago: se consulta el estado real de la reserva
          if (authResult.type === 'success' || authResult.type === 'dismiss' || authResult.type === 'cancel' || authResult.type === 'locked') {
            const outcome = await getReservationPaymentOutcome(pendingReservationId);
            if (outcome === 'PAID') {
              setResultTitle('¡Reserva Confirmada!');
              setResultIcon('🎉');
              setSuccessMessage(`¡Pago procesado con éxito! Tu reservación para "${selectedAmenity.name}" ha sido confirmada.`);
            } else if (outcome === 'FAILED') {
              // Solo estados terminales (reserva cancelada/vencida/rechazada o pago fallido)
              setResultTitle('Reserva no confirmada');
              setResultIcon('⚠️');
              setSuccessMessage('Tu reserva fue cancelada o rechazada y no está confirmada. Si se realizó un cargo, la administración lo revisará.');
            } else {
              setResultTitle('Pago en verificación');
              setResultIcon('⏳');
              setSuccessMessage('Estamos verificando tu pago. Revisa el estado de tu reserva en unos minutos.');
            }
            setIsSuccessModalOpen(true);
            fetchAmenities();
          }
        } catch (webErr) {
          console.warn('WebBrowser error, falling back to Linking:', webErr);
          await Linking.openURL(res.urlCompletarPago3Ds);
          setResultTitle('Pago en verificación');
          setResultIcon('⏳');
          setSuccessMessage('Estamos verificando tu pago. Revisa el estado de tu reserva en unos minutos.');
          setIsSuccessModalOpen(true);
          fetchAmenities();
        }
      } else {
        Alert.alert('Error en Pago', res.message || 'No se pudo iniciar el pago con tarjeta.');
        fetchPendingReservations();
      }
    } catch (err: any) {
      if (err.status === 409) setIsPaymentModalOpen(false);
      Alert.alert('Error en el pago', err.message || 'Fallo en la comunicación con el procesador de pago.');
      fetchPendingReservations();
    } finally {
      setIsProcessingWompi(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.headerIcon}>🏰</Text>
          <View>
            <Text style={styles.headerTitle}>Amenidades y Espacios Comunes</Text>
            <Text style={styles.headerSubtitle}>Reserva áreas de tu residencial Zentary</Text>
          </View>
        </View>
      </View>

      {/* Content Body */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFCF36" />
          <Text style={styles.loadingText}>Cargando amenidades de tu residencial...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchAmenities(true);
              }}
              colors={['#FFCF36']}
            />
          }
        >
          {loadError ? (
            <View style={styles.emptyContainer}>
              <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.emptyIcon}>⚠️</Text>
              <Text style={styles.emptyTitle}>No se pudieron cargar las amenidades</Text>
              <Text style={styles.emptyText}>Revisa tu conexión e intenta de nuevo.</Text>
              <TouchableOpacity accessibilityRole="button" style={styles.retryBtn} onPress={() => fetchAmenities()}>
                <Text style={styles.retryBtnText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : amenities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.emptyIcon}>🏛️</Text>
              <Text style={styles.emptyTitle}>No hay amenidades disponibles</Text>
              <Text style={styles.emptyText}>
                Tu administración aún no ha publicado amenidades para reservar.
              </Text>
            </View>
          ) : (
            <>
            {pendingReservations.length > 0 && (
              <View style={styles.pendingSection}>
                <Text style={styles.pendingTitle}>Mis reservas pendientes de pago</Text>
                {pendingReservations.map((r) => (
                  <View key={r.id} style={styles.pendingRow}>
                    <View style={styles.pendingInfo}>
                      <Text style={styles.pendingName}>{r.amenity.name}</Text>
                      <Text style={styles.pendingDetail}>
                        {formatDateLocal(r.reservationDate.slice(0, 10))} · {r.startTime} - {r.endTime}
                      </Text>
                    </View>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Pagar reserva de ${r.amenity.name}`}
                      style={styles.pendingPayBtn}
                      activeOpacity={0.85}
                      onPress={() => handleResumePayment(r)}
                    >
                      <Text style={styles.pendingPayBtnText}>Pagar</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            {amenities.map((item) => (
              <View key={item.id} style={styles.amenityCard}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.amenityImage} />
                ) : (
                  <View style={[styles.amenityImage, styles.amenityImagePlaceholder]}>
                    <Text style={styles.amenityImagePlaceholderText}>Sin imagen</Text>
                  </View>
                )}

                <View style={styles.cardHeaderBadges}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{item.type}</Text>
                  </View>
                  <View style={[styles.priceBadge, item.price === 0 && styles.freeBadge]}>
                    <Text style={styles.priceBadgeText}>
                      {item.price === 0 ? '¡GRATIS!' : `$${item.price.toFixed(2)}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.amenityBody}>
                  <Text style={styles.amenityName}>{item.name}</Text>

                  <View style={styles.infoRow}>
                    <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.infoIcon}>⏰</Text>
                    <Text style={styles.infoText}>
                      Horario: <Text style={styles.infoHighlight}>{item.startTime} - {item.endTime}</Text>
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.infoIcon}>⌛</Text>
                    <Text style={styles.infoText}>
                      Duración máxima: <Text style={styles.infoHighlight}>{item.maxReservationTime} {item.maxReservationTime === 1 ? 'hora' : 'horas'}</Text>
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.infoIcon}>📅</Text>
                    <Text style={styles.infoText}>
                      Días: <Text style={styles.infoHighlight}>{item.availableDays}</Text>
                    </Text>
                  </View>

                  <TouchableOpacity
                    accessibilityRole="button"
                    style={styles.reserveBtn}
                    activeOpacity={0.85}
                    onPress={() => openBookingModal(item)}
                  >
                    <Text style={styles.reserveBtnText}>RESERVAR ESPACIO ›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            </>
          )}
        </ScrollView>
      )}

      {/* BOOKING MODAL */}
      <Modal visible={isBookingModalOpen} animationType="slide" transparent onRequestClose={() => setIsBookingModalOpen(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reservar {selectedAmenity?.name}</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => setIsBookingModalOpen(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.closeModalBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Step 1: Select Date */}
              <Text style={styles.inputLabel}>1. Selecciona la Fecha:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateSelectorRow} contentContainerStyle={{ paddingRight: 16 }}>
                {dateOptions.map((opt) => {
                  const isSelected = selectedDate === opt.iso;
                  return (
                    <TouchableOpacity
                      accessibilityRole="button" accessibilityState={{ selected: isSelected }}
                      key={opt.iso}
                      style={[styles.dateChip, isSelected && styles.selectedDateChip]}
                      onPress={() => setSelectedDate(opt.iso)}
                    >
                      <Text style={[styles.dateChipDay, isSelected && styles.selectedDateChipText]}>
                        {opt.dayName}
                      </Text>
                      <Text style={[styles.dateChipNum, isSelected && styles.selectedDateChipText]}>
                        {opt.dayNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Occupied Slots Indicator */}
              <View style={styles.occupiedSection}>
                <Text style={styles.occupiedTitle}>
                  Horarios Ocupados el {formatDateLocal(selectedDate)}:
                </Text>
                {checkingSlots ? (
                  <ActivityIndicator size="small" color="#FFCF36" />
                ) : bookedSlots.length === 0 ? (
                  <Text accessibilityLabel="Sin reservas previas en este día." style={styles.noOccupiedText}>✓ Sin reservas previas en este día.</Text>
                ) : (
                  bookedSlots.map((b) => (
                    <View key={b.id} style={styles.occupiedBadge}>
                      <Text accessibilityLabel={`Ocupado: ${b.startTime} - ${b.endTime}`} style={styles.occupiedBadgeText}>
                        ⚠️ Ocupado: {b.startTime} - {b.endTime}
                      </Text>
                    </View>
                  ))
                )}
              </View>

              {/* Step 2: Time Picker Inputs */}
              <Text style={styles.inputLabel}>2. Horario Deseado:</Text>
              <View style={styles.timeRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.subInputLabel}>Hora Inicio</Text>
                  <DateTimeField
                    mode="time"
                    accessibilityLabel="Hora de inicio"
                    value={startTime}
                    onChange={setStartTime}
                    style={styles.timeInput}
                    textStyle={styles.timeInputText}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.subInputLabel}>Hora Fin</Text>
                  <DateTimeField
                    mode="time"
                    accessibilityLabel="Hora de fin"
                    value={endTime}
                    onChange={setEndTime}
                    style={styles.timeInput}
                    textStyle={styles.timeInputText}
                  />
                </View>
              </View>

              {/* Step 3: Notes */}
              <Text style={styles.inputLabel}>3. Notas Adicionales (Opcional):</Text>
              <TextInput
                accessibilityLabel="Notas adicionales"
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ej: Cumpleaños familiar, 10 asistentes..."
                placeholderTextColor="#64748B"
                multiline
              />

              {/* Total Summary */}
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Total a Pagar:</Text>
                <Text style={styles.summaryAmount}>
                  {selectedAmenity?.price === 0 ? '$0.00 (Gratuito)' : `$${selectedAmenity?.price.toFixed(2)} USD`}
                </Text>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                style={styles.confirmBtn}
                onPress={handleConfirmReservation}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>
                    {selectedAmenity?.price === 0 ? 'CONFIRMAR RESERVACIÓN' : 'CONTINUAR AL PAGO (WOMPI)'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* WOMPI CARD PAYMENT MODAL */}
      <Modal visible={isPaymentModalOpen} animationType="slide" transparent onRequestClose={handleClosePaymentModal}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text accessibilityLabel="Pago con tarjeta" style={styles.modalTitle}>💳 Pago con tarjeta</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cerrar" onPress={handleClosePaymentModal} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.closeModalBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.paymentSummaryBox}>
                <Text style={styles.paySummaryTitle}>Reserva de {selectedAmenity?.name}</Text>
                <Text style={styles.paySummaryPrice}>
                  Monto a Cobrar: ${selectedAmenity?.price.toFixed(2)} USD
                </Text>
              </View>

              <Text style={styles.inputLabel}>Número de Tarjeta (Visa / Mastercard):</Text>
              <TextInput
                accessibilityLabel="Número de tarjeta"
                style={styles.textInput}
                value={cardNumber}
                onChangeText={setCardNumber}
                placeholder="4000 1234 5678 9010"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                maxLength={19}
              />

              <Text style={styles.inputLabel}>Nombre del Titular:</Text>
              <TextInput
                accessibilityLabel="Nombre del titular"
                style={styles.textInput}
                value={cardHolder}
                onChangeText={setCardHolder}
                placeholder="Nombre impreso en la tarjeta"
                placeholderTextColor="#64748B"
              />

              <View style={styles.timeRow}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.subInputLabel}>Mes (MM)</Text>
                  <TextInput
                    accessibilityLabel="Mes de vencimiento"
                    style={styles.textInput}
                    value={expiryMonth}
                    onChangeText={setExpiryMonth}
                    placeholder="12"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
                <View style={{ flex: 1, marginHorizontal: 6 }}>
                  <Text style={styles.subInputLabel}>Año (AAAA)</Text>
                  <TextInput
                    accessibilityLabel="Año de vencimiento"
                    style={styles.textInput}
                    value={expiryYear}
                    onChangeText={setExpiryYear}
                    placeholder="2028"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.subInputLabel}>CVV</Text>
                  <TextInput
                    accessibilityLabel="CVV"
                    style={styles.textInput}
                    value={cvv}
                    onChangeText={setCvv}
                    placeholder="123"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={4}
                  />
                </View>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                style={styles.wompiPayBtn}
                onPress={handleProcessWompiPayment}
                disabled={isProcessingWompi}
                activeOpacity={0.85}
              >
                {isProcessingWompi ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.wompiPayBtnText}>PAGAR CON TARJETA ›</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* SUCCESS CONFIRMATION MODAL */}
      <Modal visible={isSuccessModalOpen} animationType="fade" transparent onRequestClose={() => setIsSuccessModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.successModalContent]}>
            <Text style={styles.successIcon}>{resultIcon}</Text>
            <Text style={styles.successTitle}>{resultTitle}</Text>
            <Text style={styles.successBody}>{successMessage}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.successCloseBtn}
              onPress={() => setIsSuccessModalOpen(false)}
            >
              <Text style={styles.successCloseBtnText}>VOLVER A MIS AMENIDADES</Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#0A0F1F',
    borderBottomWidth: 1,
    borderBottomColor: '#2A0A73',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFCF36',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  retryBtn: { minHeight: 44, justifyContent: 'center', marginTop: 16, backgroundColor: '#1D6BE0', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  pendingSection: { marginBottom: 20 },
  pendingTitle: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', marginBottom: 10 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141A2E', borderRadius: 16, borderWidth: 1.5, borderColor: '#2A0A73', padding: 12, marginBottom: 10 },
  pendingInfo: { flex: 1, marginRight: 12 },
  pendingName: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  pendingDetail: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  pendingPayBtn: { minHeight: 44, minWidth: 80, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 16, borderRadius: 12 },
  pendingPayBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  amenityCard: {
    backgroundColor: '#141A2E',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#2A0A73',
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#6203FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  amenityImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  amenityImagePlaceholder: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityImagePlaceholderText: {
    color: '#6B7280',
    fontSize: 14,
  },
  cardHeaderBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeBadge: {
    backgroundColor: 'rgba(10, 15, 31, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 207, 54, 0.5)',
  },
  typeBadgeText: {
    color: '#FFCF36',
    fontSize: 12,
    fontWeight: '800',
  },
  priceBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  freeBadge: {
    backgroundColor: '#047857',
  },
  priceBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  amenityBody: {
    padding: 16,
  },
  amenityName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoIcon: {
    fontSize: 13,
    marginRight: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  infoHighlight: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  reserveBtn: {
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 14,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#0B3C91',
  },
  reserveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 31, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#141A2E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: '#6203FF',
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A0A73',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  closeModalBtn: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: '900',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFCF36',
    marginTop: 12,
    marginBottom: 8,
  },
  subInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dateChip: {
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: '#0A0F1F',
    borderWidth: 1,
    borderColor: '#2A0A73',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  selectedDateChip: {
    backgroundColor: colors.primary,
    borderColor: '#FFCF36',
  },
  dateChipDay: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },
  dateChipNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  selectedDateChipText: {
    color: '#FFFFFF',
  },
  occupiedSection: {
    backgroundColor: '#0A0F1F',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A0A73',
  },
  occupiedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 6,
  },
  noOccupiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  occupiedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  occupiedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F87171',
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timeInput: {
    minHeight: 44,
    backgroundColor: '#0A0F1F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A0A73',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timeInputText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: '#0A0F1F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A0A73',
    color: '#FFFFFF',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 207, 54, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFCF36',
    padding: 14,
    marginVertical: 16,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFCF36',
  },
  confirmBtn: {
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#0B3C91',
    marginBottom: 12,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  paymentSummaryBox: {
    backgroundColor: '#0A0F1F',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A0A73',
    marginBottom: 12,
  },
  paySummaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  paySummaryPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFCF36',
    marginTop: 4,
  },
  textInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  wompiPayBtn: {
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#0B3C91',
    marginTop: 12,
    marginBottom: 12,
  },
  wompiPayBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  successModalContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIcon: {
    fontSize: 50,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  successBody: {
    fontSize: 13,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 24,
  },
  successCloseBtn: {
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  successCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});

export default AmenidadesScreen;
