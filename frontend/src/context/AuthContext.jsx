import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [backendUser, setBackendUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      syncUserWithBackend();
    } else if (isLoaded && !isSignedIn) {
      localStorage.removeItem('token');
      setBackendUser(null);
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, user?.id]); // Only re-run when user ID changes, not on every render

  const syncUserWithBackend = async () => {
    try {
      setLoading(true);
      const response = await authAPI.clerkAuth({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName || user.username,
        avatar: user.imageUrl
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setBackendUser(response.data.user);
      }
    } catch (error) {
      console.error('Auth sync error:', error);
      toast.error('Failed to sync with server');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setBackendUser(null);
  };

  return (
    <AuthContext.Provider value={{
      backendUser,
      loading,
      isAuthenticated: !!backendUser,
      logout,
      refreshUser: syncUserWithBackend
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
