import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authAPI, saveAuth, clearAuth, getAuth } from '../api/auth';

// Create context
const AuthContext = createContext(undefined);

/**
 * AuthProvider - Manage authentication state globally
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ═══════════════════════════════════════════════════════════
  // INIT AUTH ON MOUNT (Check if user is already logged in)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const token = localStorage.getItem('rpl_token');
        const storedUser = getAuth();

        // Only verify with API if we have both token AND stored user
        if (token && storedUser?.id) {
          try {
            const res = await authAPI.me();
            
            if (isMounted && res?.status === 'success' && res?.data) {
              // Token valid, update state with fresh data
              setUser(res.data);
              saveAuth(token, res.data); // Refresh storage
            } else {
              // Token invalid or user not found
              if (isMounted) {
                clearAuth();
                setUser(null);
              }
            }
          } catch (apiError) {
            // API call failed (401, network error, etc.)
            console.warn('Auth verification failed:', apiError?.message);
            if (isMounted) {
              clearAuth();
              setUser(null);
            }
          }
        } else {
          // No valid auth data
          if (isMounted) {
            clearAuth();
            setUser(null);
          }
        }
      } catch (initError) {
        // Catch unexpected errors
        console.error('Auth initialization error:', initError);
        if (isMounted) {
          clearAuth();
          setUser(null);
        }
      } finally {
        // Always set loading to false when mounted
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  // ═══════════════════════════════════════════════════════════
  // LOGIN FUNCTION
  // ═══════════════════════════════════════════════════════════
  const login = useCallback(async (email, password) => {
    setError(null);
    
    try {
      const res = await authAPI.login({ email, password });
      
      if (res?.status === 'success' && res?.data?.token && res?.data?.user) {
        saveAuth(res.data.token, res.data.user);
        setUser(res.data.user);
        
        return { 
          success: true, 
          role: res.data.user.role,
          user: res.data.user,
          message: res.message || 'Login berhasil'
        };
      }
      
      // Login failed with error message from backend
      return { 
        success: false, 
        error: res?.message || 'Login gagal',
        code: res?.code
      };
      
    } catch (err) {
      // Network error or unexpected error
      const errorMsg = err?.message || err?.response?.data?.message || 'Terjadi kesalahan koneksi';
      const errorCode = err?.code || err?.response?.data?.code || 'NETWORK_ERROR';
      
      setError(errorMsg);
      return { 
        success: false, 
        error: errorMsg,
        code: errorCode
      };
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // LOGOUT FUNCTION
  // ═══════════════════════════════════════════════════════════
  const logout = useCallback(async () => {
    try { 
      // Try to notify backend (but don't fail if it errors)
      await authAPI.logout().catch(() => {}); 
    } catch (e) {
      console.warn('Logout API call failed (continuing anyway):', e);
    } finally {
      // Always clear local auth data
      clearAuth();
      setUser(null);
      setError(null);
      
      // Force redirect to login
      window.location.replace('/login');
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // UPDATE PROFILE FUNCTION
  // ═══════════════════════════════════════════════════════════
  const updateProfile = useCallback(async (data) => {
    try {
      const res = await authAPI.updateProfile(data);
      
      if (res?.status === 'success' && res?.data) {
        // Update local state and storage
        setUser(res.data);
        const currentToken = localStorage.getItem('rpl_token');
        if (currentToken) {
          saveAuth(currentToken, res.data);
        }
        return { success: true, user: res.data, message: res.message };
      }
      
      return { success: false, error: res?.message || 'Gagal update profil' };
      
    } catch (err) {
      const errorMsg = err?.message || err?.response?.data?.message || 'Gagal update profil';
      return { success: false, error: errorMsg };
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // MEMOIZED CONTEXT VALUE (Prevents unnecessary re-renders)
  // ═══════════════════════════════════════════════════════════
  const contextValue = useMemo(() => ({
    user,
    loading,
    error,
    login,
    logout,
    updateProfile,
    // Computed booleans for easy role checks
    isAuthenticated: !!user,
    isStudent: user?.role === 'siswa',
    isTeacher: user?.role === 'guru',
    isAdmin: user?.role === 'admin',
    // Helper to clear error state
    clearError: () => setError(null),
  }), [user, loading, error, login, logout, updateProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 * @throws Error if used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context; 
};