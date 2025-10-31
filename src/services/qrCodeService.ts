import QRCode from 'qrcode';

export interface QRCodeData {
  uniqueId: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export const qrCodeService = {
  // Generate a unique ID for the user
  generateUniqueId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `HR${timestamp}${randomStr}`.toUpperCase();
  },

  // Generate QR code data object
  generateQRData(user: {
    uniqueId: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }): QRCodeData {
    return {
      uniqueId: user.uniqueId,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
  },

  // Generate QR code as base64 image
  async generateQRCode(data: QRCodeData): Promise<string> {
    try {
      const qrDataString = JSON.stringify(data);
      const qrCodeDataURL = await QRCode.toDataURL(qrDataString, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  },

  // Generate QR code for user (simplified - just name and email)
  async generateUserQRCode(user: {
    uniqueId: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }): Promise<string> {
    try {
      // Simple format: "Name: John Doe, Email: john@example.com"
      const qrDataString = `Name: ${user.name}, Email: ${user.email}`;
      
      const qrCodeDataURL = await QRCode.toDataURL(qrDataString, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  },

  // Parse QR code data (for future check-in functionality)
  parseQRCode(qrCodeString: string): QRCodeData | null {
    try {
      return JSON.parse(qrCodeString);
    } catch (error) {
      console.error('Error parsing QR code:', error);
      return null;
    }
  },

  // Parse QR code from the simplified format: "Name: John Doe, Email: john@example.com"
  parseSimpleQRCode(qrCodeString: string): { name: string; email: string } | null {
    try {
      const nameMatch = qrCodeString.match(/Name:\s*([^,]+)/);
      const emailMatch = qrCodeString.match(/Email:\s*([^\s,]+)/);

      if (nameMatch && emailMatch) {
        const name = nameMatch[1].trim();
        const email = emailMatch[1].trim();

        // Validate email format
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return { name, email };
        }
      }
      return null;
    } catch (error) {
      console.error('Error parsing simple QR code:', error);
      return null;
    }
  },

  // Validate QR code data
  validateQRCodeData(data: any): boolean {
    return (
      data &&
      typeof data.uniqueId === 'string' &&
      typeof data.name === 'string' &&
      typeof data.email === 'string' &&
      typeof data.role === 'string' &&
      typeof data.createdAt === 'string'
    );
  }
};
