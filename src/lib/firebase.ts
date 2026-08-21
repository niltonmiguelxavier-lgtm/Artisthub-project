import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * ==============================================================================
 * CONFIGURAÇÃO DO FIREBASE — ARTISTHUB
 * ==============================================================================
 * 
 * Projecto administrado pela conta: artisthubmz@gmail.com
 *
 * As credenciais são carregadas prioritariamente a partir das variáveis de
 * ambiente (.env, prefixadas com VITE_FIREBASE_).
 * 
 * NOTA SOBRE A PERSONALIZAÇÃO DO EMAIL DE VERIFICAÇÃO:
 * O template do email de verificação (Assunto, Nome do Remetente "ArtistHub",
 * corpo do email em português e link de ação) deve ser configurado manualmente
 * na Consola do Firebase:
 * 1. Acede a https://console.firebase.google.com/ com a conta artisthubmz@gmail.com
 * 2. Seleciona o projecto ArtistHub
 * 3. Vai a "Authentication" -> "Templates" -> "Email address verification"
 * 4. Personaliza o nome do remetente para "ArtistHub" e o texto em Português.
 * ==============================================================================
 */

import firebaseConfigData from '../../firebase-applet-config.json';

const fallbackConfig: Record<string, any> = firebaseConfigData || {};

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || fallbackConfig.apiKey || '',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || fallbackConfig.authDomain || '',
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || fallbackConfig.projectId || '',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || fallbackConfig.storageBucket || '',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || fallbackConfig.messagingSenderId || '',
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || fallbackConfig.appId || '',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Initialize Firestore with specific database ID if configured
const customDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || fallbackConfig.firestoreDatabaseId;
export const db = customDatabaseId ? getFirestore(app, customDatabaseId) : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  fbSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
};
export type { User };

