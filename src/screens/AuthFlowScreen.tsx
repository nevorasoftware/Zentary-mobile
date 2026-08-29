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
  Image,
} from 'react-native';
import { apiService, UserProfile } from '../services/api';
import { deviceService } from '../services/device';
import { Eye, EyeOff } from 'lucide-react-native';

interface AuthFlowScreenProps {
  onLoginSuccess: (user: UserProfile, mustChangePass?: boolean) => void;
}

export const AuthFlowScreen: React.FC<AuthFlowScreenProps> = ({ onLoginSuccess }) => {
  // Step 1: Welcome | Step 2: Email | Step 3: Password
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Disabled User Popup Modal State
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

      if (res.success) {
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

  // Render Step 1: Welcome Onboarding Screen
  if (step === 1) {
    return (
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeContent}>
          <Image source={require('../../assets/logo.png')} style={styles.logoImage} />
          <Text style={styles.logoTextMain}>ZENTARY</Text>
          <Text style={styles.sloganText}>Cada día más seguros y conectados</Text>

          <TouchableOpacity style={styles.empezarBtn} onPress={() => setStep(2)}>
            <Text style={styles.empezarBtnText}>Empezar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render Step 2 & 3: Email & Password Input Screens
  return (
    <KeyboardAvoidingView
      style={styles.authContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header with Back Button */}
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
        <Text style={styles.headerLogoWhite}>ZENTARY</Text>
      </View>

      {/* Main Dark Card Content */}
      <ScrollView contentContainerStyle={styles.cardScrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.darkCard}>
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
                  placeholderTextColor="#64748B"
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
                  key={showPassword ? 'pass-text-field' : 'pass-secure-field'}
                  style={styles.textInput}
                  placeholder="Contraseña"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    (EyeOff as any)({ size: 22, color: "#FFCF36" })
                  ) : (
                    (Eye as any)({ size: 22, color: "#94A3B8" })
                  )}
                </TouchableOpacity>
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

      {/* POPUP MODAL: Usuario deshabilitado */}
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
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#0A0F1F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  logoTextMain: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  sloganText: {
    fontSize: 15,
    color: '#FFCF36',
    marginTop: 8,
    marginBottom: 50,
    textAlign: 'center',
    fontWeight: '700',
  },
  empezarBtn: {
    width: 240,
    height: 54,
    backgroundColor: '#1877F2',
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#0B3C91',
  },
  empezarBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#0A0F1F',
  },
  topBlueHeader: {
    height: 80,
    backgroundColor: '#2A0A73',
    borderBottomWidth: 3,
    borderBottomColor: '#6203FF',
    paddingTop: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 15,
    padding: 8,
  },
  backArrowText: {
    color: '#FFCF36',
    fontSize: 34,
    fontWeight: '900',
  },
  headerLogoWhite: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardScrollView: {
    flexGrow: 1,
    backgroundColor: '#0A0F1F',
  },
  darkCard: {
    flex: 1,
    backgroundColor: '#141A2E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 48,
    alignItems: 'center',
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 54,
    borderWidth: 1.5,
    borderColor: '#2A0A73',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#0A0F1F',
    marginBottom: 32,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  eyeBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#1877F2',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#0B3C91',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  switchEmailBtn: {
    marginTop: 20,
    padding: 10,
  },
  switchEmailText: {
    color: '#FFCF36',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 31, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  disabledModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#141A2E',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6203FF',
  },
  disabledIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 207, 54, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledIconEmoji: {
    fontSize: 32,
  },
  disabledTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  disabledSubtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 24,
    textAlign: 'center',
  },
  disabledAceptarBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#1877F2',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#0B3C91',
  },
  disabledAceptarBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});

export default AuthFlowScreen;
