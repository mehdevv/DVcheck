import { authService } from '../firebase/authService';
import { userService } from '../firebase/userService';
import { CreateUserData } from '../types';
import { ExcelUserData } from './excelService';
import { qrCodeService } from './qrCodeService';

export interface BulkCreateResult {
  success: number;
  failed: number;
  errors: string[];
}

export const bulkUserService = {
  // Create multiple users from Excel data
  async createUsersFromExcel(excelUsers: ExcelUserData[]): Promise<BulkCreateResult> {
    const result: BulkCreateResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < excelUsers.length; i++) {
      const excelUser = excelUsers[i];
      const rowNumber = i + 2; // +2 because Excel starts from row 1 and we skip header
      
      try {
        // Convert ExcelUserData to CreateUserData
        // Use generatedPassword from Excel (which comes from the Password column or is auto-generated)
        const userData: CreateUserData = {
          name: excelUser.name,
          email: excelUser.email,
          password: excelUser.generatedPassword || this.generatePassword(excelUser.email, excelUser.phoneNumber),
          phoneNumber: excelUser.phoneNumber,
          school: excelUser.school,
          year: excelUser.year,
          department: excelUser.department,
          role: excelUser.role
        };

        // Only create user in Firestore (not Firebase Auth)
        // Users will need to sign up themselves when they first login
        await userService.createUser(userData);
        
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Row ${rowNumber}: ${error.message || 'Failed to create user'}`);
      }
    }

    return result;
  },

  // Generate a password based on email and phone number
  generatePassword(email: string, phoneNumber?: string): string {
    // Extract the part before @ from email
    const emailPrefix = email.split('@')[0];
    
    // Get last 4 digits of phone number, or use '0000' if no phone
    const lastFourDigits = phoneNumber 
      ? phoneNumber.replace(/\D/g, '').slice(-4).padStart(4, '0')
      : '0000';
    
    // Combine email prefix with last 4 digits
    return `${emailPrefix}${lastFourDigits}`;
  },

  // Get bulk creation summary message
  getSummaryMessage(result: BulkCreateResult): string {
    let message = `Bulk creation completed!\n\n`;
    message += `✅ Successfully created: ${result.success} users\n`;
    message += `❌ Failed to create: ${result.failed} users\n\n`;
    
    if (result.errors.length > 0) {
      message += `Errors:\n${result.errors.slice(0, 10).join('\n')}`;
      if (result.errors.length > 10) {
        message += `\n... and ${result.errors.length - 10} more errors`;
      }
    }
    
    return message;
  }
};
