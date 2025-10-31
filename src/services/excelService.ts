import * as XLSX from 'xlsx';
import { CreateUserData } from '../types';

export interface ExcelUserData {
  name: string;
  email: string;
  phoneNumber?: string;
  school?: string;
  year?: number;
  department?: string;
  role: 'admin' | 'member';
  generatedPassword?: string; // Added for preview display
}

export const excelService = {
  // Parse Excel file and extract user data
  parseExcelFile(file: File): Promise<ExcelUserData[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const users = jsonData.map((row: any) => {
            const email = row['Email'] || '';
            const phoneNumber = row['Phone Number'] || row['Phone'] || '';
            const providedPassword = row['Password'] || '';
            
            // Use provided password if available, otherwise generate one
            const password = providedPassword.trim() || this.generatePassword(email, phoneNumber);
            
            return {
              name: row['Full Name'] || row['Name'] || '',
              email: email,
              phoneNumber: phoneNumber,
              school: row['School'] || '',
              year: row['Year'] ? parseInt(row['Year']) : undefined,
              department: row['Department'] || '',
              role: (row['Role'] || 'member').toLowerCase() as 'admin' | 'member',
              generatedPassword: password
            };
          }).filter(user => user.name && user.email);
          
          resolve(users);
        } catch (error) {
          reject(new Error('Failed to parse Excel file. Please check the format.'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file.'));
      };
      
      reader.readAsBinaryString(file);
    });
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

  // Generate Excel template
  generateTemplate(): void {
    const templateData = [
      {
        'Full Name': 'John Doe',
        'Email': 'john.doe@example.com',
        'Phone Number': '+1234567890',
        'Password': '', // Will be filled with formula
        'School': 'University of Technology',
        'Year': 3,
        'Department': 'IT',
        'Role': 'member'
      },
      {
        'Full Name': 'Jane Smith',
        'Email': 'jane.smith@example.com',
        'Phone Number': '+1234567891',
        'Password': '',
        'School': 'Engineering College',
        'Year': 2,
        'Department': 'Marketing',
        'Role': 'member'
      },
      {
        'Full Name': 'Mike Johnson',
        'Email': 'mike.johnson@example.com',
        'Phone Number': '+1234567892',
        'Password': '',
        'School': 'Business School',
        'Year': 4,
        'Department': 'RH',
        'Role': 'member'
      },
      {
        'Full Name': 'Sarah Wilson',
        'Email': 'sarah.wilson@example.com',
        'Phone Number': '+1234567893',
        'Password': '',
        'School': 'Finance Institute',
        'Year': 1,
        'Department': 'RE',
        'Role': 'member'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    
    // Add password formulas to rows (starting from row 2, as row 1 is header)
    // Formula: LEFT(B2, FIND("@", B2)-1) & RIGHT(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(C2, " ", ""), "-", ""), "(", ""), ")", ""), "+", ""), 4)
    // This extracts email prefix + last 4 digits of phone number
    const startRow = 2; // Data starts at row 2 (row 1 is header)
    const endRow = templateData.length + 1; // +1 because header is row 1
    
    for (let row = startRow; row <= endRow; row++) {
      // Column B = Email, Column C = Phone Number, Column D = Password
      const emailCell = `B${row}`;
      const phoneCell = `C${row}`;
      const passwordCell = `D${row}`;
      
      // Create formula that extracts email prefix and last 4 phone digits
      // Clean phone: remove spaces, dashes, parentheses, and plus signs, then take last 4 digits
      const phoneCleanFormula = `SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(${phoneCell}, " ", ""), "-", ""), "(", ""), ")", ""), "+", "")`;
      const passwordFormula = `LEFT(${emailCell}, FIND("@", ${emailCell})-1) & RIGHT(${phoneCleanFormula}, 4)`;
      
      // Set the formula in the cell
      if (!worksheet[passwordCell]) {
        worksheet[passwordCell] = {};
      }
      worksheet[passwordCell].f = passwordFormula;
      worksheet[passwordCell].t = 'n'; // Formula type
    }
    
    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Full Name (A)
      { wch: 25 }, // Email (B)
      { wch: 15 }, // Phone Number (C)
      { wch: 20 }, // Password (D)
      { wch: 20 }, // School (E)
      { wch: 8 },  // Year (F)
      { wch: 20 }, // Department (G)
      { wch: 10 }  // Role (H)
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.writeFile(workbook, 'DVcheck_User_Template.xlsx');
  },

  // Validate Excel data
  validateExcelData(users: ExcelUserData[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    users.forEach((user, index) => {
      const rowNumber = index + 2; // +2 because Excel starts from row 1 and we skip header
      
      if (!user.name || user.name.trim() === '') {
        errors.push(`Row ${rowNumber}: Full Name is required`);
      }
      
      if (!user.email || user.email.trim() === '') {
        errors.push(`Row ${rowNumber}: Email is required`);
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        errors.push(`Row ${rowNumber}: Invalid email format`);
      }
      
      if (user.year && (user.year < 1 || user.year > 5)) {
        errors.push(`Row ${rowNumber}: Year must be between 1 and 5`);
      }
      
      if (user.department && !['RE', 'RH', 'Marketing', 'IT'].includes(user.department)) {
        errors.push(`Row ${rowNumber}: Department must be one of: RE, RH, Marketing, IT`);
      }
      
      if (user.role && !['admin', 'member'].includes(user.role)) {
        errors.push(`Row ${rowNumber}: Role must be 'admin' or 'member'`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
};
