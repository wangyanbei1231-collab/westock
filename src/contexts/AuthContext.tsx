import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { setCloudUser } from '../services/storageService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  signupEmail: (e: string, p: string) => Promise<void>;
  loginEmail: (e: string, p: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async () => { try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error(e); throw e; } };
  const signupEmail = async (e: string, p: string) => { await createUserWithEmailAndPassword(auth, e, p); };
  const loginEmail = async (e: string, p: string) => { await signInWithEmailAndPassword(auth, e, p); };
  const logout = async () => { await signOut(auth); };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setCloudUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, signupEmail, loginEmail }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};