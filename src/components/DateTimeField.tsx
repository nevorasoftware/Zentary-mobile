import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { localDateISO, localTimeHM, parseLocalDate, parseLocalDateTime, isValidDateISO, isValidTimeHM, formatDateLocal } from '../utils/dates';

interface DateTimeFieldProps {
  mode: 'date' | 'time';
  // YYYY-MM-DD para 'date' y HH:MM para 'time'
  value: string;
  onChange: (value: string) => void;
  accessibilityLabel: string;
  style?: any;
  textStyle?: any;
  // Solo para 'date': fecha mínima seleccionable (YYYY-MM-DD)
  minDate?: string;
  // Estilo del <input> en web (por defecto, tema oscuro)
  webStyle?: Record<string, any>;
}

// Selector nativo de fecha u hora. En web el datetimepicker no se renderiza, así que se usa <input type="date|time">.
export const DateTimeField: React.FC<DateTimeFieldProps> = ({ mode, value, onChange, accessibilityLabel, style, textStyle, minDate, webStyle }) => {
  const [show, setShow] = useState(false);

  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: mode,
      value,
      min: mode === 'date' ? minDate : undefined,
      'aria-label': accessibilityLabel,
      onChange: (e: any) => onChange(e.target.value),
      style: {
        backgroundColor: '#0A0F1F',
        color: '#FFFFFF',
        border: '1px solid #2A0A73',
        borderRadius: 12,
        padding: '10px 12px',
        fontSize: 13,
        fontWeight: 700,
        width: '100%',
        boxSizing: 'border-box',
        colorScheme: 'dark',
        ...webStyle,
      },
    });
  }

  const current =
    mode === 'date'
      ? (isValidDateISO(value) ? parseLocalDate(value) : new Date())
      : (isValidTimeHM(value) ? parseLocalDateTime(localDateISO(), value) : new Date());

  const handleChange = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (event?.type === 'dismissed' || !selected) return;
    onChange(mode === 'date' ? localDateISO(selected) : localTimeHM(selected));
  };

  return (
    <View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={style}
        onPress={() => setShow(!show)}
      >
        <Text style={textStyle}>{mode === 'date' ? formatDateLocal(value) : value}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={current}
          mode={mode}
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={mode === 'date' && minDate && isValidDateISO(minDate) ? parseLocalDate(minDate) : undefined}
          onChange={handleChange}
        />
      )}
    </View>
  );
};
