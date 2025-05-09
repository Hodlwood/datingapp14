"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
  getAuth,
  updateProfile,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/firebase';

// Test email configuration
const TEST_EMAIL = 'andrew.martin2215@gmail.com';
const TEST_PASSWORD = 'test123456';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  emailVerified: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setEmailVerified(user?.emailVerified || false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      console.log('Starting sign up process for email:', email);

      // Special handling for test email
      if (email === TEST_EMAIL) {
        try {
          // Try to create the test user
          const userCredential = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
          console.log('Test user created successfully:', userCredential.user.uid);
          return userCredential;
        } catch (error: any) {
          // If test user already exists, sign in instead
          if (error.code === 'auth/email-already-in-use') {
            console.log('Test user already exists, signing in...');
            const signInResult = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
            console.log('Test user signed in successfully:', signInResult.user.uid);
            return signInResult;
          }
          throw error;
        }
      }

      // Normal sign up flow for non-test emails
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created successfully:', userCredential.user.uid);

      // Send verification email
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
        console.log('Verification email sent successfully');
      }

      // Create user document in Firestore
      const userDoc = {
        email: email,
        emailVerified: false,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);
      console.log('User document created in Firestore');

      return userCredential;
    } catch (error) {
      console.error('Error in sign up process:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Starting sign in process for email:', email);

      // Special handling for test email
      if (email === TEST_EMAIL) {
        password = TEST_PASSWORD;
        try {
          // Try to sign in first
          const result = await signInWithEmailAndPassword(auth, email, password);
          console.log('Test user signed in successfully:', result.user.uid);
          return result;
        } catch (error: any) {
          // If login fails, try to create the user
          if (error.code === 'auth/invalid-login-credentials') {
            console.log('Test user does not exist, creating...');
            const createResult = await createUserWithEmailAndPassword(auth, email, password);
            console.log('Test user created successfully:', createResult.user.uid);
            return createResult;
          }
          throw error;
        }
      }

      // Normal sign in flow for non-test emails
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in successfully:', result.user.uid);
      return result;
    } catch (error) {
      console.error('Error in sign in process:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut: logout,
    emailVerified,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
