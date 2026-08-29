import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  AppState,
} from 'react-native';
import { apiService } from '../services/api';

interface PaymentItem {
  id: string;
  concept: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidAt?: string;
  paymentMethod?: string;
  externalTransactionId?: string;
}

const INITIAL_FALLBACK_PAYMENTS: PaymentItem[] = [
  {
    id: 'pay-001',
    concept: 'Cuota de Mantenimiento Agosto 2026',
    amount: 85.0,
    dueDate: '30 Ago 2026',
    status: 'PENDING',
  },
  {
    id: 'pay-002',
    concept: 'Reserva de Área Social - Terraza',
    amount: 25.0,
    dueDate: '15 Ago 2026',
    status: 'PAID',
    paymentMethod: 'Wompi 3DS',
    externalTransactionId: 'WOMPI-TXN-99820',
  },
];

interface PaymentsScreenProps {
  onBack?: () => void;
}

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({ onBack }) => {
  const [payments, setPayments] = useState<PaymentItem[]>(INITIAL_FALLBACK_PAYMENTS);
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [processing, setProcessing] = useState(false);

  // Wompi 3DS Form State
  const [cardHolderFirstName, setCardHolderFirstName] = useState('');
  const [cardHolderLastName, setCardHolderLastName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await apiService.getPayments();
      if (res.success && Array.isArray(res.payments) && res.payments.length > 0) {
        const formatted = res.payments.map((p: any) => ({
          id: p.id,
          concept: p.concept,
          amount: typeof p.amount === 'number' ? p.amount : parseFloat(p.amount || '0'),
          dueDate: p.dueDate ? new Date(p.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pendiente',
          status: p.status as 'PENDING' | 'PAID' | 'OVERDUE',
          paidAt: p.paidAt,
          paymentMethod: p.paymentMethod,
          externalTransactionId: p.externalTransactionId,
        }));
        setPayments(formatted);
      }
    } catch (err) {
      console.log('⚠️ Usando datos de respaldo para la lista de pagos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    // Re-consultar estado de pagos al regresar la app a primer plano
    const subscription = AppState.addEventListener('change', (nextAppState: any) => {
      if (nextAppState === 'active') {
        fetchPayments();
      }
    });

    const urlListener = Linking.addEventListener('url', () => {
      fetchPayments();
    });

    return () => {
      subscription.remove();
      urlListener.remove();
    };
  }, []);


  const handlePayNow = (item: PaymentItem) => {
    setSelectedPayment(item);
    setCardNumber('');
    setCvv('');
    setExpMonth('');
    setExpYear('');
  };

  const handleProcessWompi3Ds = async () => {
    if (!selectedPayment) return;

    if (!cardNumber || !cvv || !expMonth || !expYear || !cardHolderFirstName || !cardHolderLastName) {
      Alert.alert('Campos Incompletos', 'Por favor completa todos los datos de la tarjeta de crédito/débito.');
      return;
    }

    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 13) {
      Alert.alert('Tarjeta Inválida', 'Por favor ingresa un número de tarjeta válido (13 a 19 dígitos).');
      return;
    }

    try {
      setProcessing(true);

      const payload = {
        paymentId: selectedPayment.id,
        numeroTarjeta: cleanCard,
        cvv: cvv.trim(),
        mesVencimiento: parseInt(expMonth, 10),
        anioVencimiento: parseInt(expYear.length === 2 ? `20${expYear}` : expYear, 10),
        nombre: cardHolderFirstName.trim(),
        apellido: cardHolderLastName.trim(),
        email: email.trim() || 'notificaciones@zentary.app',
        telefono: phone.trim() || '70000000',
        ciudad: 'San Salvador',
        direccion: 'Residencial Zentary',
        idPais: 'SV',
        idRegion: 'SV-SS',
        codigoPostal: '01101',
      };

      console.log('💳 [WOMPI 3DS SUBMIT] Enviando payload:', payload);
      const res = await apiService.createWompi3DsPayment(payload);

      if (res.success && res.urlCompletarPago3Ds) {
        Alert.alert(
          '🔒 Autenticación Wompi 3DS',
          'Se abrirá la pasarela segura de Wompi para completar la verificación de tu banco.',
          [
            {
              text: 'Continuar al Banco',
              onPress: async () => {
                try {
                  await Linking.openURL(res.urlCompletarPago3Ds);
                } catch (linkErr) {
                  Alert.alert('Enlace 3DS', `Abre este enlace en tu navegador para completar el pago:\n${res.urlCompletarPago3Ds}`);
                }
                setSelectedPayment(null);
                fetchPayments();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error de Pago', res.message || 'No se pudo iniciar la transacción Wompi 3DS.');
      }
    } catch (error: any) {
      Alert.alert('Error de Conexión', error.message || 'Fallo al comunicarse con el servidor de pagos.');
    } finally {
      setProcessing(false);
    }
  };

  const totalPendingBalance = payments
    .filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Pagos y Cuotas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Balance Total Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo Pendiente Total</Text>
          <Text style={styles.balanceAmount}>${totalPendingBalance.toFixed(2)}</Text>
          <Text style={styles.balanceSubtext}>Zentary Payment Gateway • Wompi 3DS</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historial de Cobros</Text>
          {loading && <ActivityIndicator size="small" color="#2B82FB" />}
        </View>

        {payments.map((item) => (
          <View key={item.id} style={styles.paymentCard}>
            <View style={styles.paymentMain}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.conceptTitle}>{item.concept}</Text>
                <Text style={styles.dueDate}>Vence: {item.dueDate}</Text>
                {item.externalTransactionId && (
                  <Text style={styles.txnText}>ID Transacción: {item.externalTransactionId}</Text>
                )}
              </View>
              <Text style={styles.amountText}>${item.amount.toFixed(2)}</Text>
            </View>

            <View style={styles.paymentFooter}>
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'PAID' ? styles.statusPaid : styles.statusPending,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.status === 'PAID' ? styles.statusPaidText : styles.statusPendingText,
                  ]}
                >
                  {item.status === 'PAID' ? '✓ PAGADO' : 'PENDIENTE'}
                </Text>
              </View>

              {item.status !== 'PAID' && (
                <TouchableOpacity style={styles.payBtn} onPress={() => handlePayNow(item)}>
                  <Text style={styles.payBtnText}>Pagar con Wompi 💳</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Wompi 3DS Payment Dialog Modal */}
      <Modal visible={!!selectedPayment} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Pago Seguro Wompi 3DS</Text>
              <Text style={styles.modalSub}>
                {selectedPayment?.concept} — <Text style={styles.modalAmount}>${selectedPayment?.amount.toFixed(2)}</Text>
              </Text>

              <View style={styles.wompiBadgeBox}>
                <Text style={styles.wompiBadgeText}>
                  🛡️ Transacción protegida con estándar 3D Secure Wompi El Salvador.
                </Text>
              </View>

              {/* Card Form Inputs */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre en la Tarjeta *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Juan Carlos"
                  value={cardHolderFirstName}
                  onChangeText={setCardHolderFirstName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Apellido *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Pérez Gómez"
                  value={cardHolderLastName}
                  onChangeText={setCardHolderLastName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Número de Tarjeta (Sin espacios) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="4000 1234 5678 9010"
                  keyboardType="numeric"
                  maxLength={19}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                />
              </View>

              <View style={styles.rowForm}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Mes (MM) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="08"
                    keyboardType="numeric"
                    maxLength={2}
                    value={expMonth}
                    onChangeText={setExpMonth}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Año (AA) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="28"
                    keyboardType="numeric"
                    maxLength={4}
                    value={expYear}
                    onChangeText={setExpYear}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>CVV *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={4}
                    value={cvv}
                    onChangeText={setCvv}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Correo Electrónico (Notificación)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="correo@ejemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Teléfono de Contacto</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 78901234"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedPayment(null)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, processing && { opacity: 0.7 }]}
                  onPress={handleProcessWompi3Ds}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveBtnText}>Pagar con 3DS 🔒</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#1E1240',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#6203FF',
    borderBottomWidth: 5,
    borderBottomColor: '#2A0A73',
  },
  balanceLabel: {
    color: '#FFCF36',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    marginVertical: 6,
  },
  balanceSubtext: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  paymentCard: {
    backgroundColor: '#141A2E',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'rgba(98, 3, 255, 0.3)',
    borderBottomWidth: 4,
    borderBottomColor: '#2A0A73',
  },
  paymentMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  conceptTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  dueDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '600',
  },
  txnText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 4,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFCF36',
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: 'rgba(255, 207, 54, 0.15)',
    borderWidth: 1,
    borderColor: '#FFCF36',
  },
  statusPendingText: {
    color: '#FFCF36',
  },
  statusPaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  statusPaidText: {
    color: '#10B981',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
  },
  payBtn: {
    backgroundColor: '#1877F2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderBottomWidth: 3,
    borderBottomColor: '#0B3C91',
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 31, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#141A2E',
    borderRadius: 28,
    padding: 24,
    borderWidth: 2,
    borderColor: '#6203FF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
  },
  modalAmount: {
    fontWeight: '900',
    color: '#FFCF36',
  },
  wompiBadgeBox: {
    backgroundColor: 'rgba(24, 119, 242, 0.15)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1877F2',
    marginBottom: 16,
  },
  wompiBadgeText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  rowForm: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#CBD5E1',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#0A0F1F',
    borderWidth: 1.5,
    borderColor: '#2A0A73',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontWeight: '800',
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#1877F2',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
    borderBottomWidth: 4,
    borderBottomColor: '#0B3C91',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
});

export default PaymentsScreen;
