import { requireNativeModule } from 'expo-modules-core';

export interface PickedContact {
  name: string;
  phone: string;
}

// Abre el selector de contactos del sistema (solo Android, no requiere READ_CONTACTS).
// La app recibe únicamente el contacto elegido; devuelve null si el usuario cancela.
export const pickPhoneContact = (): Promise<PickedContact | null> =>
  requireNativeModule('ContactPicker').pickPhoneContactAsync();
