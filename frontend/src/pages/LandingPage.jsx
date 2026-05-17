import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Code, Users, TrendingUp, CalendarCheck,
  Sparkles, Star, Zap, Rocket, Shield, School, BookOpen,
  MapPin, Camera, QrCode, Smartphone, Wifi, Bluetooth,
  GitBranch as Github, Globe2 as Globe, Smartphone as MobileDevice, Fingerprint,
  ChevronRight, ChevronDown, Menu, X, Sun, Moon,
  Play, Award, Heart, MessageCircle, Share2, ExternalLink,
  Calendar, Clock, CheckCircle2, AlertCircle, Info
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95, rotate: -1 },
  visible: { 
    opacity: 1, y: 0, scale: 1, rotate: 0,
    transition: { type: "spring", stiffness: 100, damping: 15, mass: 0.1 } 
  },
  hover: { y: -6, scale: 1.02, transition: { duration: 0.2 } }
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
    y: [0, -15, 0],
    rotate: [0, 4, -4, 0],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
  }
};

const pulseVariants = {
  animate: {
    scale: [1, 1.08, 1],
    boxShadow: [
      '0 0 0px rgba(255,92,0,0)',
      '0 0 25px rgba(255,92,0,0.5)',
      '0 0 0px rgba(255,92,0,0)'
    ],
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 }
  }
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO DECORATIVE COMPONENTS
// ═══════════════════════════════════════════════════════════

// Floating Decorative Elements for Landing
function LandingDecorations() {
  return (
    <>
      {/* Floating Stars */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          variants={floatVariants}
          animate="animate"
          className="absolute hidden lg:block"
          style={{
            top: `${5 + i * 12}%`,
            left: `${3 + i * 14}%`,
            animationDelay: `${i * 0.7}s`
          }}
        >
          <Star className={`w-${3 + (i % 4)} h-${3 + (i % 4)} text-retro-yellow fill-retro-yellow drop-shadow-retro animate-sparkle-retro`} />
        </motion.div>
      ))}
      
      {/* Floating Emojis & Icons */}
      <motion.div variants={floatVariants} animate="animate" className="absolute top-16 right-12 hidden lg:block">
        <div className="retro-smiley text-3xl animate-wobble">🚀</div>
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute bottom-40 left-16 hidden lg:block" style={{animationDelay: '1.5s'}}>
        <div className="text-3xl animate-bounce-retro">💻</div>
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute top-1/3 right-1/3 hidden xl:block" style={{animationDelay: '2.5s'}}>
        <Code className="w-10 h-10 text-retro-purple drop-shadow-retro animate-pulse" />
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute bottom-1/4 left-1/3 hidden xl:block" style={{animationDelay: '3s'}}>
        <School className="w-10 h-10 text-retro-blue drop-shadow-retro animate-pulse" />
      </motion.div>
      
      {/* Decorative Blobs with Retro Colors */}
      <div className="absolute top-1/5 left-1/5 w-48 h-48 bg-retro-orange/10 rounded-blob blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/5 right-1/5 w-40 h-40 bg-retro-blue/10 rounded-blob blur-3xl pointer-events-none animate-pulse" style={{animationDelay: '1.5s'}} />
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-retro-purple/10 rounded-blob blur-2xl pointer-events-none animate-pulse" style={{animationDelay: '2s'}} />
      <div className="absolute bottom-1/3 right-1/4 w-28 h-28 bg-retro-lime/10 rounded-blob blur-2xl pointer-events-none animate-pulse" style={{animationDelay: '2.5s'}} />
      
      {/* Corner Accents - Brutalist Style */}
      <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-retro-orange pointer-events-none" />
      <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-retro-blue pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-retro-purple pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-retro-lime pointer-events-none" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-retro-grid opacity-30 pointer-events-none" />
    </>
  );
}

// Retro Stat Card with Animation
function RetroStatCard({ value, label, icon: Icon, delay = 0 }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      whileHover="hover"
      className="retro-card bg-base-white border-4 border-base-black p-5 text-center group"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <motion.div 
        className="w-14 h-14 mx-auto mb-3 rounded-retro bg-retro-orange/20 border-2 border-retro-orange flex items-center justify-center group-hover:scale-110 transition-transform"
        whileHover={{ rotate: [0, -10, 10, -5, 5, 0] }}
        transition={{ duration: 0.4 }}
      >
        <Icon className="w-7 h-7 text-retro-orange" />
      </motion.div>
      <motion.div 
        className="retro-heading retro-heading-lg text-retro-orange mb-1"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay * 0.1 + 0.3 }}
      >
        {value}
      </motion.div>
      <p className="font-retro-mono text-xs text-base-black/70 uppercase tracking-wide">{label}</p>
      
      {/* Decorative corner */}
      <div className="absolute top-2 right-2 w-2 h-2 bg-retro-yellow border border-base-black rounded-sm rotate-45" />
    </motion.div>
  );
}

// Retro Feature Card
function RetroFeatureCard({ icon: Icon, title, description, color, delay = 0 }) {
  const colorClasses = {
    orange: 'bg-retro-orange/20 border-retro-orange text-retro-orange',
    blue: 'bg-retro-blue/20 border-retro-blue text-retro-blue',
    purple: 'bg-retro-purple/20 border-retro-purple text-retro-purple',
    lime: 'bg-retro-lime/20 border-retro-lime text-retro-lime',
    yellow: 'bg-retro-yellow/20 border-retro-yellow text-retro-yellow',
  };
  
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      whileHover="hover"
      className="retro-card bg-base-white border-4 border-base-black p-6 group"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <motion.div 
        className={`w-16 h-16 mb-5 rounded-retro border-2 flex items-center justify-center group-hover:scale-110 transition-transform ${colorClasses[color]}`}
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6 }}
      >
        <Icon className="w-8 h-8" />
      </motion.div>
      <h3 className="retro-heading retro-heading-sm text-base-black mb-3">{title}</h3>
      <p className="font-retro-mono text-sm text-base-black/70 leading-relaxed">{description}</p>
      
      {/* Hover indicator */}
      <motion.div 
        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
        initial={{ x: 10 }}
        whileHover={{ x: 0 }}
      >
        <ArrowRight className="w-5 h-5 text-retro-orange" />
      </motion.div>
      
      {/* Decorative sticker */}
      <motion.div 
        variants={stickerVariants}
        initial="hidden"
        whileInView="visible"
        className="absolute -top-2 -right-2"
      >
        <div className="retro-sticker bg-retro-yellow text-base-black text-[9px] px-2 py-0.5">BARU</div>
      </motion.div>
    </motion.div>
  );
}

// Retro Gallery Preview Card
function RetroGalleryCard({ project, delay = 0 }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      whileHover="hover"
      className="retro-card bg-base-white border-4 border-base-black overflow-hidden group cursor-pointer"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="aspect-video bg-base-gray border-b-4 border-base-black flex items-center justify-center overflow-hidden">
        {project.image ? (
          <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <Code className="w-12 h-12 text-base-black/30" />
        )}
      </div>
      <div className="p-4">
        <h4 className="font-retro-display font-black text-base-black text-sm mb-1 line-clamp-1">{project.title}</h4>
        <p className="font-retro-mono text-[10px] text-base-black/50 mb-3 line-clamp-2">{project.description}</p>
        <div className="flex items-center justify-between">
          <span className="retro-badge retro-badge-blue text-[9px]">{project.category}</span>
          <motion.span 
            className="text-retro-orange text-xs font-retro-mono flex items-center gap-1"
            whileHover={{ x: 3 }}
          >
            Lihat Detail <ArrowRight className="w-3 h-3" />
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

// Retro Testimonial Card
function RetroTestimonialCard({ testimonial, delay = 0 }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="retro-card bg-base-white border-4 border-base-black p-5"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-retro bg-retro-purple/20 border-2 border-retro-purple flex items-center justify-center flex-shrink-0">
          <span className="font-retro-display font-black text-retro-purple text-lg">{testimonial.author.charAt(0)}</span>
        </div>
        <div>
          <p className="font-retro-display font-black text-base-black text-sm">{testimonial.author}</p>
          <p className="font-retro-mono text-[9px] text-base-black/50">{testimonial.role}</p>
        </div>
      </div>
      <p className="font-retro-mono text-sm text-base-black/80 italic mb-3">"{testimonial.quote}"</p>
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-3 h-3 ${i < testimonial.rating ? 'text-retro-yellow fill-retro-yellow' : 'text-base-black/20'}`} />
        ))}
      </div>
    </motion.div>
  );
}

// Retro CTA Section
function RetroCTASection() {
  return (
    <motion.section 
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="retro-card bg-gradient-to-r from-retro-orange/10 via-retro-blue/10 to-retro-purple/10 border-4 border-base-black p-8 md:p-12 text-center relative overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-20 h-20 bg-retro-yellow/20 rounded-blob blur-xl" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-retro-lime/20 rounded-blob blur-xl" />
      
      <motion.div 
        variants={stickerVariants}
        initial="hidden"
        whileInView="visible"
        className="absolute -top-3 -left-3"
      >
        <div className="retro-sticker bg-retro-pink text-base-white text-[10px] px-3 py-1">GABUNG SEKARANG</div>
      </motion.div>
      
      <h2 className="retro-heading retro-heading-xl text-retro-orange mb-4">
        SIAP MEMULAI <span className="text-retro-blue">PERJALANAN RPL</span> KAMU?
      </h2>
      <p className="font-retro-mono text-base-black/70 mb-8 max-w-2xl mx-auto">
        Bergabunglah dengan ratusan siswa yang telah menguasai pemrograman, membangun proyek, dan mempersiapkan masa depan mereka di dunia teknologi.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <motion.div variants={pulseVariants} animate="animate">
          <Link to="/login" className="retro-btn retro-btn-lg flex items-center justify-center gap-2">
            <Rocket className="w-5 h-5" />
            Mulai Sekarang, Gratis!
          </Link>
        </motion.div>
        <Link to="/simulator" className="retro-btn retro-btn-lg retro-btn-outline flex items-center justify-center gap-2">
          Coba Simulator Karir
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
      
      <p className="font-retro-mono text-[10px] text-base-black/50 mt-6">
        ✨ Tidak perlu kartu kredit • Gratis selamanya untuk siswa
      </p>
    </motion.section>
  );
}

// Retro Footer
function RetroFooter() {
  const currentYear = new Date().getFullYear();
  
  const links = {
    Produk: ['Fitur', 'Harga', 'Simulator Karir', 'Galeri Siswa'],
    'Sumber Daya': ['Dokumentasi', 'Referensi API', 'Blog', 'Komunitas'],
    Lembaga: ['Tentang Kami', 'Karir', 'Hubungi Kami', 'Privasi'],
    Hukum: ['Ketentuan', 'Kebijakan Privasi', 'Kebijakan Cookie', 'Lisensi'],
  };
  
  return (
    <footer className="retro-card bg-base-white border-4 border-base-black mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 retro-card bg-retro-orange border-2 border-base-black flex items-center justify-center">
                <Rocket className="w-6 h-6 text-base-white" />
              </div>
              <span className="font-retro-display font-black text-base-black text-lg">RPL SMART</span>
            </div>
            <p className="font-retro-mono text-xs text-base-black/60 mb-4">
              Memberdayakan generasi talenta teknologi berikutnya melalui pembelajaran inovatif.
            </p>
            <div className="flex gap-2">
              {[Github, Globe, MessageCircle].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-8 h-8 retro-card bg-base-gray border-2 border-base-black flex items-center justify-center hover:bg-retro-yellow/20 transition-colors"
                >
                  <Icon className="w-4 h-4 text-base-black" />
                </motion.a>
              ))}
            </div>
          </div>
          
          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-retro-display font-black text-base-black text-sm mb-3">{category}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="font-retro-mono text-xs text-base-black/60 hover:text-retro-orange transition-colors flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" />
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t-2 border-base-black/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-retro-mono text-[10px] text-base-black/50">
            © {currentYear} RPL Smart Ecosystem. Dibuat dengan ❤️ & ☕
          </p>
          <div className="flex items-center gap-4">
            <span className="retro-badge retro-badge-green text-[9px]">v2.0 RETRO</span>
            <a href="#" className="font-retro-mono text-[10px] text-base-black/60 hover:text-retro-orange transition-colors">Status</a>
            <a href="#" className="font-retro-mono text-[10px] text-base-black/60 hover:text-retro-orange transition-colors">Riwayat Pembaruan</a>
          </div>
        </div>
      </div>
      
      {/* Decorative corner */}
      <motion.div 
        variants={stickerVariants}
        initial="hidden"
        whileInView="visible"
        className="absolute -bottom-3 -right-3"
      >
        <div className="retro-sticker bg-retro-lime text-base-black text-[10px] px-3 py-1">DIBUAT DENGAN RETRO ✨</div>
      </motion.div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN RETRO LANDING PAGE COMPONENT
// ═══════════════════════════════════════════════════════════
export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [keyboardHint, setKeyboardHint] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        setKeyboardHint(false);
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        document.querySelector('input[type="search"]')?.focus();
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setKeyboardHint(!keyboardHint);
      }
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate('/gallery');
      }
      if (e.key === 's' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate('/simulator');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardHint, navigate]);

  // Theme toggle with localStorage
  useEffect(() => {
    const theme = localStorage.getItem('rpl_landing_theme');
    if (theme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('rpl_landing_theme', newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Sample data for gallery preview
  const galleryProjects = [
    { id: 1, title: 'Aplikasi E-Commerce', description: 'Toko online full-stack dengan integrasi pembayaran', category: 'Web Dev', image: null },
    { id: 2, title: 'Manajer Tugas', description: 'Aplikasi produktivitas dengan sinkronisasi waktu nyata', category: 'Mobile', image: null },
    { id: 3, title: 'Chatbot AI', description: 'Asisten layanan pelanggan bertenaga NLP', category: 'AI/ML', image: null },
    { id: 4, title: 'Platform Game', description: 'Platform game multipemain dengan papan peringkat', category: 'Game Dev', image: null },
  ];

  // Sample testimonials
  const testimonials = [
    { author: 'Ahmad Rizki', role: 'Siswa, Kelas XII', quote: 'RPL Smart membantu saya mendapatkan magang pertama saya! Fitur pelacakan proyek sangat luar biasa.', rating: 5 },
    { author: 'Siti Nurhaliza', role: 'Guru, Departemen RPL', quote: 'Mengelola absensi dan kemajuan siswa kini jauh lebih mudah. Sangat direkomendasikan!', rating: 5 },
    { author: 'Budi Santoso', role: 'Alumni, Software Engineer', quote: 'Simulator karir memberi saya kejelasan tentang masa depan saya. Sekarang saya bekerja di perusahaan teknologi terkemuka!', rating: 5 },
  ];

  // ═══════════════════════════════════════════════════════════
  // 🎨 MAIN RENDER - RETRO FUTURISTIC LANDING PAGE
  // ═══════════════════════════════════════════════════════════
  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen bg-base-cream retro-grid-bg overflow-x-hidden"
    >
      {/* Background Decorations */}
      <LandingDecorations />

      {/* ═══════════════════════════════════════════════════
          🚀 HERO SECTION - RETRO STYLE
          ═══════════════════════════════════════════════════ */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 px-4">
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Animated Sticker Badge */}
          <motion.div 
            variants={stickerVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            className="inline-block mb-6"
          >
            <div className="retro-sticker bg-retro-yellow text-base-black text-xs px-4 py-1.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Selamat Datang di RPL Smart Ecosystem v2.0
            </div>
          </motion.div>
          
          {/* Main Heading */}
          <motion.h1 
            className="retro-heading retro-heading-xl md:retro-heading-2xl text-retro-orange mb-6 leading-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            RPL SMART<br />
            <span className="text-retro-blue">EKOSISTEM</span>
          </motion.h1>
          
          {/* Subheading */}
          <motion.p 
            className="font-retro-mono text-base-black/70 text-lg md:text-xl mb-10 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Platform pembelajaran jurusan RPL yang modern, terintegrasi, dan siap untuk masa depan. 
            Kelola absensi, track project, dan eksplorasi karir tech kamu dalam satu tempat.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div variants={pulseVariants} animate="animate">
              <Link to="/simulator" className="retro-btn retro-btn-lg flex items-center justify-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Coba Simulator Karir
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
            <Link to="/login" className="retro-btn retro-btn-lg retro-btn-outline flex items-center justify-center gap-2">
              Masuk ke Dashboard
            </Link>
          </motion.div>
          
          {/* Trust Badges */}
          <motion.div 
            className="flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {['🔐 Aman', '⚡ Cepat', '🎨 UI Retro', '📱 Siap Mobile'].map((badge, i) => (
              <span key={i} className="retro-badge retro-badge-blue text-[10px] px-3 py-1">
                {badge}
              </span>
            ))}
          </motion.div>
        </div>
        
        {/* Floating decorative elements in hero */}
        <motion.div 
          variants={floatVariants}
          animate="animate"
          className="absolute top-10 right-10 hidden lg:block"
        >
          <div className="w-16 h-16 retro-card bg-retro-purple/20 border-2 border-retro-purple flex items-center justify-center">
            <Code className="w-8 h-8 text-retro-purple" />
          </div>
        </motion.div>
        <motion.div 
          variants={floatVariants}
          animate="animate"
          className="absolute bottom-10 left-10 hidden lg:block"
          style={{ animationDelay: '2s' }}
        >
          <div className="w-14 h-14 retro-card bg-retro-lime/20 border-2 border-retro-lime flex items-center justify-center">
            <School className="w-7 h-7 text-retro-lime" />
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════
          📊 STATS SECTION - RETRO STYLE
          ═══════════════════════════════════════════════════ */}
      <motion.section 
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-16 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div 
            variants={cardVariants}
            className="retro-card bg-base-white border-4 border-base-black p-6 md:p-8"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { value: '450+', label: 'Siswa Aktif', icon: Users, delay: 0 },
                { value: '32', label: 'Guru Pengajar', icon: Users, delay: 100 },
                { value: '120+', label: 'Proyek Dibuat', icon: Code, delay: 200 },
                { value: '15', label: 'Jalur Kompetensi', icon: TrendingUp, delay: 300 },
              ].map((stat, index) => (
                <RetroStatCard key={index} {...stat} />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════
          ✨ FEATURES SECTION - RETRO STYLE
          ═══════════════════════════════════════════════════ */}
      <motion.section 
        id="features"
        variants={pageVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-16 px-4"
      >
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div 
            variants={cardVariants}
            className="text-center mb-12"
          >
            <span className="retro-badge retro-badge-yellow text-[10px] px-3 py-1 mb-4 inline-block">FITUR UNGGULAN</span>
            <h2 className="retro-heading retro-heading-xl text-retro-orange mb-3">
              Fitur <span className="text-retro-blue">Unggulan Kami</span>
            </h2>
            <p className="font-retro-mono text-base-black/70 max-w-2xl mx-auto">
              Semua hal yang kamu butuhkan untuk sukses di jurusan RPL, dalam satu platform retro-futuristik.
            </p>
          </motion.div>
          
          {/* Features Grid */}
          <motion.div 
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: CalendarCheck,
                title: 'Absensi Pintar',
                description: 'Absensi harian dengan validasi lokasi GPS, foto selfie real-time, dan anti-fake GPS protection.',
                color: 'orange',
                delay: 0,
              },
              {
                icon: Code,
                title: 'Pelacakan Proyek',
                description: 'Kelola dan track progress project coding kamu dengan Git integration dan collaborative tools.',
                color: 'blue',
                delay: 100,
              },
              {
                icon: TrendingUp,
                title: 'Analisis Kompetensi',
                description: 'Track dan visualisasi perkembangan skill programming kamu dengan interactive charts & badges.',
                color: 'purple',
                delay: 200,
              },
              {
                icon: MapPin,
                title: 'Manajemen PKL',
                description: 'Kelola penempatan PKL, absensi lokasi, dan laporan mingguan dalam satu dashboard terintegrasi.',
                color: 'lime',
                delay: 300,
              },
              {
                icon: QrCode,
                title: 'Absensi QR Code',
                description: 'Scan QR code animated untuk absensi cepat dengan expired timer dan random generation.',
                color: 'yellow',
                delay: 400,
              },
              {
                icon: Shield,
                title: 'Keamanan & Privasi',
                description: 'Data kamu aman dengan enkripsi end-to-end, 2FA, dan compliance dengan standar privasi.',
                color: 'orange',
                delay: 500,
              },
            ].map((feature, index) => (
              <RetroFeatureCard key={index} {...feature} />
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════
          🎨 GALLERY PREVIEW SECTION - RETRO STYLE
          ═══════════════════════════════════════════════════ */}
      <motion.section 
        variants={pageVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-16 px-4 bg-base-gray/30"
      >
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div 
            variants={cardVariants}
            className="text-center mb-12"
          >
            <span className="retro-badge retro-badge-purple text-[10px] px-3 py-1 mb-4 inline-block">KARYA SISWA</span>
            <h2 className="retro-heading retro-heading-xl text-retro-orange mb-3">
              Galeri <span className="text-retro-blue">Siswa</span>
            </h2>
            <p className="font-retro-mono text-base-black/70 max-w-2xl mx-auto">
              Eksplorasi proyek luar biasa yang dibangun oleh siswa RPL kami. Dapatkan inspirasi untuk ide besarmu berikutnya!
            </p>
          </motion.div>
          
          {/* Gallery Grid */}
          <motion.div 
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {galleryProjects.map((project, index) => (
              <RetroGalleryCard key={project.id} project={project} delay={index * 100} />
            ))}
          </motion.div>
          
          {/* View All Button */}
          <motion.div 
            variants={cardVariants}
            className="text-center"
          >
            <Link to="/gallery" className="retro-btn retro-btn-lg retro-btn-outline flex items-center justify-center gap-2 mx-auto">
              Lihat Semua Proyek
              <ExternalLink className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════
          💬 TESTIMONIALS SECTION - RETRO STYLE
          ═══════════════════════════════════════════════════ */}
      <motion.section 
        id="about"
        variants={pageVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-16 px-4"
      >
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div 
            variants={cardVariants}
            className="text-center mb-12"
          >
            <span className="retro-badge retro-badge-green text-[10px] px-3 py-1 mb-4 inline-block">TESTIMONI</span>
            <h2 className="retro-heading retro-heading-xl text-retro-orange mb-3">
              Dicintai oleh <span className="text-retro-blue">Siswa & Guru</span>
            </h2>
            <p className="font-retro-mono text-base-black/70 max-w-2xl mx-auto">
              Jangan hanya percaya kata kami. Inilah yang dikatakan oleh komunitas kami.
            </p>
          </motion.div>
          
          {/* Testimonials Grid */}
          <motion.div 
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            {testimonials.map((testimonial, index) => (
              <RetroTestimonialCard key={index} testimonial={testimonial} delay={index * 150} />
            ))}
          </motion.div>
          
          {/* Stats Bar */}
          <motion.div 
            variants={cardVariants}
            className="retro-card bg-base-white border-4 border-base-black p-6 flex flex-wrap justify-center items-center gap-6 md:gap-12"
          >
            {[
              { value: '4.9/5', label: 'Peringkat Rata-rata', icon: Star },
              { value: '98%', label: 'Tingkat Kepuasan', icon: Heart },
              { value: '500+', label: 'Kisah Sukses', icon: Award },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Icon className="w-5 h-5 text-retro-yellow fill-retro-yellow" />
                    <span className="retro-heading text-retro-orange">{stat.value}</span>
                  </div>
                  <p className="font-retro-mono text-xs text-base-black/60">{stat.label}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════
          🎯 CTA SECTION - RETRO STYLE
          ═══════════════════════════════════════════════════ */}
      <motion.section 
        variants={pageVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-16 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <RetroCTASection />
        </div>
      </motion.section>

    </motion.div>
  );
}