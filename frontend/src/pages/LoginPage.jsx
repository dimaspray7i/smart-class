import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch as Github, 
  Globe2 as Globe, 
  Smartphone, 
  Fingerprint,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Star,
  CheckCircle2,
  XCircle,
  X,
  ChevronRight,
  RefreshCw,
  LogOut,
  User,
  ShieldAlert,
  Loader2,
  Terminal,
  Code2,
  Shield,
  Layout,
  ExternalLink,
  Users,
  School,
  Sparkles,
  Keyboard,
  Moon,
  Sun,
  Info,
  HelpCircle,
  Rocket
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95, rotate: -2 },
  visible: { 
    opacity: 1, y: 0, scale: 1, rotate: 0,
    transition: { type: "spring", stiffness: 100, damping: 15, mass: 0.1 } 
  }
};

const stickerVariants = {
  hidden: { scale: 0, rotate: -180, opacity: 0 },
  visible: { 
    scale: 1, rotate: 0, opacity: 1,
    transition: { type: "spring", stiffness: 200, damping: 10, delay: 0.3 } 
  },
  hover: { scale: 1.15, rotate: [0, -8, 8, -4, 4, 0], transition: { duration: 0.4 } }
};

const floatVariants = {
  animate: {
    y: [0, -12, 0],
    rotate: [0, 3, -3, 0],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }
  }
};

const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    boxShadow: [
      '0 0 0px rgba(255,92,0,0)',
      '0 0 20px rgba(255,92,0,0.4)',
      '0 0 0px rgba(255,92,0,0)'
    ],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  }
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO DECORATIVE COMPONENTS
// ═══════════════════════════════════════════════════════════

// Floating Decorative Elements
function LoginDecorations() {
  return (
    <>
      {/* Floating Stars */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          variants={floatVariants}
          animate="animate"
          className="absolute hidden lg:block"
          style={{
            top: `${10 + i * 15}%`,
            left: `${5 + i * 18}%`,
            animationDelay: `${i * 0.5}s`
          }}
        >
          <Star className={`w-${4 + (i % 3)} h-${4 + (i % 3)} text-retro-yellow fill-retro-yellow drop-shadow-retro animate-sparkle-retro`} />
        </motion.div>
      ))}
      
      {/* Floating Emojis */}
      <motion.div variants={floatVariants} animate="animate" className="absolute top-20 right-10 hidden lg:block">
        <div className="retro-smiley text-2xl animate-wobble">🚀</div>
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute bottom-32 left-10 hidden lg:block" style={{animationDelay: '1s'}}>
        <div className="retro-smiley text-2xl animate-wobble">💻</div>
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute top-1/3 right-1/4 hidden xl:block" style={{animationDelay: '2s'}}>
        <div className="text-3xl animate-bounce-retro">⚡</div>
      </motion.div>
      
      {/* Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-retro-orange/10 rounded-blob blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-retro-blue/10 rounded-blob blur-3xl pointer-events-none animate-pulse" style={{animationDelay: '1s'}} />
      <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-retro-purple/10 rounded-blob blur-2xl pointer-events-none animate-pulse" style={{animationDelay: '2s'}} />
      
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-retro-orange pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-retro-blue pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-retro-purple pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-retro-lime pointer-events-none" />
    </>
  );
}

// Retro Role Preview Card
function RolePreviewCard({ role, icon: Icon, color, description, onClick, isActive }) {
  const colorClasses = {
    admin: 'bg-retro-orange/10 border-retro-orange text-retro-orange',
    guru: 'bg-retro-blue/10 border-retro-blue text-retro-blue',
    siswa: 'bg-retro-purple/10 border-retro-purple text-retro-purple',
  };
  
  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full p-4 rounded-retro border-2 transition-all duration-300 text-left ${
        isActive 
          ? `${colorClasses[role]} shadow-[4px_4px_0px_0px_#111111]` 
          : 'bg-base-white border-base-black/30 hover:border-retro-yellow hover:bg-retro-yellow/10'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-retro ${isActive ? 'bg-base-black' : 'bg-base-gray'}`}>
          <Icon className={`w-5 h-5 ${isActive ? 'text-base-white' : colorClasses[role].split(' ')[2]}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-retro-display font-black text-sm capitalize ${isActive ? 'text-base-black' : 'text-base-black/80'}`}>
            {role}
          </p>
          <p className="font-retro-mono text-[9px] text-base-black/50 truncate">{description}</p>
        </div>
        {isActive && <CheckCircle2 className="w-5 h-5 text-success animate-pulse" />}
      </div>
    </motion.button>
  );
}

// Retro Input Field with Glow
function RetroLoginInput({ label, name, type = "text", value, onChange, error, required, placeholder, icon: Icon, showToggle, onToggle, show }) {
  const [focused, setFocused] = useState(false);
  
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-black uppercase tracking-wider text-base-black">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
          {required && <span className="text-retro-orange">*</span>}
        </span>
      </label>
      <div className="relative">
        <input
          type={showToggle ? (show ? 'text' : 'password') : type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full px-4 py-3 rounded-retro bg-base-white border-2 border-base-black transition-all duration-300 text-base-black placeholder-base-black/40 focus:outline-none font-retro-mono text-sm ${
            focused 
              ? 'border-retro-orange shadow-[4px_4px_0px_0px_#FF5C00]' 
              : 'hover:border-retro-blue'
          } ${error ? 'border-danger shadow-[4px_4px_0px_0px_#FF1744]' : ''} ${showToggle ? 'pr-10' : ''}`}
          required={required}
          placeholder={placeholder}
          autoComplete={name}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-base-black/50 hover:text-retro-orange transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-danger text-[9px] font-retro-mono">{error}</p>}
    </div>
  );
}

// Retro Demo Credentials Modal
function DemoCredentialsModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  
  const demos = [
    { role: 'admin', email: 'rplsmkn1@gmail.com', pass: 'rpljuara', desc: 'Full access to all features' },
    { role: 'guru', email: 'guru@rpl.id', pass: 'guru123', desc: 'Manage classes & attendance' },
    { role: 'siswa', email: 'siswa@rpl.id', pass: 'siswa123', desc: 'Submit attendance & projects' },
  ];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-base-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.8, opacity: 0, rotate: 5 }}
        className="relative retro-card bg-base-white border-4 border-base-black p-6 max-w-md w-full z-10"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="retro-heading retro-heading-sm text-base-black flex items-center gap-2">
            <Terminal className="w-5 h-5 text-retro-orange" />
            DEMO CREDENTIALS
          </h3>
          <button onClick={onClose} className="retro-btn retro-btn-sm p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          {demos.map((demo, i) => (
            <motion.div 
              key={demo.role}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 rounded-retro bg-base-gray border-2 border-base-black/30"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-retro-display font-black text-sm capitalize text-retro-orange">{demo.role}</span>
                <span className="retro-badge retro-badge-blue text-[9px]">Click to Copy</span>
              </div>
              <div className="space-y-1 font-retro-mono text-xs">
                <p><span className="text-base-black/50">Email:</span> <span className="text-base-black">{demo.email}</span></p>
                <p><span className="text-base-black/50">Pass:</span> <span className="text-base-black">{demo.pass}</span></p>
              </div>
              <p className="font-retro-mono text-[9px] text-base-black/50 mt-2">{demo.desc}</p>
            </motion.div>
          ))}
        </div>
        
        <p className="font-retro-mono text-[9px] text-base-black/50 mt-4 text-center">
          ⚠️ For demo purposes only. Change passwords in production!
        </p>
        
        <div className="absolute -top-3 -right-3 retro-sticker bg-retro-yellow text-base-black text-[10px] px-2 py-0.5">
          TRY ME!
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN RETRO LOGIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [keyboardHint, setKeyboardHint] = useState(false);
  
  const { login, clearError } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowDemoModal(false);
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        document.getElementById('email')?.focus();
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setKeyboardHint(!keyboardHint);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardHint]);

  // Load saved credentials
  useEffect(() => {
    const saved = localStorage.getItem('rpl_remember');
    if (saved) {
      try {
        const { email: savedEmail, role } = JSON.parse(saved);
        setEmail(savedEmail || '');
        setSelectedRole(role || null);
        setRememberMe(true);
      } catch (e) { console.error('Failed to load saved credentials'); }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      const role = result.role;
      setSelectedRole(role);
      
      // Save last login
      localStorage.setItem('rpl_last_login', JSON.stringify({ email, role, timestamp: Date.now() }));
      
      // Redirect based on role
      const redirects = {
        siswa: '/dashboard/student',
        guru: '/dashboard/teacher', 
        admin: '/dashboard/admin',
      };
      navigate(redirects[role] || '/dashboard', { replace: true });
    } else {
      setError(result.error || 'Login failed. Please try again.');
      // Retro shake animation on error
      const card = document.querySelector('.login-card');
      if (card) {
        card.style.animation = 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both';
        setTimeout(() => card.style.animation = '', 500);
      }
    }
    
    setLoading(false);
  };

  const handleChange = useCallback(() => {
    if (error) clearError();
  }, [error, clearError]);

  const handleDemoLogin = (demo) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    setSelectedRole(demo.role);
    setShowDemoModal(false);
    // Auto-focus password field
    setTimeout(() => document.getElementById('password')?.focus(), 100);
  };

  // ═══════════════════════════════════════════════════════════
  // 🎨 MAIN RENDER - RETRO FUTURISTIC LOGIN
  // ═══════════════════════════════════════════════════════════
  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen bg-base-cream retro-grid-bg overflow-hidden"
    >
      {/* Background Decorations */}
      <LoginDecorations />
      
      {/* Back to Home Button */}
      <Link 
        to="/"
        className="fixed top-4 left-4 z-50 retro-btn retro-btn-sm p-2 flex items-center gap-2"
        title="Back to Home"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden md:inline font-retro-mono text-xs">Home</span>
      </Link>
      
      {/* Theme Toggle */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 180 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 retro-btn retro-btn-sm p-2"
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </motion.button>

      {/* Keyboard Hint */}
      <AnimatePresence>
        {keyboardHint && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 retro-card bg-base-white border-2 border-base-black px-4 py-2 flex items-center gap-3"
          >
            <Keyboard className="w-4 h-4 text-retro-orange" />
            <span className="font-retro-mono text-xs text-base-black">
              Press <kbd className="px-1.5 py-0.5 rounded-sm bg-base-gray border border-base-black font-retro-mono">/</kbd> to focus email • 
              <kbd className="px-1.5 py-0.5 rounded-sm bg-base-gray border border-base-black font-retro-mono ml-1">?</kbd> for shortcuts
            </span>
            <button onClick={() => setKeyboardHint(false)} className="ml-2 p-1 hover:bg-base-gray rounded-sm">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <motion.div
          variants={cardVariants}
          className="login-card retro-card bg-base-white border-4 border-base-black p-6 md:p-8 w-full max-w-md"
        >
          {/* Header with Logo */}
          <div className="text-center mb-6">
            <motion.div 
              variants={stickerVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              className="inline-block mb-3"
            >
              <div className="w-20 h-20 retro-card bg-retro-orange border-2 border-base-black flex items-center justify-center">
                <Rocket className="w-10 h-10 text-base-white animate-pulse" />
              </div>
            </motion.div>
            
            <h1 className="retro-heading retro-heading-lg text-retro-orange mb-1">
              RPL SMART
            </h1>
            <p className="font-retro-mono text-sm text-base-black/70">
              Login to your account
            </p>
            
            {/* Version Badge */}
            <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 rounded-retro bg-retro-blue/10 border-2 border-retro-blue">
              <Sparkles className="w-3 h-3 text-retro-blue" />
              <span className="font-retro-mono text-[9px] text-retro-blue">v2.0 RETRO</span>
            </div>
          </div>

          {/* Role Preview Cards */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <RolePreviewCard 
              role="admin" 
              icon={Shield} 
              color="orange"
              description="System admin"
              onClick={() => setSelectedRole('admin')}
              isActive={selectedRole === 'admin'}
            />
            <RolePreviewCard 
              role="guru" 
              icon={Users} 
              color="blue"
              description="Teacher"
              onClick={() => setSelectedRole('guru')}
              isActive={selectedRole === 'guru'}
            />
            <RolePreviewCard 
              role="siswa" 
              icon={School} 
              color="purple"
              description="Student"
              onClick={() => setSelectedRole('siswa')}
              isActive={selectedRole === 'siswa'}
            />
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" onChange={handleChange}>
            
            {/* Error Message - Retro Style */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="retro-card bg-danger/10 border-danger p-3 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                  <p className="font-retro-mono text-xs text-base-black">{error}</p>
                  <button type="button" onClick={() => setError('')} className="ml-auto p-1 hover:bg-danger/20 rounded-sm">
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <RetroLoginInput 
              label="Email" 
              name="email" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error?.email}
              required
              placeholder="email@rpl.id"
              icon={Mail}
            />

            {/* Password Field */}
            <RetroLoginInput 
              label="Password" 
              name="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error?.password}
              required
              placeholder="••••••••"
              icon={Lock}
              showToggle
              onToggle={() => setShowPassword(!showPassword)}
              show={showPassword}
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-2 border-base-black accent-retro-orange"
                />
                <span className="font-retro-mono text-xs text-base-black/70">Remember me</span>
              </label>
              <button 
                type="button"
                onClick={() => setShowDemoModal(true)}
                className="font-retro-mono text-xs text-retro-orange hover:text-retro-blue transition-colors flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                Demo login
              </button>
            </div>

            {/* Submit Button */}
            <motion.button 
              type="submit" 
              variants={pulseVariants}
              animate={loading ? undefined : "animate"}
              className="retro-btn retro-btn-lg w-full flex items-center justify-center gap-2"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-base-white border-t-transparent rounded-full"
                  />
                  <span className="font-retro-mono text-sm">Authenticating...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span className="font-retro-display font-black text-sm">LOGIN</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-base-black/20" />
            <span className="font-retro-mono text-xs text-base-black/50">OR</span>
            <div className="flex-1 h-px bg-base-black/20" />
          </div>

          {/* Social Login Placeholders (Retro Style) */}
          <div className="grid grid-cols-2 gap-3">
            <button className="retro-btn retro-btn-sm retro-btn-outline flex items-center justify-center gap-2">
              <Github className="w-4 h-4" />
              <span className="font-retro-mono text-xs">GitHub</span>
            </button>
            <button className="retro-btn retro-btn-sm retro-btn-outline flex items-center justify-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="font-retro-mono text-xs">SSO</span>
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t-2 border-base-black/20 text-center">
            <p className="font-retro-mono text-xs text-base-black/60">
              Don't have an account?
            </p>
            <p className="font-retro-mono text-xs text-base-black/80 mt-1">
              Contact your administrator to get access.
            </p>
            
            {/* Demo Credentials Hint */}
            <button 
              onClick={() => setShowDemoModal(true)}
              className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-retro bg-retro-yellow/20 border-2 border-retro-yellow hover:bg-retro-yellow/30 transition-colors"
            >
              <Info className="w-3 h-3 text-retro-orange" />
              <span className="font-retro-mono text-[10px] text-base-black">Try demo credentials</span>
              <ChevronRight className="w-3 h-3 text-retro-orange" />
            </button>
            
            {/* Keyboard Shortcut Hint */}
            <p className="font-retro-mono text-[9px] text-base-black/40 mt-4">
              Press <kbd className="px-1 py-0.5 rounded-sm bg-base-gray border border-base-black/30">/</kbd> to focus • <kbd className="px-1 py-0.5 rounded-sm bg-base-gray border border-base-black/30">?</kbd> for shortcuts
            </p>
          </div>

          {/* Decorative Corner Sticker */}
          <motion.div 
            variants={stickerVariants}
            initial="hidden"
            animate="visible"
            className="absolute -top-3 -right-3"
          >
            <div className="retro-sticker bg-retro-lime text-base-black text-[10px] px-3 py-1">
              SECURE 🔐
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Demo Credentials Modal */}
      <AnimatePresence>
        {showDemoModal && <DemoCredentialsModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />}
      </AnimatePresence>

      {/* Footer Branding */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-0 hidden md:block">
        <motion.div 
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="retro-card bg-base-white/80 backdrop-blur-sm border-2 border-base-black px-4 py-2"
        >
          <p className="font-retro-mono text-[10px] text-base-black/60">
            RPL Smart Ecosystem • Built with ❤️ & ☕ • <span className="text-retro-orange">Retro v2.0</span>
          </p>
        </motion.div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-base-white/95 backdrop-blur-sm border-t-2 border-base-black p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-retro-orange" />
            <span className="font-retro-display font-black text-base-black text-sm">RPL SMART</span>
          </div>
          <button 
            onClick={() => setShowDemoModal(true)}
            className="retro-btn retro-btn-sm retro-btn-outline text-[10px]"
          >
            Demo Login
          </button>
        </div>
      </div>
    </motion.div>
  );
}