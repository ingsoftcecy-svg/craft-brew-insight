import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch } from "firebase/firestore";
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

async function fixDB() {
  await signInWithEmailAndPassword(auth, process.env.VITE_API_FIREBASE_EMAIL!, process.env.VITE_API_FIREBASE_PASSWORD!);
  
  const periodos = ["2026-07"]; 
  const batch = writeBatch(firestore);
  let updates = 0;

  for (const periodo of periodos) {
    const registrosRef = collection(firestore, "purgas_historico", periodo, "registros");
    const snapshot = await getDocs(registrosRef);

    for (const d of snapshot.docs) {
      const data = d.data();
      
      // If it has fechaLlenado and is missing h24
      if (data.fechaLlenado && !data.h24) {
        const dDate = new Date(data.fechaLlenado);
        if (!isNaN(dDate.getTime())) {
          const docRef = doc(firestore, "purgas_historico", periodo, "registros", d.id);
          const updateData: any = {};
          const horasBase = [24, 48, 72, 96, 120, 128, 136, 144];
          
          horasBase.forEach((h) => {
             updateData[`h${h}`] = new Date(dDate.getTime() + h * 60 * 60 * 1000).toISOString();
             updateData[`estado${h}h`] = "Pendiente";
          });
          
          batch.set(docRef, updateData, { merge: true });
          updates++;
        }
      }
    }
  }

  if (updates > 0) {
    await batch.commit();
    console.log(`Fixed ${updates} documents in Firestore!`);
  } else {
    console.log("No documents needed fixing.");
  }
  process.exit(0);
}

fixDB().catch(console.error);
