import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { excelService, ExcelUserData } from '../services/excelService';
import { bulkUserService, BulkCreateResult } from '../services/bulkUserService';

interface ExcelUploadProps {
  onUsersCreated: () => void;
  onClose: () => void;
}

export const ExcelUpload: React.FC<ExcelUploadProps> = ({ onUsersCreated, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BulkCreateResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [parsedUsers, setParsedUsers] = useState<ExcelUserData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          selectedFile.type === 'application/vnd.ms-excel' ||
          selectedFile.name.endsWith('.xlsx') ||
          selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setResult(null);
        setValidationErrors([]);
        
        // Parse file to show preview
        try {
          const excelUsers = await excelService.parseExcelFile(selectedFile);
          setParsedUsers(excelUsers);
          
          // Validate data
          const validation = excelService.validateExcelData(excelUsers);
          if (!validation.valid) {
            setValidationErrors(validation.errors);
          }
        } catch (error: any) {
          setValidationErrors([`Failed to parse file: ${error.message}`]);
        }
      } else {
        alert('Please select a valid Excel file (.xlsx or .xls)');
      }
    }
  };

  const handleUpload = async () => {
    if (!file || parsedUsers.length === 0) return;

    setIsProcessing(true);
    try {
      // Validate data (already validated in handleFileSelect, but double-check)
      const validation = excelService.validateExcelData(parsedUsers);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        setIsProcessing(false);
        return;
      }

      // Create users
      setIsUploading(true);
      const createResult = await bulkUserService.createUsersFromExcel(parsedUsers);
      setResult(createResult);
      
      if (createResult.success > 0) {
        onUsersCreated();
      }
    } catch (error: any) {
      alert(`Error processing file: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    excelService.generateTemplate();
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setValidationErrors([]);
    setParsedUsers([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl max-h-[calc(100vh-2rem)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="flex flex-col h-full max-h-full overflow-hidden">
          <div className="flex-shrink-0 pb-4 border-b border-notion-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-notion-gray-900 flex items-center">
                <FileSpreadsheet className="w-5 h-5 mr-2 text-green-600" />
                Bulk User Upload
              </h3>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                ✕
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-6 form-scrollbar pr-2 min-h-0">
            <div className="space-y-6">
              {/* Template Download */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📋 Step 1: Download Template</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Download the Excel template to see the required format and structure.
                </p>
                <Button
                  variant="secondary"
                  onClick={handleDownloadTemplate}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template</span>
                </Button>
              </div>

              {/* File Upload */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📤 Step 2: Upload Excel File</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Select your Excel file with user data. Make sure it follows the template format.
                </p>
                
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{file ? file.name : 'Choose Excel File'}</span>
                  </Button>

                  {file && (
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>File selected: {file.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Validation Errors
                  </h4>
                  <div className="max-h-32 overflow-y-auto">
                    {validationErrors.map((error, index) => (
                      <p key={index} className="text-sm text-red-700 mb-1">
                        • {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {parsedUsers.length > 0 && validationErrors.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Preview ({parsedUsers.length} users found)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-green-300">
                          <th className="text-left py-2 px-2 font-medium text-green-800">Name</th>
                          <th className="text-left py-2 px-2 font-medium text-green-800">Email</th>
                          <th className="text-left py-2 px-2 font-medium text-green-800">Phone</th>
                          <th className="text-left py-2 px-2 font-medium text-green-800">School</th>
                          <th className="text-left py-2 px-2 font-medium text-green-800">Year</th>
                          <th className="text-left py-2 px-2 font-medium text-green-800">Department</th>
                          <th className="text-left py-2 px-2 font-medium text-green-800">Role</th>
                          <th className="text-left py-2 px-2 font-medium text-green-800">Generated Password</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedUsers.slice(0, 10).map((user, index) => (
                          <tr key={index} className="border-b border-green-200">
                            <td className="py-2 px-2 text-green-700">{user.name}</td>
                            <td className="py-2 px-2 text-green-700">{user.email}</td>
                            <td className="py-2 px-2 text-green-700">{user.phoneNumber || 'N/A'}</td>
                            <td className="py-2 px-2 text-green-700">{user.school || 'N/A'}</td>
                            <td className="py-2 px-2 text-green-700">{user.year ? `Year ${user.year}` : 'N/A'}</td>
                            <td className="py-2 px-2 text-green-700">{user.department || 'N/A'}</td>
                            <td className="py-2 px-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'admin' 
                                  ? 'bg-green-200 text-green-800' 
                                  : 'bg-blue-200 text-blue-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                                {user.generatedPassword}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedUsers.length > 10 && (
                      <p className="text-xs text-green-600 mt-2 text-center">
                        ... and {parsedUsers.length - 10} more users
                      </p>
                    )}
                  </div>
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-2">
                    <p className="text-xs text-blue-700">
                      💡 <strong>Password Format:</strong> Email prefix + last 4 digits of phone number
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      🔐 <strong>Note:</strong> Users will create their Firebase Auth account when they first login
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      🏢 <strong>Valid Departments:</strong> RE, RH, Marketing, IT
                    </p>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {file && validationErrors.length === 0 && (
                <div className="flex space-x-3">
                  <Button
                    onClick={handleUpload}
                    disabled={isProcessing || isUploading}
                    className="flex-1 flex items-center justify-center space-x-2"
                  >
                    {isProcessing || isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isUploading ? 'Creating Users...' : 'Processing...'}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload & Create Users</span>
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Results */}
              {result && (
                <div className={`border rounded-lg p-4 ${
                  result.success > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <h4 className={`font-semibold mb-2 flex items-center ${
                    result.success > 0 ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {result.success > 0 ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Upload Results
                  </h4>
                  <div className="text-sm space-y-1">
                    <p className={result.success > 0 ? 'text-green-700' : 'text-red-700'}>
                      ✅ Successfully created: {result.success} users
                    </p>
                    <p className="text-red-700">
                      ❌ Failed to create: {result.failed} users
                    </p>
                    {result.errors.length > 0 && (
                      <div className="mt-2 max-h-24 overflow-y-auto">
                        {result.errors.slice(0, 5).map((error, index) => (
                          <p key={index} className="text-red-600 text-xs">
                            • {error}
                          </p>
                        ))}
                        {result.errors.length > 5 && (
                          <p className="text-red-600 text-xs">
                            ... and {result.errors.length - 5} more errors
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 pt-4 border-t border-notion-gray-200">
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={handleClose}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
