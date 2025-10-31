import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { User, CreateUserData } from '../types';
import { qrCodeService } from '../services/qrCodeService';

// Database service for user management
export const userService = {
  // Get all users
  async getUsers(): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastLogin: doc.data().lastLogin?.toDate?.()?.toISOString(),
      })) as User[];
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          id: userSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          lastLogin: data.lastLogin?.toDate?.()?.toISOString(),
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          lastLogin: data.lastLogin?.toDate?.()?.toISOString(),
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  },

  // Create new user
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Generate unique ID
      const uniqueId = qrCodeService.generateUniqueId();
      
      // Prepare user data with unique ID
      const userWithId = {
        ...userData,
        uniqueId,
        createdAt: serverTimestamp(),
        lastLogin: null,
      };

      const usersRef = collection(db, 'users');
      const docRef = await addDoc(usersRef, userWithId);

      // Generate QR code
      const qrCode = await qrCodeService.generateUserQRCode({
        uniqueId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        createdAt: new Date().toISOString(),
      });

      // Update user with QR code
      await updateDoc(docRef, { qrCode });

      return {
        id: docRef.id,
        ...userData,
        uniqueId,
        qrCode,
        createdAt: new Date().toISOString(),
        lastLogin: undefined,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user
  async updateUser(userId: string, userData: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Search users
  async searchUsers(searchTerm: string): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastLogin: doc.data().lastLogin?.toDate?.()?.toISOString(),
      })) as User[];
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },

  // Generate QR codes for users that don't have them
  async generateMissingQRCodes(): Promise<{ success: number; failed: number; errors: string[] }> {
    const result = { success: 0, failed: 0, errors: [] };
    
    try {
      const users = await this.getUsers();
      
      for (const user of users) {
        // Skip if user already has a QR code
        if (user.qrCode) {
          continue;
        }
        
        // Ensure user has uniqueId, if not generate one
        let uniqueId = user.uniqueId;
        if (!uniqueId) {
          uniqueId = qrCodeService.generateUniqueId();
          await this.updateUser(user.id, { uniqueId });
        }
        
        try {
          // Generate QR code (simplified - just name and email)
          const qrCode = await qrCodeService.generateUserQRCode({
            uniqueId: uniqueId,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt || new Date().toISOString(),
          });
          
          // Update user with QR code
          await this.updateUser(user.id, { qrCode });
          result.success++;
        } catch (error: any) {
          result.failed++;
          result.errors.push(`${user.name}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error generating missing QR codes:', error);
    }
    
    return result;
  },

  // Listen to users changes (real-time updates)
  onUsersChange(callback: (users: User[]) => void) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastLogin: doc.data().lastLogin?.toDate?.()?.toISOString(),
      })) as User[];
      
      callback(users);
    });
  }
};
