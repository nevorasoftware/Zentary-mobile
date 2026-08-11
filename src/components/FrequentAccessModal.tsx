import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Svg, Rect, Circle, Path } from 'react-native-svg';

interface FrequentAccessModalProps {
  visible: boolean;
  onClose: () => void;
  onDonotShowAgainChange?: (checked: boolean) => void;
}

export const FrequentAccessModal: React.FC<FrequentAccessModalProps> = ({
  visible,
  onClose,
  onDonotShowAgainChange,
}) => {
  const [isChecked, setIsChecked] = useState(false);

  const handleToggleCheck = () => {
    const nextVal = !isChecked;
    setIsChecked(nextVal);
    if (onDonotShowAgainChange) {
      onDonotShowAgainChange(nextVal);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Back button top left */}
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>

          {/* Astronaut Box Illustration */}
          <View style={styles.illustrationContainer}>
            <View style={styles.starsRow}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.star}>★</Text>
              <Text style={styles.star}>★</Text>
            </View>

            <View style={styles.astronautBox}>
              <Text style={styles.astronautEmoji}>👩‍🚀</Text>
              <View style={styles.boxTitleBanner}>
                <Text style={styles.boxTitle}>Acceso</Text>
                <Text style={styles.boxSubTitle}>Frecuente</Text>
              </View>
            </View>
          </View>

          {/* Benefits list */}
          <View style={styles.benefitsList}>
            {/* Benefit 1 */}
            <View style={styles.benefitRow}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconEmoji}>📱</Text>
              </View>
              <Text style={styles.benefitText}>
                Regístra a las personas que no necesitan de tu aprobación para ingresar.
              </Text>
            </View>

            {/* Benefit 2 */}
            <View style={styles.benefitRow}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconEmoji}>📅</Text>
              </View>
              <Text style={styles.benefitText}>
                Escoge los días y horarios de ingreso.
              </Text>
            </View>

            {/* Benefit 3 */}
            <View style={styles.benefitRow}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconEmoji}>🔔</Text>
              </View>
              <Text style={styles.benefitText}>
                Recibe notificación de ingreso al instante.
              </Text>
            </View>
          </View>

          {/* Entendido Button */}
          <TouchableOpacity style={styles.understoodButton} onPress={onClose}>
            <Text style={styles.understoodText}>Entendido</Text>
          </TouchableOpacity>

          {/* Checkbox option */}
          <TouchableOpacity style={styles.checkboxContainer} onPress={handleToggleCheck}>
            <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
              {isChecked && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              Dejar de mostrar beneficios de acceso frecuente
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#2B82FB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10,
    marginBottom: 10,
  },
  backArrow: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '300',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: -10,
  },
  star: {
    color: '#FACC15',
    fontSize: 20,
  },
  astronautBox: {
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 16,
    paddingHorizontal: 30,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  astronautEmoji: {
    fontSize: 48,
    marginBottom: 5,
  },
  boxTitleBanner: {
    alignItems: 'center',
  },
  boxTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  boxSubTitle: {
    color: '#93C5FD',
    fontSize: 16,
    fontWeight: '600',
  },
  benefitsList: {
    width: '100%',
    marginVertical: 20,
    gap: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 20,
  },
  benefitText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  understoodButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    width: '85%',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  understoodText: {
    color: '#2B82FB',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFFFFF',
  },
  checkmark: {
    color: '#2B82FB',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    flex: 1,
  },
});

export default FrequentAccessModal;
