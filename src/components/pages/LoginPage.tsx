import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Footer } from '../ui/Footer';
import { Mail, Lock, Users, AlertCircle, X } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // Always prevent default form submission - this MUST be first
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple submissions
    if (isSubmitting || isLoading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Clear any existing errors
    setError('');
    setIsSubmitting(true);
    
    // Basic validation
    if (!email.trim()) {
      setError('Please enter your email address');
      setIsSubmitting(false);
      return;
    }
    
    if (!password.trim()) {
      setError('Please enter your password');
      setIsSubmitting(false);
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }
    
    // Attempt login
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || 'Login failed. Please check your credentials and try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-notion-gray-50 to-notion-gray-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="w-16 h-16 bg-notion-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img src="/DVscan.png" alt="DVcheck Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-notion-gray-900 mb-2">
              Welcome to DVcheck
            </h1>
            <p className="text-notion-gray-600">
              Sign in to your account to continue
            </p>
          </motion.div>

          <form 
            onSubmit={handleSubmit}
            className="space-y-6" 
            noValidate
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (isLoading || isSubmitting)) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (isLoading || isSubmitting)) {
                    e.preventDefault();
                  }
                }}
                placeholder="Enter your email"
                icon={<Mail className="w-4 h-4" />}
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (isLoading || isSubmitting)) {
                    e.preventDefault();
                  }
                }}
                placeholder="Enter your password"
                icon={<Lock className="w-4 h-4" />}
                required
              />
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg"
              >
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 mb-1">Login Failed</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                  <button
                    onClick={() => setError('')}
                    className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                    aria-label="Dismiss error"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                type="submit"
                loading={isLoading || isSubmitting}
                disabled={isLoading || isSubmitting}
                className="w-full"
                size="lg"
                onClick={(e) => {
                  if (isLoading || isSubmitting) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              >
                {isLoading || isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
            </motion.div>
          </form>
        </Card>
      </motion.div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};
