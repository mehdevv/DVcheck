import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Footer } from '../ui/Footer';
import { QrCode, Download, User, Mail, Phone, School, Calendar, Shield, LogOut } from 'lucide-react';
import { authService } from '../../firebase/authService';
import { userService } from '../../firebase/userService';
import { User as UserType } from '../../types';

export const MemberDashboard: React.FC = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePage, setActivePage] = useState<'profile' | 'qrcode'>('profile');

  // Fetch full user data from Firestore
  useEffect(() => {
    const loadUserData = async () => {
      if (authUser) {
        try {
          setIsLoading(true);
          // Get user data from Firestore by email
          const currentUser = await userService.getUserByEmail(authUser.email);
          
          if (currentUser) {
            setUser(currentUser);
          } else {
러한            // If user not found in Firestore, use auth data as fallback
            setUser(authUser);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          // Fallback to auth user data
          setUser(authUser);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadUserData();
  }, [authUser]);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!authUser || isLoading || !user) {
    return (
      <div className="min-h-screen bg-notion-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-notion-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-notion-gray-50 flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-notion-gray-200"
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-notion-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/DVscan.png" alt="DVcheck Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-notion-gray-900">
                  DVcheck Member
                </h1>
                <p className="text-sm text-notion-gray-600">
                  Welcome back, {user.name}
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-1 border-b border-notion-gray-200">
            <button
              onClick={() => setActivePage('profile')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activePage === 'profile'
                  ? 'text-notion-blue-600 border-b-2 border-notion-blue-600'
                  : 'text-notion-gray-600 hover:text-notion-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </div>
            </button>
            <button
              onClick={() => setActivePage('qrcode')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activePage === 'qrcode'
                  ? 'text-notion-blue-600 border-b-2 border-notion-blue-600'
                  : 'text-notion-gray-600 hover:text-notion-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <QrCode className="w-4 h-4" />
                <span>QR Code</span>
              </div>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {activePage === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-notion-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-semibold text-notion-blue-600">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-notion-gray-900">{user.name}</h2>
                  <p className="text-sm text-notion-gray-600">{user.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-notion-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-notion-gray-700">Email</p>
                    <p className="text-sm text-notion-gray-600">{user.email}</p>
                  </div>
                </div>

                {user.phoneNumber && (
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-notion-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-notion-gray-700">Phone Number</p>
                      <p className="text-sm text-notion-gray-600">{user.phoneNumber}</p>
                    </div>
                  </div>
                )}

                {user.school && (
                  <div className="flex items-start space-x-3">
                    <School className="w-5 h-5 text-notion-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-notion-gray-700">School</p>
                      <p className="text-sm text-notion-gray-600">{user.school}</p>
                    </div>
                  </div>
                )}

                {user.year && (
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-notion-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-notion-gray-700">Year</p>
                      <p className="text-sm text-notion-gray-600">Year {user.year}</p>
                    </div>
                  </div>
                )}

                {user.department && (
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-notion-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-notion-gray-700">Department</p>
                      <p className="text-sm text-notion-gray-600">{user.department}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-notion-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-notion-gray-700">Unique ID</p>
                    <p className="text-sm font-mono text-notion-gray-600 bg-gray-100 px-2 py-1 rounded inline-block">
                      {user.uniqueId}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-notion-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-notion-gray-700">Joined</p>
                    <p className="text-sm text-notion-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {activePage === 'qrcode' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <div className="text-center">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-notion-gray-900 flex items-center justify-center">
                    <QrCode className="w-6 h-6 mr-2 text-blue-600" />
                    Your QR Code
                  </h2>
                  <p className="text-sm text-notion-gray-600 mt-2">
                    Scan this QR code for check-in at events and activities
                  </p>
                </div>

                {user.qrCode ? (
                  <div className="space-y-8">
                    {/* Large QR Code Display */}
                    <div className="bg-gray-50 rounded-lg p-8">
                      <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block shadow-lg">
                        <img 
                          src={user.qrCode} 
                          alt={`QR Code for ${user.name}`}
                          className="w-80 h-80 mx-auto"
                        />
                      </div>
                    </div>

                    {/* Member Information - Matching Admin Dashboard */}
                    <div className="space-y-2">
                      <p className="text-sm text-notion-gray-600">
                        <strong>Unique ID:</strong> {user.uniqueId}
                      </p>
                      <p className="text-sm text-notion-gray-600">
                        <strong>Name:</strong> {user.name}
                      </p>
                      <p className="text-sm text-notion-gray-600">
                        <strong>Email:</strong> {user.email}
                      </p>
                      <p className="text-sm text-notion-gray-600">
                        <strong>Role:</strong> {user.role}
                      </p>
                    </div>

                    {/* Download Button */}
                    <div className="flex justify-center">
                      <Button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = user.qrCode!;
                          link.download = `${user.name.replace(/\s+/g, '_')}_QR_Code.png`;
                          link.click();
                        }}
                        className="flex items-center space-x-2 px-8 py-3"
                      >
                        <Download className="w-5 h-5" />
                        <span>Download QR Code</span>
                      </Button>
                    </div>

                    {/* Usage Instructions - Matching Admin Dashboard */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-700">
                        💡 This QR code contains the member's unique information and can be used for check-in purposes.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <QrCode className="w-24 h-24 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg text-gray-600 mb-2">QR Code not available</p>
                    <p className="text-sm text-gray-500">
                      Please contact your administrator to generate your QR code
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};
