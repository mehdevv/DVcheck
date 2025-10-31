import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { QrCode, X, CheckCircle, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (scannedData: { name: string; email: string }) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastScanned, setLastScanned] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const startScanning = async () => {
      if (!scannerRef.current) return;

      try {
        const html5QrCode = new Html5Qrcode(scannerRef.current.id);
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' }, // Use back camera on mobile
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Parse the QR code format: "Name: John Doe, Email: john@example.com"
            const nameMatch = decodedText.match(/Name:\s*([^,]+)/);
            const emailMatch = decodedText.match(/Email:\s*([^\s,]+)/);

            if (nameMatch && emailMatch) {
              const name = nameMatch[1].trim();
              const email = emailMatch[1].trim();

              if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setLastScanned({ name, email });
                setError('');
                
                // Stop scanning temporarily
                html5QrCode.stop();
                setIsScanning(false);
                
                // Call success callback
                onScanSuccess({ name, email });
              } else {
                setError('Invalid email format in QR code');
              }
            } else {
              setError('Invalid QR code format. Expected: "Name: ..., Email: ..."');
            }
          },
          (errorMessage) => {
            // Ignore scanning errors (they're frequent and normal)
          }
        );

        setIsScanning(true);
        setError('');
      } catch (err: any) {
        console.error('Error starting QR scanner:', err);
        setError(err.message || 'Failed to start camera. Please check permissions.');
        setIsScanning(false);
      }
    };

    startScanning();

    // Cleanup on unmount
    return () => {
      if (html5QrCodeRef.current && isScanning) {
        html5QrCodeRef.current.stop().catch(() => {
          // Ignore errors during cleanup
        });
      }
    };
  }, []);

  const handleStop = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleResume = async () => {
    if (!scannerRef.current || !html5QrCodeRef.current) return;

    try {
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          const nameMatch = decodedText.match(/Name:\s*([^,]+)/);
          const emailMatch = decodedText.match(/Email:\s*([^\s,]+)/);

          if (nameMatch && emailMatch) {
            const name = nameMatch[1].trim();
            const email = emailMatch[1].trim();

            if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              setLastScanned({ name, email });
              setError('');
              html5QrCodeRef.current?.stop();
              setIsScanning(false);
              onScanSuccess({ name, email });
            } else {
              setError('Invalid email format in QR code');
            }
          } else {
            setError('Invalid QR code format. Expected: "Name: ..., Email: ..."');
          }
        },
        () => {}
      );
      setIsScanning(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to resume scanning');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl max-h-[calc(100vh-2rem)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="flex flex-col h-full max-h-full overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 pb-4 border-b border-notion-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-notion-gray-900 flex items-center">
                <QrCode className="w-5 h-5 mr-2 text-blue-600" />
                Scan Member QR Code
              </h3>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Scanner Content */}
          <div className="flex-1 overflow-y-auto py-6 form-scrollbar pr-2 min-h-0">
            <div className="space-y-4">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📱 How to Scan</h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Allow camera permissions when prompted</li>
                  <li>Point your camera at the member's QR code</li>
                  <li>The member will be automatically added to the event</li>
                  <li>Make sure the QR code is clearly visible and well-lit</li>
                </ul>
              </div>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-4"
                >
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Error</p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Success Display */}
              {lastScanned && !error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-4"
                >
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Successfully Scanned!</p>
                      <p className="text-sm text-green-700">
                        <strong>Name:</strong> {lastScanned.name}
                      </p>
                      <p className="text-sm text-green-700">
                        <strong>Email:</strong> {lastScanned.email}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Scanner Area */}
              <div className="bg-black rounded-lg overflow-hidden relative">
                <div
                  id="qr-scanner"
                  ref={scannerRef}
                  className="w-full min-h-[400px]"
                />
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                    <div className="text-center text-white">
                      <QrCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-4">Scanner Stopped</p>
                      <Button onClick={handleResume} variant="primary">
                        Resume Scanning
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex space-x-3">
                {isScanning ? (
                  <Button onClick={handleStop} variant="secondary" className="flex-1">
                    Stop Scanning
                  </Button>
                ) : (
                  <Button onClick={handleResume} variant="primary" className="flex-1">
                    Start Scanning
                  </Button>
                )}
                <Button onClick={onClose} variant="ghost" className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

