import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const firestore = getFirestore(app);

// Desactivar el escudo reCAPTCHA de Auth en modo local para poder probar los SMS falsos sin errores
if (import.meta.env.DEV) {
  auth.settings.appVerificationDisabledForTesting = true;
}

// Inicializar Firebase App Check (Capa 6: Escudo Anti-Bots)
if (typeof window !== "undefined") {
  // Reemplazar con clave real en producción
  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "tu-clave-de-recaptcha-enterprise";
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
      isTokenAutoRefreshEnabled: true
    });
    console.log("🛡️ Firebase App Check inicializado correctamente.");
  } catch (error) {
    console.error("Error al inicializar App Check:", error);
  }
}

// Verificar que la bd si este conectada correctamente 
if (typeof window !== "undefined") {
  console.log("⏳ Revisando configuración local de Firebase...");
  const llaves = Object.keys(firebaseConfig);
  const valoresVacios = llaves.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

  if (valoresVacios.length > 0) {
    console.error("ERROR: Tienes variables de entorno vacías:", valoresVacios);
  } else {
    console.log("¡PROYECTO INICIALIZADO LOCALMENTE CON ÉXITO!");
    console.log("Project ID conectado:", firebaseConfig.projectId);
  }
}