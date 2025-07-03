import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../config/firebase';

const FirebaseAuthContext = createContext();

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
};

export const FirebaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sign up with email and password
  const signUp = async (email, password, displayName = null) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name if provided
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      
      return userCredential.user;
    } catch (error) {
      let errorMessage = 'An error occurred during sign up';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists. Please sign in instead.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters long.';
          break;
        default:
          errorMessage = error.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      let errorMessage = 'An error occurred during sign in';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        default:
          errorMessage = error.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      return userCredential.user;
    } catch (error) {
      let errorMessage = 'An error occurred during Google sign in';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign in was cancelled.';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Sign in popup was blocked. Please allow popups for this site.';
          break;
        default:
          errorMessage = error.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      setError('An error occurred during sign out');
    }
  };

  // Get current user's ID token
  const getIdToken = async () => {
    if (!user) {
      throw new Error('No user is signed in');
    }
    return await user.getIdToken();
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      setError(null);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    getIdToken,
    isAuthenticated: !!user
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}; 
