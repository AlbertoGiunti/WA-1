import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api';

/**
 * Authentication context for managing user state and authentication operations
 */
const AuthCtx = createContext(null);

/**
 * Authentication provider component that manages user state and auth operations
 * Provides login, register, logout, and coin synchronization functionality
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // User object: {id, username, coins}
  const [loading, setLoading] = useState(true); // Loading state for initial auth check

  /**
   * Authenticates user with username and password
   * @param {string} username - User's username
   * @param {string} password - User's password
   */
  const login = async (username, password) => {
    try {
      const u = await api.login(username, password);
      setUser(u);
    } catch (error) {
      // Provide more specific error messages
      if (error.status === 401) {
        throw new Error('Invalid username or password');
      } else if (error.status >= 500) {
        throw new Error('Server error. Please try again later');
      } else {
        throw new Error('Login failed. Please check your credentials');
      }
    }
  };

  /**
   * Registers a new user account
   * @param {string} username - Desired username
   * @param {string} password - User's password
   */
  const register = async (username, password) => {
    try {
      const u = await api.register(username, password);
      setUser(u);
    } catch (error) {
      // Provide specific error messages for registration
      if (error.status === 409) {
        throw new Error('Username already exists. Please choose another');
      } else if (error.status === 400) {
        throw new Error('Invalid input. Please check your username and password');
      } else if (error.status >= 500) {
        throw new Error('Server error. Please try again later');
      } else {
        throw new Error('Registration failed. Please try again');
      }
    }
  };

  /**
   * Logs out the current user and clears user state
   */
  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
    } catch (error) {
      // Even if logout fails on server, clear local state
      setUser(null);
      // Don't throw error for logout failures - they're not critical
    }
  };

  /**
   * Refreshes user authentication state from server
   * @param {AbortSignal} signal - Abort signal for request cancellation
   */
  const refresh = useCallback(async (signal) => {
    try { 
      const u = await api.me({ signal }); 
      setUser(u); 
    } catch { 
      setUser(null); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  // Check authentication status on component mount
  useEffect(() => {
    const ctrl = new AbortController();
    refresh(ctrl.signal); 
    return () => ctrl.abort();
  }, [refresh]);

  /**
   * Synchronizes user's coin count with server
   * Used after game actions that affect coin balance
   */
  const syncCoins = async () => {
    try {
      const s = await api.meSnapshot();
      setUser(u => u ? ({ ...u, coins: s.coins }) : u);
    } catch {
      // Silently fail - coin sync is not critical
    }
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh, syncCoins }}>
      {children}
    </AuthCtx.Provider>
  );
}

/**
 * Custom hook to access authentication context
 * @returns {Object} Authentication context with user state and auth functions
 */
export const useAuth = () => useContext(AuthCtx);
