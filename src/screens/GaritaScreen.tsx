import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera/next';
import { apiService } from '../services/api';

interface GaritaScreenProps {
  onOpenMenu: () => void;
}

type ActiveVisit = Awaited<ReturnType<typeof apiService.getActiveInside>>['activeVisits'][number];

export const GaritaScreen: React.FC<GaritaScreenProps> = ({ onOpenMenu }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [qrInputToken, setQrInputToken] = useState('');
  const [validatingQr, setValidatingQr] = useState(false);
  const [confirmingEntry, setConfirmingEntry] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [inside, setInside] = useState<ActiveVisit[]>([]);
  const [loadingInside, setLoadingInside] = useState(true);
  const [exitingId, setExitingId] = useState<string | null>(null);

  const cameraAvailable = Platform.OS !== 'web' && !!permission?.granted;

  const fetchInside = useCallback(async () => {
    try {
      const res = await apiService.getActiveInside();
      if (res.success) setInside(res.activeVisits);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo cargar quién está adentro.');
    } finally {
      setLoadingInside(false);
    }
  }, []);

  useEffect(() => {
    fetchInside();
  }, [fetchInside]);

  const validateToken = async (token: string) => {
    if (validatingQr) return;
    if (!token.trim()) {
      Alert.alert('Requerido', 'Ingresa o escanea un código QR dinámico.');
      return;
    }

    try {
      setValidatingQr(true);
      setScanResult(null);
      const res = await apiService.scanQRToken(token.trim());
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

  const onScan = ({ data }: { data: string }) => {
    setScanned(true);
    validateToken(data);
  };

  const resetScan = () => {
    setScanned(false);
    setScanResult(null);
    setQrInputToken('');
  };

  const handleConfirmEntry = async (visitId: string) => {
    try {
      setConfirmingEntry(true);
      const res = await apiService.confirmEntry(visitId, 'Puerta Principal');
      if (res.success) {
        Alert.alert(
          '✅ INGRESO CONFIRMADO',
          `El ingreso de ${res.visit.visitorName} ha sido procesado. Se han invalidado todos los tokens de acceso y notificado al residente.`
        );
        resetScan();
        fetchInside();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo confirmar el ingreso.');
    } finally {
      setConfirmingEntry(false);
    }
  };

  const handleExit = (v: ActiveVisit) => {
    Alert.alert('Marcar salida', `¿Registrar la salida de ${v.visitorName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Marcar salida',
        onPress: async () => {
          try {
            setExitingId(v.id);
            const res = await apiService.registerExit(v.id);
            if (res.success) fetchInside();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'No se pudo registrar la salida.');
          } finally {
            setExitingId(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Garita</Text>
        <TouchableOpacity accessibilityRole="button" style={styles.menuBtn} onPress={onOpenMenu} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text accessibilityLabel="Abrir menú" style={styles.menuBtnText}>Menú</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={false} onRefresh={fetchInside} tintColor="#FFCF36" />}
      >
        <Text style={styles.sectionTitle}>Validar visitante</Text>

        {Platform.OS !== 'web' && permission && !permission.granted && (
          <TouchableOpacity accessibilityRole="button" style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Permitir uso de la cámara</Text>
          </TouchableOpacity>
        )}

        {cameraAvailable && (
          <View style={styles.cameraBox}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanned ? undefined : onScan}
            />
          </View>
        )}

        {scanned && (
          <TouchableOpacity accessibilityRole="button" style={styles.secondaryBtn} onPress={resetScan}>
            <Text style={styles.secondaryBtnText}>Escanear otro</Text>
          </TouchableOpacity>
        )}

        {!cameraAvailable && (
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.cardDesc}>Ingresa el código de token dinámico del visitante.</Text>
            <TextInput
              accessibilityLabel="Código de acceso del visitante"
              style={[styles.input, { fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' }]}
              placeholder="Ej. ACCESS-8F92A7C1"
              returnKeyType="done"
              onSubmitEditing={() => validateToken(qrInputToken)}
              value={qrInputToken}
              onChangeText={setQrInputToken}
            />
            <TouchableOpacity accessibilityRole="button" style={styles.primaryBtn} onPress={() => validateToken(qrInputToken)} disabled={validatingQr}>
              <Text accessibilityLabel="Validar Código QR" style={styles.primaryBtnText}>🔍 Validar Código QR</Text>
            </TouchableOpacity>
          </View>
        )}

        {validatingQr && <ActivityIndicator style={{ marginTop: 12 }} color="#FFCF36" />}

        {scanResult && (
          <View style={{ marginTop: 12 }}>
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

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Adentro ahora ({inside.length})</Text>
        {loadingInside ? (
          <ActivityIndicator color="#FFCF36" />
        ) : inside.length === 0 ? (
          <Text style={styles.emptyText}>No hay visitantes adentro.</Text>
        ) : (
          inside.map((v) => (
            <View key={v.id} style={styles.visitCard}>
              <Text style={styles.visitorNameText}>{v.visitorName}</Text>
              <Text style={styles.infoLineText}>
                {v.houseUnit}
                {v.residentName ? ` · ${v.residentName}` : ''}
                {v.vehiclePlate ? ` · ${v.vehiclePlate}` : ''}
              </Text>
              <Text style={[styles.entryTimeText, v.isExceeded && { color: '#F87171' }]}>
                Ingresó: {new Date(v.entryDate).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                {v.isExceeded ? ' · Tiempo excedido' : ''}
              </Text>
              <TouchableOpacity accessibilityRole="button" style={styles.exitBtn} onPress={() => handleExit(v)} disabled={exitingId === v.id}>
                {exitingId === v.id ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Marcar salida</Text>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
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
  menuBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  menuBtnText: { color: '#FFCF36', fontWeight: '900', fontSize: 14 },
  content: { padding: 16, paddingBottom: 100 },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginBottom: 12 },
  cameraBox: { height: 280, borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: '#6203FF', backgroundColor: '#000000' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16 },
  cardDesc: { fontSize: 12, color: '#64748B', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#0F172A' },
  primaryBtn: { minHeight: 44, justifyContent: 'center', backgroundColor: '#1D6BE0', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: 'bold' },
  secondaryBtn: { minHeight: 44, justifyContent: 'center', alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#FFCF36', borderRadius: 12 },
  secondaryBtnText: { color: '#FFCF36', fontWeight: 'bold' },
  errorBanner: { backgroundColor: '#FEE2E2', padding: 14, borderRadius: 12 },
  errorBannerTitle: { color: '#DC2626', fontWeight: 'bold', fontSize: 14 },
  errorBannerDesc: { color: '#991B1B', fontSize: 12, marginTop: 2 },
  successBanner: { backgroundColor: '#DCFCE7', padding: 14, borderRadius: 12 },
  successBannerTitle: { color: '#16A34A', fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  detailsBox: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 10, gap: 4, marginBottom: 10 },
  detailRow: { fontSize: 13, color: '#334155' },
  confirmEntryBtn: { minHeight: 44, justifyContent: 'center', backgroundColor: '#16A34A', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  confirmEntryBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  emptyText: { fontSize: 13, color: '#94A3B8' },
  visitCard: { backgroundColor: '#141A2E', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'rgba(98, 3, 255, 0.3)', borderBottomWidth: 4, borderBottomColor: '#2A0A73' },
  visitorNameText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  infoLineText: { fontSize: 13, color: '#CBD5E1', marginTop: 4 },
  entryTimeText: { fontSize: 12, color: '#10B981', fontWeight: '900', marginTop: 4 },
  exitBtn: { minHeight: 44, justifyContent: 'center', backgroundColor: '#DC2626', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 10 },
});

export default GaritaScreen;
