import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';

interface PaymentItem {
  id: string;
  concept: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
}

const INITIAL_PAYMENTS: PaymentItem[] = [
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
  },
];

export const PaymentsScreen: React.FC = () => {
  const [payments, setPayments] = useState<PaymentItem[]>(INITIAL_PAYMENTS);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [processing, setProcessing] = useState(false);

  const handlePayNow = (item: PaymentItem) => {
    setSelectedPayment(item);
  };

  const handleConfirmPayment = () => {
    if (!selectedPayment) return;
    setProcessing(true);

    setTimeout(() => {
      setPayments((prev) =>
        prev.map((p) => (p.id === selectedPayment.id ? { ...p, status: 'PAID' as const } : p))
      );
      setProcessing(false);
      alert(`¡Pago de $${selectedPayment.amount.toFixed(2)} procesado con éxito!`);
      setSelectedPayment(null);
    }, 1200);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagos y Cuotas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo Pendiente Total</Text>
          <Text style={styles.balanceAmount}>$85.00</Text>
          <Text style={styles.balanceSubtext}>Próximo vencimiento: 30 Ago 2026</Text>
        </View>

        <Text style={styles.sectionTitle}>Historial de Cobros</Text>

        {payments.map((item) => (
          <View key={item.id} style={styles.paymentCard}>
            <View style={styles.paymentMain}>
              <View>
                <Text style={styles.conceptTitle}>{item.concept}</Text>
                <Text style={styles.dueDate}>Vence: {item.dueDate}</Text>
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
                  {item.status === 'PAID' ? 'PAGADO' : 'PENDIENTE'}
                </Text>
              </View>

              {item.status === 'PENDING' && (
                <TouchableOpacity style={styles.payBtn} onPress={() => handlePayNow(item)}>
                  <Text style={styles.payBtnText}>Pagar Ahora</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Payment Gateway Dialog Modal */}
      <Modal visible={!!selectedPayment} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pasarela de Pago Zentary</Text>
            <Text style={styles.modalSub}>
              {selectedPayment?.concept} — ${selectedPayment?.amount.toFixed(2)}
            </Text>

            <View style={styles.gatewayNoticeBox}>
              <Text style={styles.gatewayNoticeText}>
                💳 Módulo de Pagos configurado para integración con API externa (Stripe / Wompi / Paypal).
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedPayment(null)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleConfirmPayment}>
                <Text style={styles.saveBtnText}>
                  {processing ? 'Procesando...' : 'Confirmar Pago'}
                </Text>
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
    backgroundColor: '#F9FAFB',
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
  content: {
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#2B82FB',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    color: '#DBEAFE',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 6,
  },
  balanceSubtext: {
    color: '#93C5FD',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 14,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  paymentMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  conceptTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  dueDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B82FB',
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPendingText: {
    color: '#D97706',
  },
  statusPaid: {
    backgroundColor: '#D1FAE5',
  },
  statusPaidText: {
    color: '#059669',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  payBtn: {
    backgroundColor: '#2B82FB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
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
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 16,
  },
  gatewayNoticeBox: {
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 20,
  },
  gatewayNoticeText: {
    color: '#1E40AF',
    fontSize: 13,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
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

export default PaymentsScreen;
