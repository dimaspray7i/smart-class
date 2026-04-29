import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, saveAuth, clearAuth, getAuth } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getAuth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('rpl_token');
      if (token) {
        try {
          const res = await authAPI.me();
          if (res?.status === 'success') {
            setUser(res.data);
            saveAuth(token, res.data);
          } else {
            clearAuth();
          }
        } catch (e) {
          console.error('Auth initialization error:', e);
          clearAuth();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  /**
   * Login user
   * @returns {Object} { success: boolean, role?: string, error?: string }
   */
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const res = await authAPI.login({ email, password });
      
      if (res?.status === 'success') {
        saveAuth(res.data.token, res.data.user);
        setUser(res.data.user);
        
        // Return role so LoginPage can handle redirect
        return { 
          success: true, 
          role: res.data.user.role,
          user: res.data.user 
        };
      }
      
      return { 
        success: false, 
        error: res?.message || 'Login gagal' 
      };
    } catch (err) {
      const errorMsg = err?.message || err?.response?.data?.message || 'Terjadi kesalahan saat login';
      setError(errorMsg);
      return { 
        success: false, 
        error: errorMsg 
      };
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try { 
      await authAPI.logout(); 
    } catch (e) {
      console.error('Logout API error:', e);
      // Continue anyway - clear local state
    } finally {
      clearAuth();
      setUser(null);
      // Use window.location as fallback since we removed useNavigate
      window.location.href = '/login';
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data) => {
    try {
      const res = await authAPI.updateProfile(data);
      
      if (res?.status === 'success') {
        setUser(res.data);
        saveAuth(localStorage.getItem('rpl_token'), res.data);
        return { 
          success: true, 
          user: res.data 
        };
      }
      
      return { 
        success: false, 
        error: res?.message || 'Gagal update profil' 
      };
    } catch (err) {
      const errorMsg = err?.message || err?.response?.data?.message || 'Gagal update profil';
      return { 
        success: false, 
        error: errorMsg 
      };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      logout, 
      updateProfile,
      isAuthenticated: !!user,
      isStudent: user?.role === 'siswa',
      isTeacher: user?.role === 'guru',
      isAdmin: user?.role === 'admin',
      clearError: () => setError(null),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context; 
};