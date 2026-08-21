import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  fbSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  type User,
} from '../lib/firebase';
import type { Artist, UserProfile, UserRole } from '../types';
import { currentArtist as defaultArtist } from '../data/artists';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  artistProfile: Artist | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, stageName: string, role?: UserRole) => Promise<void>;
  loginWithGoogle: (role?: UserRole) => Promise<void>;
  loginDemoUser: (role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerification: () => Promise<void>;
  reloadUser: () => Promise<boolean>;
  updateArtistProfile: (data: Partial<Artist>) => Promise<void>;
  refreshArtistProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [artistProfile, setArtistProfile] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to load artist document from firestore or local cache
  const loadArtistData = async (uid: string, email: string, displayName?: string, chosenRole: UserRole = 'artist') => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      let role: UserRole = chosenRole;
      if (userSnap.exists()) {
        const uData = userSnap.data() as UserProfile;
        setUserProfile(uData);
        role = uData.role || 'artist';
      } else {
        const newProfile: UserProfile = {
          uid,
          email,
          displayName: displayName || email.split('@')[0] || 'Artista',
          role: chosenRole,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      }

      if (role === 'artist') {
        const artistRef = doc(db, 'artists', uid);
        const artistSnap = await getDoc(artistRef);

        if (artistSnap.exists()) {
          setArtistProfile(artistSnap.data() as Artist);
        } else {
          const rawName = displayName || email.split('@')[0] || 'Artista';
          const cleanHandle = (rawName).toLowerCase().replace(/[^a-z0-9]/g, '-') || 'artista-' + uid.slice(0, 5);
          const newArtist: Artist = {
            id: uid,
            userId: uid,
            stageName: rawName,
            fullName: rawName,
            handle: cleanHandle,
            bio: 'Vocalista e compositor no ArtistHub.',
            location: 'Maputo, Moçambique',
            genres: ['Afrobeat', 'Marrabenta'],
            followers: 1240,
            verified: false,
            subscriptionTier: 'free',
            subscriptionStatus: 'active',
            socials: {
              instagram: '',
              youtube: '',
              tiktok: '',
              spotify: '',
            },
          };
          await setDoc(artistRef, newArtist);
          setArtistProfile(newArtist);
        }
      }
    } catch (err) {
      console.warn('Firestore load fallback:', err);
      if (!artistProfile) {
        setArtistProfile({
          ...defaultArtist,
          id: uid,
          userId: uid,
        });
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        await loadArtistData(fbUser.uid, fbUser.email || '', fbUser.displayName || undefined);
      } else {
        setUserProfile(null);
        setArtistProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    await loadArtistData(cred.user.uid, cred.user.email || '');
  };

  const register = async (email: string, pass: string, stageName: string, role: UserRole = 'artist') => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = cred.user.uid;

    // Enviar email de verificação automaticamente após registo
    try {
      await sendEmailVerification(cred.user);
    } catch (verifErr) {
      console.warn('Falha no envio automático do email de verificação:', verifErr);
    }

    const newProfile: UserProfile = {
      uid,
      email,
      role,
      displayName: stageName,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', uid), newProfile);
    setUserProfile(newProfile);

    if (role === 'artist') {
      const cleanHandle = stageName.toLowerCase().trim().replace(/[^a-z0-9]/g, '-') || 'artista-' + uid.slice(0, 5);
      const newArtist: Artist = {
        id: uid,
        userId: uid,
        stageName: stageName || 'Artista',
        fullName: stageName || 'Artista',
        handle: cleanHandle,
        bio: 'Vocalista e compositor no ArtistHub.',
        location: 'Maputo, Moçambique',
        genres: ['Afrobeat'],
        followers: 120,
        verified: false,
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        socials: {},
      };
      await setDoc(doc(db, 'artists', uid), newArtist);
      setArtistProfile(newArtist);
    }
  };

  const loginWithGoogle = async (role: UserRole = 'artist') => {
    const cred = await signInWithPopup(auth, googleProvider);
    await loadArtistData(
      cred.user.uid,
      cred.user.email || '',
      cred.user.displayName || undefined,
      role
    );
  };

  const loginDemoUser = async (role: UserRole = 'artist') => {
    // Simulated demo session for testing without network/auth barriers
    const demoUid = 'demo-artist-' + (role === 'organizer' ? 'org' : '001');
    const demoEmail = role === 'organizer' ? 'organizador.demo@artisthub.mz' : 'nelio.kaya@artisthub.mz';
    const demoName = role === 'organizer' ? 'Festival Sol & Som Produtora' : 'Nélio Kaya';
    const demoHandle = role === 'organizer' ? 'festival-sol-som' : 'nelio-kaya';

    const simulatedUser = {
      uid: demoUid,
      email: demoEmail,
      displayName: demoName,
      emailVerified: true,
      isAnonymous: false,
    } as unknown as User;

    setUser(simulatedUser);

    const prof: UserProfile = {
      uid: demoUid,
      email: demoEmail,
      role,
      displayName: demoName,
      createdAt: new Date().toISOString(),
    };
    setUserProfile(prof);

    if (role === 'artist') {
      const art: Artist = {
        ...defaultArtist,
        id: demoUid,
        userId: demoUid,
        stageName: demoName,
        handle: demoHandle,
        subscriptionTier: 'pro',
        verified: true,
      };
      setArtistProfile(art);
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
    setUser(null);
    setUserProfile(null);
    setArtistProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const sendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const reloadUser = async (): Promise<boolean> => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
      return auth.currentUser.emailVerified;
    }
    return false;
  };

  const updateArtistProfile = async (data: Partial<Artist>) => {
    if (!user) throw new Error('Utilizador não autenticado');
    try {
      const artistRef = doc(db, 'artists', user.uid);
      await updateDoc(artistRef, data);
    } catch (e) {
      console.warn('Local update fallback:', e);
    }
    setArtistProfile((prev) => (prev ? { ...prev, ...data } : null));
  };

  const refreshArtistProfile = async () => {
    if (user) {
      await loadArtistData(user.uid, user.email || '');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        artistProfile,
        loading,
        login,
        register,
        loginWithGoogle,
        loginDemoUser,
        logout,
        resetPassword,
        sendVerification,
        reloadUser,
        updateArtistProfile,
        refreshArtistProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
