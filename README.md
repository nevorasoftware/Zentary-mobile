# Zentary Mobile App (React Native + Expo + TypeScript)

Cross-platform mobile application for iOS and Android.

## 📱 Features & Replicated Screens
- **Visitas (Visits)**: EN CURSO, HISTORIAL, FRECUENTES, QR Pass generation modal.
- **PQRS & Comunicaciones**: Solicitud management, chat segment, search bar, creation modal.
- **Paquetes (Parcel Tracking)**: Carrier selection grid (Cargo Express, DHL, FedEx, Trans Express, UPS, Otro).
- **Profile Overlay**: Avatar popup bottom sheet, settings, support, logout, version `V 2.49.15`.
- **Frequent Access Onboarding**: Astronaut benefit card banner dialog.
- **Pagos (Payments)**: Maintenance balance tracker and payment gateway integration modal.

---

## 🚀 Quick Start

```bash
# 1. Navigate to frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Start Expo development server
npm start
```

### URL de la API

Por defecto la app usa la API de producción. Para apuntar a otro backend, define `EXPO_PUBLIC_API_URL` (con el sufijo `/api`) al iniciar o compilar; Expo la incluye en el bundle en tiempo de build:

```bash
EXPO_PUBLIC_API_URL=https://mi-backend.example.com/api npm start
```
"# Zentary-mobile" 
