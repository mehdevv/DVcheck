import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { 
  Users, 
  UserPlus, 
  LogOut, 
  Search, 
  Shield,
  FileSpreadsheet,
  QrCode,
  Download,
  Calendar
} from 'lucide-react';
import { User, CreateUserData } from '../../types';
import { userService } from '../../firebase/userService';
import { ExcelUpload } from '../ExcelUpload';
import { EventsManagement } from './EventsManagement';
import { Footer } from '../ui/Footer';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'events'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserData>({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    school: '',
    year: undefined,
    department: '',
    role: 'member'
  });

  // Load users from Firestore
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        const usersData = await userService.getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      // Only create user in Firestore (not Firebase Auth)
      // Users will need to sign up themselves when they first login
      await userService.createUser(newUser);
      
      // Refresh users list
      const usersData = await userService.getUsers();
      setUsers(usersData);
      
      setNewUser({ name: '', email: '', password: '', phoneNumber: '', school: '', year: undefined, department: '', role: 'member' });
      setShowCreateUser(false);
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
      }
    }
  };

  const handleGenerateMissingQRCodes = async () => {
    if (!window.confirm('This will generate QR codes for all members that don\'t have one. Continue?')) {
      return;
    }
    
    setIsGeneratingQR(true);
    try {
      const result = await userService.generateMissingQRCodes();
      alert(`QR Code Generation Complete!\n\n✅ Success: ${result.success}\n❌ Failed: ${result.failed}${result.errors.length > 0 ? `\n\nErrors:\n${result.errors.slice(0, 5).join('\n')}${result.errors.length > 5 ? `\n... and ${result.errors.length - 5} more` : ''}` : ''}`);
      
      // Refresh users list
      const usersData = await userService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error generating QR codes:', error);
      alert('Error generating QR codes. Please try again.');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  return (
    <div className="min-h-screen bg-notion-gray-50 flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-notion-gray-200 px-4 sm:px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-notion-blue-600 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src="/DVscan.png" alt="DVcheck Logo" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-notion-gray-900 truncate">
                DVcheck Admin
              </h1>
              <p className="text-xs sm:text-sm text-notion-gray-600 truncate">
                Welcome back, {user?.name}
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={logout} className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </motion.header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-notion-gray-200 px-4 sm:px-6">
        <div className="flex space-x-1 max-w-7xl mx-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 sm:px-4 py-3 text-sm font-medium transition-colors relative flex-1 sm:flex-none ${
              activeTab === 'users'
                ? 'text-notion-blue-600'
                : 'text-notion-gray-600 hover:text-notion-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Users</span>
            </div>
            {activeTab === 'users' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-notion-blue-600"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 sm:px-4 py-3 text-sm font-medium transition-colors relative flex-1 sm:flex-none ${
              activeTab === 'events'
                ? 'text-notion-blue-600'
                : 'text-notion-gray-600 hover:text-notion-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Events</span>
            </div>
            {activeTab === 'events' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-notion-blue-600"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'events' ? (
        <EventsManagement />
      ) : (
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"
          >
            <Card hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-notion-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-notion-gray-900">{users.length}</p>
                </div>
                <Users className="w-8 h-8 text-notion-blue-600" />
              </div>
            </Card>
            <Card hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-notion-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-notion-gray-900">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-green-600" />
              </div>
            </Card>
            <Card hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-notion-gray-600">Members</p>
                  <p className="text-2xl font-bold text-notion-gray-900">
                    {users.filter(u => u.role === 'member').length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </Card>
          </motion.div>

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-lg font-semibold text-notion-gray-900 hidden sm:block">
                  User Management
                </h2>
                <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button
                    onClick={handleGenerateMissingQRCodes}
                    variant="secondary"
                    disabled={isGeneratingQR}
                    className="flex-1 min-w-0 items-center justify-center space-x-2 px-2 py-2 text-xs sm:flex-none sm:px-4 sm:py-2 sm:text-sm"
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="hidden sm:inline">{isGeneratingQR ? 'Generating...' : 'Generate QR Codes'}</span>
                    <span className="sm:hidden">{isGeneratingQR ? 'Generating...' : 'QR Codes'}</span>
                  </Button>
                  <Button
                    onClick={() => setShowExcelUpload(true)}
                    variant="secondary"
                    className="flex-1 min-w-0 items-center justify-center space-x-2 px-2 py-2 text-xs sm:flex-none sm:px-4 sm:py-2 sm:text-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">Upload Excel</span>
                    <span className="sm:hidden">Excel</span>
                  </Button>
                  <Button
                    onClick={() => setShowCreateUser(true)}
                    className="flex-1 min-w-0 items-center justify-center space-x-2 px-2 py-2 text-xs sm:flex-none sm:px-4 sm:py-2 sm:text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add User</span>
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-notion-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="overflow-x-auto overflow-y-auto max-h-[60vh] sm:max-h-[70vh] table-scrollbar">
                <table className="w-full min-w-[1400px]">
                  <thead>
                    <tr className="border-b border-notion-gray-200 bg-notion-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-notion-gray-700 whitespace-nowrap">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-notion-gray-700 whitespace-nowrap">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-notion-gray-700 whitespace-nowrap">Phone</th>
                      <th className="text-left py-3 px-4 font-medium text-notion-gray-700 whitespace-nowrap">School</th>
                      <th className="text-left py-3 px-4 font-medium text-notion-gray-700 whitespace-nowrap">Year</th>
                      <th className="text-left py-3 px-4 font-medium text-notion-gray-700 whitespace-nowrap">Department</th>
                      <th className="text-left py-3 px-4 font-medium text-notion-gray-700 whitespace-nowrap">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-notion-gray-700 whitespace-nowrap">ID</th>
                      <th className="text-left py-3 px-4 font-medium text-notion-gray-700 whitespace-nowrap">QR Code</th>
                      <th className="text-left py-3 px-4 font-medium text-notion-gray-700 whitespace-nowrap">Created</th>
                      <th className="text-left py-3 px-4 font-medium text-notion-gray-700 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-notion-gray-100 hover:bg-notion-gray-50"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-notion-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-notion-blue-600">
                                {user.name.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-notion-gray-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-notion-gray-600 whitespace-nowrap">{user.email}</td>
                        <td className="py-4 px-4 text-notion-gray-600 whitespace-nowrap">{user.phoneNumber || 'N/A'}</td>
                        <td className="py-4 px-4 text-notion-gray-600 whitespace-nowrap">{user.school || 'N/A'}</td>
                        <td className="py-4 px-4 text-notion-gray-600 whitespace-nowrap">{user.year ? `Year ${user.year}` : 'N/A'}</td>
                        <td className="py-4 px-4 text-notion-gray-600 whitespace-nowrap">{user.department || 'N/A'}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-notion-gray-600 whitespace-nowrap">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {user.uniqueId || 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          {user.qrCode ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowQRCode(true);
                              }}
                              className="flex items-center space-x-1"
                            >
                              <QrCode className="w-4 h-4" />
                              <span>View</span>
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-notion-gray-600 whitespace-nowrap">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowCreateUser(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg max-h-[calc(100vh-2rem)] flex flex-col mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="flex flex-col h-full max-h-full overflow-hidden">
              <div className="flex-shrink-0 pb-4 border-b border-notion-gray-200">
                <h3 className="text-lg font-semibold text-notion-gray-900">
                  Create New User
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto py-6 form-scrollbar pr-2 min-h-0">
                <form onSubmit={handleCreateUser} className="space-y-4">
                <Input
                  label="Full Name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  value={newUser.phoneNumber || ''}
                  onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                  placeholder="Enter phone number"
                />
                <Input
                  label="School"
                  type="text"
                  value={newUser.school || ''}
                  onChange={(e) => setNewUser({ ...newUser, school: e.target.value })}
                  placeholder="Enter school name"
                />
                <div>
                  <label className="block text-sm font-medium text-notion-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={newUser.year || ''}
                    onChange={(e) => setNewUser({ ...newUser, year: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-notion-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue-500 focus:border-notion-blue-500"
                  >
                    <option value="">Select Year</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                    <option value="5">Year 5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-notion-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    value={newUser.department || ''}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-notion-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue-500 focus:border-notion-blue-500"
                  >
                    <option value="">Select Department</option>
                    <option value="RE">RE</option>
                    <option value="RH">RH</option>
                    <option value="Marketing">Marketing</option>
                    <option value="IT">IT</option>
                  </select>
                </div>
                <Input
                  label="Password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-notion-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'member' })}
                    className="w-full px-3 py-2 border border-notion-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue-500 focus:border-notion-blue-500"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    🏢 <strong>Valid Departments:</strong> RE, RH, Marketing, IT
                  </p>
                </div>
                
                </form>
              </div>
              <div className="flex-shrink-0 pt-4 border-t border-notion-gray-200">
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCreateUser(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    onClick={handleCreateUser}
                  >
                    Create User
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Excel Upload Modal */}
      {showExcelUpload && (
        <ExcelUpload
          onUsersCreated={() => {
            // Refresh users list
            const loadUsers = async () => {
              try {
                const usersData = await userService.getUsers();
                setUsers(usersData);
              } catch (error) {
                console.error('Error loading users:', error);
              }
            };
            loadUsers();
          }}
          onClose={() => setShowExcelUpload(false)}
        />
      )}

      {/* QR Code Modal */}
      {showQRCode && selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowQRCode(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="max-h-full overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-notion-gray-900 flex items-center">
                  <QrCode className="w-5 h-5 mr-2 text-blue-600" />
                  QR Code - {selectedUser.name}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowQRCode(false)}>
                  ✕
                </Button>
              </div>
              
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                  {selectedUser.qrCode ? (
                    <img 
                      src={selectedUser.qrCode} 
                      alt={`QR Code for ${selectedUser.name}`}
                      className="w-48 h-48 mx-auto"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded">
                      <span className="text-gray-500">No QR Code</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-notion-gray-600">
                    <strong>Unique ID:</strong> {selectedUser.uniqueId}
                  </p>
                  <p className="text-sm text-notion-gray-600">
                    <strong>Name:</strong> {selectedUser.name}
                  </p>
                  <p className="text-sm text-notion-gray-600">
                    <strong>Email:</strong> {selectedUser.email}
                  </p>
                  <p className="text-sm text-notion-gray-600">
                    <strong>Role:</strong> {selectedUser.role}
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    💡 This QR code contains the member's unique information and can be used for check-in purposes.
                  </p>
                </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    🔐 <strong>Note:</strong> The user will create their Firebase Auth account when they first login with the provided password.
                  </p>
                </div>
                
                <div className="flex space-x-3 pt-6">
                <Button
                  variant="secondary"
                  onClick={() => setShowQRCode(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                {selectedUser.qrCode && (
                  <Button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedUser.qrCode!;
                      link.download = `${selectedUser.name}_QR_Code.png`;
                      link.click();
                    }}
                    className="flex-1 flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};
