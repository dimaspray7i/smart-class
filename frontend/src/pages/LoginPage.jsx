import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Call login from context
    const result = await login(email, password);
    
    if (result.success) {
      //  Handle redirect HERE based on role
      const role = result.role;
      
      if (role === 'siswa') {
        navigate('/dashboard/student', { replace: true });
      } else if (role === 'guru') {
        navigate('/dashboard/teacher', { replace: true });
      } else if (role === 'admin') {
        navigate('/dashboard/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setError(result.error || 'Login gagal. Silakan coba lagi.');
    }
    
    setLoading(false);
  };

  // Clear error when user starts typing
  const handleChange = () => {
    if (error) clearError();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-4 py-12">
      <div className="card w-full max-w-md p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            RPL Smart Ecosystem
          </h1>
          <p className="text-gray-600 dark:text-dark-muted mt-2 text-sm">
            Platform pembelajaran jurusan RPL
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" onChange={handleChange}>
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm animate-fade-in">
              {error}
            </div>
          )}
          
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="email@rpl.id"
              required
              autoComplete="email"
            />
          </div>
          
          {/* Password Field */}
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="text-center pt-4 border-t border-gray-200 dark:border-dark-border">
          <p className="text-sm text-gray-600 dark:text-dark-muted">
            Belum punya akun? Hubungi administrator.
          </p>
          <p className="text-xs text-gray-500 dark:text-dark-muted mt-2">
            Default Admin: admin@rpl.id / password123
          </p>
        </div>
      </div>
    </div>
  );
}