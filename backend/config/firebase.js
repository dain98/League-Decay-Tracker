import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
// You'll need to get your service account key from Firebase Console
// Go to Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

// Initialize the app if it hasn't been initialized already
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

export const auth = admin.auth();

// Connect to Firebase Auth emulator in development
// Only connect to emulator if explicitly enabled AND in development
if ((process.env.NODE_ENV === 'development' || process.env.USE_FIREBASE_EMULATOR === 'true') && 
    process.env.USE_FIREBASE_EMULATOR === 'true') {
  console.log('Connecting to Firebase Auth emulator...');
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
} else {
  console.log('Using production Firebase Auth');
}

export default admin; 
