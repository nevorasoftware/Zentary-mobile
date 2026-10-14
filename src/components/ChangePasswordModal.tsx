import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

interface ChangePasswordModalProps {
  visible: boolean;
  onPasswordChanged: (newPass: string) => Promise<void>;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onPasswordChanged,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const confirmInputRef = useRef<{ focus: () => void }>(null);

  const handleSubmit = async () => {
    if (isSaving) return;
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    setIsSaving(true);
    try {
      await onPasswordChanged(newPassword);
      Alert.alert('¡Éxito!', 'Tu contraseña ha sido actualizada correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo actualizar la contraseña. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={styles.modalCard}>
          <Text style={styles.badge}>🔐 PRIMER INICIO DE SESIÓN</Text>
          <Text style={styles.title}>Actualiza tu Contraseña</Text>
          <Text style={styles.subtitle}>
            Por motivos de seguridad, debes cambiar la contraseña genérica asignada por la administración por una clave personal.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>NUEVA CONTRASEÑA</Text>
            <View style={styles.inputWrap}>
              <TextInput
                accessibilityLabel="Nueva contraseña"
                key={showPassword ? 'new-text-field' : 'new-secure-field'}
                style={styles.input}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Ingresa tu nueva clave"
                placeholderTextColor="#64748B"
                value={newPassword}
                onChangeText={setNewPassword}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                onSubmitEditing={() => confirmInputRef.current?.focus()}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                accessibilityRole="button" accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => setShowPassword(!showPassword)}
              >
                {/* @ts-ignore */}
                {showPassword ? <EyeOff size={20} color="#64748B" /> : <Eye size={20} color="#64748B" />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>CONFIRMAR CONTRASEÑA</Text>
            <View style={styles.inputWrap}>
              <TextInput
                accessibilityLabel="Confirmar contraseña"
                key={showPassword ? 'conf-text-field' : 'conf-secure-field'}
                style={styles.input}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Repite tu nueva clave"
                placeholderTextColor="#64748B"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                ref={confirmInputRef}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                accessibilityRole="button" accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => setShowPassword(!showPassword)}
              >
                {/* @ts-ignore */}
                {showPassword ? <EyeOff size={20} color="#64748B" /> : <Eye size={20} color="#64748B" />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity accessibilityRole="button" style={styles.saveBtn} onPress={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Guardar y Continuar a Zentary</Text>
            )}
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingRight: 10,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  eyeBtn: {
    padding: 6,
  },
  saveBtn: {
    backgroundColor: '#1D6BE0',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ChangePasswordModal;
