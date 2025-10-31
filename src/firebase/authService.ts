import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from './config';
import { User, CreateUserData } from '../types';
import { userService } from './userService';

// Convert Firebase user to our User type
const convertFirebaseUser = (firebaseUser: FirebaseUser, role: 'admin' | 'member' = 'member'): User => {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    role: role,
    createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
    lastLogin: firebaseUser.metadata.lastSignInTime || new Date().toISOString(),
  };
};

// Authentication service
export const authService = {
  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Validate inputs first
      if (!email || !email.trim()) {
        return { success: false, error: 'Please enter your email address' };
      }
      
      if (!password || !password.trim()) {
        return { success: false, error: 'Please enter your password' };
      }
      
      if (!/\S+@\S+\.\S+/.test(email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      // Try to sign in with existing credentials
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Fetch user role from Firestore
      let role: 'admin' | 'member' = 'member';
      try {
        const firestoreUser = await userService.getUserByEmail(email);
        if (firestoreUser) {
          role = firestoreUser.role;
        }
      } catch (error) {
        console.warn('Could not fetch user role from Firestore, using default role:', error);
        // Fallback to email-based role determination for backward compatibility
        role = email.includes('admin') ? 'admin' : 'member';
      }
      
      return { 
        success: true, 
        user: convertFirebaseUser(user, role) 
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Provide specific error messages based on Firebase error codes
      let errorMessage = 'Login failed. Please try again.';
      
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password. Please check your credentials.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
        case 'auth/invalid-verification-code':
          errorMessage = 'Invalid verification code.';
          break;
        case 'auth/invalid-verification-id':
          errorMessage = 'Invalid verification ID.';
          break;
        default:
          // For any other errors, provide a generic message
          errorMessage = error.message || 'Login failed. Please try again.';
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  // Create new user (without signing in as that user)
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Store current user info before creating new user
      const currentUser = auth.currentUser;
      const currentUserEmail = currentUser?.email;
      const currentUserPassword = null; // We can't get the password, so we'll handle this differently
      
      // Create the new user (this will automatically sign them in)
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      const newUser = userCredential.user;
      
      // If we had a current user, we need to sign them back in
      // Since we can't get the password, we'll just return the new user info
      // The admin will need to sign out and sign back in manually
      
      return convertFirebaseUser(newUser, userData.role);
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  },

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user role from Firestore
        let role: 'admin' | 'member' = 'member';
        try {
          const firestoreUser = await userService.getUserByEmail(firebaseUser.email || '');
          if (firestoreUser) {
            role = firestoreUser.role;
          }
        } catch (error) {
          console.warn('Could not fetch user role from Firestore, using default role:', error);
          // Fallback to email-based role determination for backward compatibility
          role = firebaseUser.email?.includes('admin') ? 'admin' : 'member';
        }
        callback(convertFirebaseUser(firebaseUser, role));
      } else {
        callback(null);
      }
    });
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      // Fetch user role from Firestore
      let role: 'admin' | 'member' = 'member';
      try {
        const firestoreUser = await userService.getUserByEmail(firebaseUser.email || '');
        if (firestoreUser) {
          role = firestoreUser.role;
        }
      } catch (error) {
        console.warn('Could not fetch user role from Firestore, using default role:', error);
        // Fallback to email-based role determination for backward compatibility
        role = firebaseUser.email?.includes('admin') ? 'admin' : 'member';
      }
      return convertFirebaseUser(firebaseUser, role);
    }
    return null;
  }
};
