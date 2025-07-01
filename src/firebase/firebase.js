import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD4bn2TqoECdCGpWyvw7T4dGJLnxIpH6cc",
  authDomain: "financas-dc789.firebaseapp.com",
  projectId: "financas-dc789",
  storageBucket: "financas-dc789.firebasestorage.app",
  messagingSenderId: "524460577144",
  appId: "1:524460577144:web:084786969dcc0a41a4388d",
  measurementId: "G-KNDPMMRMWC"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
