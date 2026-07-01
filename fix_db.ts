import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as path from "path";

// 1. Configurar Firebase Admin
// Asumimos que tienes un firebase-adminsdk.json o podemos usar las credenciales por defecto.
// Para este caso, vamos a tratar de leer firebase-adminsdk o simplemente usamos la base de datos pública si está abierta, pero al ser admin se necesitan credenciales.
// Como no tenemos el JSON de credenciales de admin, es mejor que usemos el Firebase SDK normal con web para no pedir el archivo serviceAccountKey.json.
