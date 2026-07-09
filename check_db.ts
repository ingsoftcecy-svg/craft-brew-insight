import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import * as dotenv from "dotenv";
dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

async function checkDB() {
  await signInWithEmailAndPassword(auth, process.env.VITE_API_FIREBASE_EMAIL!, process.env.VITE_API_FIREBASE_PASSWORD!);
  const registrosRef = collection(firestore, "purgas_historico", "2026-07", "registros");
  const snapshot = await getDocs(registrosRef);

  console.log(`Total records in 2026-07: ${snapshot.docs.length}`);
  for (const d of snapshot.docs) {
    const data = d.data();
    if (d.id.includes("105")) {
      console.log(`Tank 105 data:`);
      console.log(`h24: '${data.h24}', type: ${typeof data.h24}`);
      console.log(`estado24h: '${data.estado24h}'`);
    }
  }
  process.exit(0);
}

checkDB().catch(console.error);
