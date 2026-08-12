import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { apiService, UserProfile } from '../services/api';
import { deviceService } from '../services/device';

interface AuthFlowScreenProps {
  onLoginSuccess: (user: UserProfile, mustChangePass?: boolean) => void;
}

export const AuthFlowScreen: React.FC<AuthFlowScreenProps> = ({ onLoginSuccess }) => {
  // Step 1: Welcome | Step 2: Email | Step 3: Password
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Disabled User Popup Modal State (Image 3)
  const [showDisabledModal, setShowDisabledModal] = useState(false);

  // Email Validation Handler (Step 2 -> Step 3)
  const handleCheckEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu correo electrónico.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiService.checkEmail(email.trim());

      if (res.success && res.code === 'OK') {
        setStep(3); // Proceed to Password Screen
      }
    } catch (err: any) {
      if (err.message && err.message.includes('deshabilitado')) {
        setShowDisabledModal(true);
      } else {
        Alert.alert(
          'Correo no registrado',
          err.message || 'Este correo electrónico no está registrado en el sistema. Comunícate con la administración de tu residencial.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Login Handler (Step 3)
  const handleLogin = async () => {
    if (!password) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu contraseña.');
      return;
    }

    try {
      setLoading(true);
      const deviceId = await deviceService.getDeviceId();
      const res = await apiService.login(email.trim(), password, deviceId);

      if (res.success && res.user && res.token) {
        await deviceService.saveSession(res.token, res.user);
        onLoginSuccess(res.user, res.mustChangePassword);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('deshabilitado')) {
        setShowDisabledModal(true);
      } else {
        Alert.alert('Error de inicio de sesión', err.message || 'Contraseña incorrecta.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Render Step 1: Welcome Onboarding Screen (Image 1)
  if (step === 1) {
    return (
      <View style={styles.welcomeContainer}>
        {/* Top Logo & Slogan Area */}
        <View style={styles.welcomeContent}>
          <View style={styles.logoRow}>
            <Text style={styles.logoTextMain}>Zen</Text>
            <Text style={styles.logoTextAccent}>tary</Text>
          </View>
          <Text style={styles.sloganText}>Cada día más seguros y conectados</Text>

          <TouchableOpacity style={styles.empezarBtn} onPress={() => setStep(2)}>
            <Text style={styles.empezarBtnText}>Empezar</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Building Vector Graphic Silhouette (Image 1) */}
        <View style={styles.cityGraphicContainer}>
          <View style={styles.citySkyBg}>
            <Text style={styles.birdIcon1}>🕊️</Text>
            <Text style={styles.birdIcon2}>🕊️</Text>
          </View>
          <View style={styles.buildingRow}>
            <View style={styles.houseLeft}>
              <View style={styles.roofLeft} />
              <View style={styles.windowsRow}>
                <View style={styles.squareWindow} />
                <View style={styles.squareWindow} />
                <View style={styles.squareWindow} />
              </View>
            </View>
            <View style={styles.towerCenter}>
              <View style={styles.towerSpire} />
              <View style={styles.towerWindowGrid}>
                <View style={styles.rectWindow} />
                <View style={styles.rectWindow} />
                <View style={styles.rectWindow} />
                <View style={styles.rectWindow} />
                <View style={styles.rectWindow} />
                <View style={styles.rectWindow} />
              </View>
            </View>
            <View style={styles.buildingRight}>
              <View style={styles.towerWindowGrid}>
                <View style={styles.rectWindow} />
                <View style={styles.rectWindow} />
                <View style={styles.rectWindow} />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Render Step 2 & 3: Email & Password Input Screens (Image 2 & 3)
  return (
    <KeyboardAvoidingView
      style={styles.authContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Blue Bar Header with Back Button */}
      <View style={styles.topBlueHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (step === 3) setStep(2);
            else setStep(1);
          }}
        >
          <Text style={styles.backArrowText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.logoHeaderRow}>
          <Text style={styles.headerLogoWhite}>Zentary</Text>
        </View>
      </View>

      {/* Main White Card Content (Image 2) */}
      <ScrollView contentContainerStyle={styles.cardScrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.whiteCard}>
          {step === 2 ? (
            <>
              <Text style={styles.greetingTitle}>¡Hola vecino!</Text>
              <Text style={styles.greetingSubtitle}>
                Únete al mejor espacio para vivir en comunidad
              </Text>

              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Email"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleCheckEmail}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionBtnText}>Continuar</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.greetingTitle}>Ingresa tu contraseña</Text>
              <Text style={styles.greetingSubtitle}>
                Introduce la contraseña de tu cuenta ({email})
              </Text>

              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contraseña"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionBtnText}>Iniciar Sesión</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchEmailBtn}
                onPress={() => setStep(2)}
              >
                <Text style={styles.switchEmailText}>Cambiar correo electrónico</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* POPUP MODAL: Usuario deshabilitado (Image 3) */}
      <Modal visible={showDisabledModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.disabledModalCard}>
            <View style={styles.disabledIconContainer}>
              <Text style={styles.disabledIconEmoji}>⚡</Text>
            </View>

            <Text style={styles.disabledTitle}>Usuario deshabilitado</Text>
            <Text style={styles.disabledSubtitle}>Comunícate con la administración</Text>

            <TouchableOpacity
              style={styles.disabledAceptarBtn}
              onPress={() => setShowDisabledModal(false)}
            >
              <Text style={styles.disabledAceptarBtnText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  // Step 1: Onboarding Styles (Image 1)
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  welcomeContent: {
    paddingTop: 120,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoTextMain: {
    fontSize: 48,
    fontWeight: '800',
    color: '#2B82FB',
  },
  logoTextAccent: {
    fontSize: 48,
    fontWeight: '800',
    color: '#38BDF8',
  },
  sloganText: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 50,
    textAlign: 'center',
  },
  empezarBtn: {
    width: '85%',
    height: 52,
    backgroundColor: '#4AA0F6',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#2B82FB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  empezarBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cityGraphicContainer: {
    height: 280,
    backgroundColor: '#E0F2FE',
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  citySkyBg: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  birdIcon1: { fontSize: 16, opacity: 0.6 },
  birdIcon2: { fontSize: 14, opacity: 0.4 },
  buildingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  houseLeft: {
    width: 110,
    height: 140,
    backgroundColor: '#3B82F6',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    padding: 10,
  },
  roofLeft: {
    position: 'absolute',
    top: -20,
    left: 0,
    width: 30,
    height: 20,
    backgroundColor: '#1E293B',
  },
  windowsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 80,
  },
  squareWindow: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  towerCenter: {
    width: 100,
    height: 220,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  towerSpire: {
    width: 12,
    height: 24,
    backgroundColor: '#1D4ED8',
    marginTop: -24,
  },
  towerWindowGrid: {
    paddingTop: 16,
    gap: 10,
    alignItems: 'center',
  },
  rectWindow: {
    width: 60,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  buildingRight: {
    width: 90,
    height: 160,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
  },

  // Step 2 & 3: Email & Password Input Styles (Image 2)
  authContainer: {
    flex: 1,
    backgroundColor: '#3B82F6',
  },
  topBlueHeader: {
    height: 100,
    paddingTop: 40,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 45,
    padding: 8,
  },
  backArrowText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '300',
  },
  logoHeaderRow: {
    alignItems: 'center',
  },
  headerLogoWhite: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  cardScrollView: {
    flexGrow: 1,
    backgroundColor: '#3B82F6',
  },
  whiteCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 80,
    alignItems: 'center',
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 40,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
    color: '#94A3B8',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  actionBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#4AA0F6',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchEmailBtn: {
    marginTop: 20,
    padding: 10,
  },
  switchEmailText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal Popup: Usuario deshabilitado (Image 3)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  disabledModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
  },
  disabledIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledIconEmoji: {
    fontSize: 32,
  },
  disabledTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  disabledSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
    textAlign: 'center',
  },
  disabledAceptarBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#3B82F6',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledAceptarBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AuthFlowScreen;
