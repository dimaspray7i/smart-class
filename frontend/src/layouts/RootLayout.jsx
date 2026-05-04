import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, saveAuth, clearAuth, getAuth } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getAuth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
          clearAuth();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const res = await authAPI.login({ email, password });
      if (res?.status === 'success') {
        saveAuth(res.data.token, res.data.user);
        setUser(res.data.user);
        
        // Redirect based on role
        const role = res.data.user.role;
        if (role === 'siswa') navigate('/dashboard/student');
        else if (role === 'guru') navigate('/dashboard/teacher');
        else if (role === 'admin') navigate('/dashboard/admin');
        else navigate('/dashboard');
        
        return { success: true };
      }
      return { success: false, error: res?.message || 'Login gagal' };
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat login');
      return { success: false, error: err?.message || 'Login gagal' };
    }
  }, [navigate]);

  // Logout function - MUST BE EXPORTED!
  const logout = useCallback(async () => {
    try { 
      await authAPI.logout(); 
    } catch (e) {
      // Ignore API error, always clear local state
    }
    clearAuth();
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  // Update profile function
  const updateProfile = useCallback(async (data) => {
    try {
      const res = await authAPI.updateProfile(data);
      if (res?.status === 'success') {
        setUser(res.data);
        saveAuth(localStorage.getItem('rpl_token'), res.data);
        return { success: true };
      }
      return { success: false, error: res?.message };
    } catch (err) {
      return { success: false, error: err?.message };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      logout,        // ✅ MUST BE HERE for Navbar to work!
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};