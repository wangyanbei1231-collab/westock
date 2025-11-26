import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { setCloudUser } from '../services/storageService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: () => Promise<void>; // Google Login
  logout: () => Promise<void>;
  // New Email Auth Methods
  signupEmail: (email: string, pass: string) => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
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

  // Google Login (PC/Mobile Browser)
  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Google Login failed", error);
      // Don't alert here, let UI handle it or show specific message
      throw error; 
    }
  };

  // Email Signup (WeChat Compatible)
  const signupEmail = async (email: string, pass: string) => {
      await createUserWithEmailAndPassword(auth, email, pass);
  };

  // Email Login (WeChat Compatible)
  const loginEmail = async (email: string, pass: string) => {
      await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
  };

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