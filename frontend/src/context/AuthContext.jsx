import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authAPI, saveAuth, clearAuth, getAuth } from '../api/auth';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO AUTH CONFIG
// ═══════════════════════════════════════════════════════════
const RETRO_CONFIG = {
  // Sound effects for auth events (optional, uncomment to enable)
  sounds: {
    login: { frequency: 880, duration: 0.1, type: 'square' },    // Retro "blip"
    logout: { frequency: 440, duration: 0.15, type: 'sine' },    // Softer "pop"
    error: { frequency: 220, duration: 0.2, type: 'sawtooth' },  // Low "buzz"
    success: { frequency: 1320, duration: 0.08, type: 'square' }, // High "ping"
  },
  
  // Keyboard shortcuts
  shortcuts: {
    logout: { key: 'l', ctrl: true, alt: false },  // Ctrl+L to logout
    profile: { key: 'p', ctrl: true, alt: false }, // Ctrl+P for profile
  },
  
  // Animation delays for state transitions
  animations: {
    loadingDelay: 300,
    successDelay: 1500,
    errorShakeDuration: 400,
  },
  
  // Storage keys (encrypted prefix for security)
  storage: {
    token: '🔐_rpl_token',
    user: '🔐_rpl_user',
    lastLogin: '🔐_rpl_last_login',
  },
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO SOUND EFFECTS (Optional - Web Audio API)
// ═══════════════════════════════════════════════════════════
const playRetroSound = (preset) => {
  try {
    // Only play if user has interacted with page (browser policy)
    if (document.hasFocus() && document.visibilityState === 'visible') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      const config = RETRO_CONFIG.sounds[preset];
      if (!config) return;
      
      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, audioCtx.currentTime);
      
      // Envelope: quick attack, exponential decay
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + config.duration);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + config.duration);
    }
  } catch (e) {
    // Silently fail - sound is optional enhancement
    console.debug('Retro sound not played:', e.message);
  }
};

// ═══════════════════════════════════════════════════════════
// 🔐 SIMPLE STORAGE ENCRYPTION (XOR-based, for obfuscation)
// ═══════════════════════════════════════════════════════════
const simpleEncrypt = (text, key = 'rpl-retro-key-2024') => {
  if (!text) return text;
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result); // Base64 encode for safe storage
};

const simpleDecrypt = (encrypted, key = 'rpl-retro-key-2024') => {
  if (!encrypted) return encrypted;
  try {
    const decoded = atob(encrypted);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return null;
  }
};

// ═══════════════════════════════════════════════════════════
// 🎯 RETRO AUTH CONTEXT
// ═══════════════════════════════════════════════════════════
const AuthContext = createContext(undefined);

/**
 * AuthProvider - Manage authentication state globally with retro enhancements
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authEvent, setAuthEvent] = useState(null); // For animated feedback

  // ═══════════════════════════════════════════════════════════
  // 🔄 INIT AUTH ON MOUNT (Retro-style verification)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    let isMounted = true;
    let authCheckTimeout;

    const initAuth = async () => {
      try {
        // Try to get stored auth with decryption
        const encryptedToken = localStorage.getItem(RETRO_CONFIG.storage.token);
        const encryptedUser = localStorage.getItem(RETRO_CONFIG.storage.user);
        
        const token = encryptedToken ? simpleDecrypt(encryptedToken) : null;
        const storedUser = encryptedUser ? JSON.parse(simpleDecrypt(encryptedUser)) : getAuth();

        // Only verify with API if we have valid auth data
        if (token && storedUser?.id) {
          try {
            // Add slight delay for retro "loading" effect
            await new Promise(resolve => {
              authCheckTimeout = setTimeout(resolve, RETRO_CONFIG.animations.loadingDelay);
            });
            
            const res = await authAPI.me();
            
            if (isMounted && res?.status === 'success' && res?.data) {
              // Token valid - update state with fresh data
              setUser(res.data);
              
              // Save with encryption
              saveAuth(token, res.data);
              localStorage.setItem(RETRO_CONFIG.storage.token, simpleEncrypt(token));
              localStorage.setItem(RETRO_CONFIG.storage.user, simpleEncrypt(JSON.stringify(res.data)));
              localStorage.setItem(RETRO_CONFIG.storage.lastLogin, new Date().toISOString());
              
              // Play success sound & show event
              playRetroSound('success');
              setAuthEvent({ type: 'verified', message: 'Welcome back! ✨' });
            } else {
              // Token invalid or user not found
              if (isMounted) {
                clearAuth();
                setUser(null);
                playRetroSound('error');
                setAuthEvent({ type: 'expired', message: 'Session expired. Please login again.' });
              }
            }
          } catch (apiError) {
            // API call failed (401, network error, etc.)
            console.warn('🔐 Auth verification failed:', apiError?.message);
            if (isMounted) {
              clearAuth();
              setUser(null);
              playRetroSound('error');
              setAuthEvent({ type: 'error', message: 'Connection issue. Please check your internet.' });
            }
          }
        } else {
          // No valid auth data - guest mode
          if (isMounted) {
            clearAuth();
            setUser(null);
          }
        }
      } catch (initError) {
        // Catch unexpected errors
        console.error('🔐 Auth initialization error:', initError);
        if (isMounted) {
          clearAuth();
          setUser(null);
          playRetroSound('error');
          setAuthEvent({ type: 'error', message: 'Auth system error. Please refresh.' });
        }
      } finally {
        // Always set loading to false when mounted
        if (isMounted) {
          // Clear any pending timeout
          if (authCheckTimeout) clearTimeout(authCheckTimeout);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Keyboard shortcuts for auth actions
    const handleKeyDown = (e) => {
      if (!user) return; // Only for authenticated users
      
      const { logout, profile } = RETRO_CONFIG.shortcuts;
      
      // Ctrl+L to logout
      if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === logout.key) {
        e.preventDefault();
        handleQuickLogout();
      }
      
      // Ctrl+P for profile (could navigate to profile page)
      if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === profile.key) {
        e.preventDefault();
        // Could trigger profile modal or navigation here
        setAuthEvent({ type: 'info', message: 'Opening profile... 🎮' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      isMounted = false;
      if (authCheckTimeout) clearTimeout(authCheckTimeout);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Clear auth event after delay
  useEffect(() => {
    if (authEvent) {
      const timer = setTimeout(() => setAuthEvent(null), RETRO_CONFIG.animations.successDelay);
      return () => clearTimeout(timer);
    }
  }, [authEvent]);

  // ═══════════════════════════════════════════════════════════
  // 🔑 LOGIN FUNCTION (Retro-enhanced)
  // ═══════════════════════════════════════════════════════════
  const login = useCallback(async (email, password) => {
    setError(null);
    setAuthEvent({ type: 'loading', message: 'Authenticating... 🚀' });
    
    try {
      const res = await authAPI.login({ email, password });
      
      if (res?.status === 'success' && res?.data?.token && res?.data?.user) {
        const { token, user: userData } = res.data;
        
        // Save with encryption
        saveAuth(token, userData);
        localStorage.setItem(RETRO_CONFIG.storage.token, simpleEncrypt(token));
        localStorage.setItem(RETRO_CONFIG.storage.user, simpleEncrypt(JSON.stringify(userData)));
        localStorage.setItem(RETRO_CONFIG.storage.lastLogin, new Date().toISOString());
        
        // Update state
        setUser(userData);
        
        // Play success sound & show event
        playRetroSound('login');
        setAuthEvent({ type: 'success', message: `Welcome, ${userData.name}! ✨`, role: userData.role });
        
        return { 
          success: true, 
          role: userData.role,
          user: userData,
          message: res.message || 'Login berhasil! 🎮',
          retro: { badge: 'AUTHENTICATED', sparkle: true }
        };
      }
      
      // Login failed with error message from backend
      playRetroSound('error');
      setAuthEvent({ type: 'error', message: res?.message || 'Login gagal' });
      
      return { 
        success: false, 
        error: res?.message || 'Login gagal',
        code: res?.code,
        retro: { shake: true, hint: 'Check your credentials! 🔍' }
      };
      
    } catch (err) {
      // Network error or unexpected error
      const errorMsg = err?.message || err?.response?.data?.message || 'Terjadi kesalahan koneksi';
      const errorCode = err?.code || err?.response?.data?.code || 'NETWORK_ERROR';
      
      setError(errorMsg);
      playRetroSound('error');
      setAuthEvent({ type: 'error', message: errorMsg, code: errorCode });
      
      return { 
        success: false, 
        error: errorMsg,
        code: errorCode,
        retro: { offline: true, hint: 'Check your connection! 📡' }
      };
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 🚪 LOGOUT FUNCTION (Retro-enhanced)
  // ═══════════════════════════════════════════════════════════
  const logout = useCallback(async () => {
    setAuthEvent({ type: 'loading', message: 'Signing out... 👋' });
    
    try { 
      // Try to notify backend (but don't fail if it errors)
      await authAPI.logout().catch(() => {}); 
    } catch (e) {
      console.warn('🔐 Logout API call failed (continuing anyway):', e);
    } finally {
      // Always clear local auth data (with encryption cleanup)
      clearAuth();
      localStorage.removeItem(RETRO_CONFIG.storage.token);
      localStorage.removeItem(RETRO_CONFIG.storage.user);
      
      setUser(null);
      setError(null);
      
      // Play logout sound & show event
      playRetroSound('logout');
      setAuthEvent({ type: 'logout', message: 'See you soon! ✨' });
      
      // Force redirect to login with slight delay for animation
      setTimeout(() => {
        window.location.replace('/login');
      }, 300);
    }
  }, []);

  // Quick logout for keyboard shortcut
  const handleQuickLogout = useCallback(() => {
    if (window.confirm('🎮 Quick Logout!\n\nAre you sure you want to sign out?')) {
      logout();
    }
  }, [logout]);

  // ═══════════════════════════════════════════════════════════
  // ✏️ UPDATE PROFILE FUNCTION (Retro-enhanced)
  // ═══════════════════════════════════════════════════════════
  const updateProfile = useCallback(async (data) => {
    setAuthEvent({ type: 'loading', message: 'Updating profile... ✏️' });
    
    try {
      const res = await authAPI.updateProfile(data);
      
      if (res?.status === 'success' && res?.data) {
        // Update local state and storage (with encryption)
        setUser(res.data);
        const currentToken = localStorage.getItem(RETRO_CONFIG.storage.token);
        if (currentToken) {
          const token = simpleDecrypt(currentToken);
          if (token) {
            saveAuth(token, res.data);
            localStorage.setItem(RETRO_CONFIG.storage.user, simpleEncrypt(JSON.stringify(res.data)));
          }
        }
        
        // Play success sound & show event
        playRetroSound('success');
        setAuthEvent({ type: 'success', message: 'Profile updated! ✨' });
        
        return { success: true, user: res.data, message: res.message, retro: { badge: 'UPDATED' } };
      }
      
      playRetroSound('error');
      setAuthEvent({ type: 'error', message: res?.message || 'Gagal update profil' });
      
      return { success: false, error: res?.message || 'Gagal update profil' };
      
    } catch (err) {
      const errorMsg = err?.message || err?.response?.data?.message || 'Gagal update profil';
      
      playRetroSound('error');
      setAuthEvent({ type: 'error', message: errorMsg });
      
      return { success: false, error: errorMsg };
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 🎨 MEMOIZED CONTEXT VALUE (Prevents unnecessary re-renders)
  // ═══════════════════════════════════════════════════════════
  const contextValue = useMemo(() => ({
    // Core state
    user,
    loading,
    error,
    
    // Actions
    login,
    logout,
    updateProfile,
    
    // Auth event for animated feedback
    authEvent,
    clearAuthEvent: () => setAuthEvent(null),
    
    // Computed booleans for easy role checks
    isAuthenticated: !!user,
    isStudent: user?.role === 'siswa',
    isTeacher: user?.role === 'guru',
    isAdmin: user?.role === 'admin',
    
    // Helper to clear error state
    clearError: () => setError(null),
    
    // Retro metadata
    retro: {
      version: '2.0.0',
      theme: 'retro-futuristic',
      shortcuts: RETRO_CONFIG.shortcuts,
      sounds: Object.keys(RETRO_CONFIG.sounds),
    },
    
    // Debug info (dev only)
    _debug: process.env.NODE_ENV === 'development' ? {
      tokenExists: !!localStorage.getItem(RETRO_CONFIG.storage.token),
      lastLogin: localStorage.getItem(RETRO_CONFIG.storage.lastLogin),
    } : undefined,
  }), [user, loading, error, login, logout, updateProfile, authEvent]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 * @throws Error if used outside AuthProvider
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('🔐 useAuth must be used within an AuthProvider\n\nWrap your app with:\n<AuthProvider>\n  <App />\n</AuthProvider>');
  }
  
  return context; 
};