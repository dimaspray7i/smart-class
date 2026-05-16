import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  GitBranch as Github, Globe2 as Globe, Mail, MessageCircle, Heart, Rocket, 
  ChevronRight, ArrowUp, ShieldCheck, Zap, Star,
  ExternalLink, Send, CheckCircle2, AlertCircle
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const footerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

const linkGroupVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({ 
    opacity: 1, 
    x: 0,
    transition: { delay: i * 0.1, duration: 0.4 }
  })
};

const stickerVariants = {
  hover: { 
    scale: 1.1, 
    rotate: [0, -5, 5, -3, 3, 0],
    transition: { duration: 0.3 }
  }
};

const pulseVariants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.7, 1, 0.7],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  }
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO DECORATIVE COMPONENTS
// ═══════════════════════════════════════════════════════════

// Retro Social Icon Button
function RetroSocialButton({ icon: Icon, href, label, color = 'orange' }) {
  const colorClasses = {
    orange: 'hover:bg-retro-orange/20 hover:border-retro-orange hover:text-retro-orange',
    blue: 'hover:bg-retro-blue/20 hover:border-retro-blue hover:text-retro-blue',
    purple: 'hover:bg-retro-purple/20 hover:border-retro-purple hover:text-retro-purple',
    lime: 'hover:bg-retro-lime/20 hover:border-retro-lime hover:text-retro-lime',
  };

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.1, y: -3 }}
      whileTap={{ scale: 0.95 }}
      className={`w-10 h-10 retro-card bg-base-white border-2 border-base-black flex items-center justify-center text-base-black/60 transition-colors ${colorClasses[color]}`}
      aria-label={label}
      title={label}
    >
      <Icon className="w-5 h-5" />
    </motion.a>
  );
}

// Retro Link Item with Arrow
function RetroLinkItem({ to, label, external = false }) {
  const Component = external ? 'a' : Link;
  const props = external ? { href: to, target: "_blank", rel: "noopener noreferrer" } : { to };

  return (
    <li>
      <Component 
        {...props}
        className="group flex items-center gap-2 font-retro-mono text-xs text-base-black/60 hover:text-retro-orange transition-colors py-1"
      >
        <ChevronRight className="w-3 h-3 text-base-black/30 group-hover:text-retro-orange transition-colors" />
        <span>{label}</span>
        {external && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
      </Component>
    </li>
  );
}

// Retro Newsletter Input
function RetroNewsletterInput() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 3000);
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email..."
            disabled={status === 'loading' || status === 'success'}
            className="w-full px-3 py-2 rounded-retro bg-base-white border-2 border-base-black text-base-black text-xs font-retro-mono focus:outline-none focus:border-retro-orange disabled:opacity-50"
          />
          {status === 'success' && (
            <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
          )}
        </div>
        <motion.button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="retro-btn retro-btn-sm bg-retro-orange hover:bg-retro-orange/90 text-base-white flex items-center justify-center disabled:opacity-50"
        >
          {status === 'loading' ? (
            <div className="w-4 h-4 border-2 border-base-white border-t-transparent rounded-full animate-spin" />
          ) : status === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </motion.button>
      </div>
      {status === 'success' && (
        <p className="text-[10px] text-success mt-1 font-retro-mono">Thanks for subscribing! ✨</p>
      )}
    </form>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN RETRO FOOTER COMPONENT
// ═══════════════════════════════════════════════════════════
export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = {
    Product: [
      { label: 'Features', to: '#features' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Career Simulator', to: '/simulator' },
      { label: 'Student Gallery', to: '/gallery' },
    ],
    Resources: [
      { label: 'Documentation', to: '/docs', external: true },
      { label: 'API Reference', to: '/api/docs', external: true },
      { label: 'Community', to: '/community' },
      { label: 'Blog', to: '/blog' },
    ],
    Company: [
      { label: 'About Us', to: '/about' },
      { label: 'Careers', to: '/careers' },
      { label: 'Contact', to: '/contact' },
      { label: 'Partners', to: '/partners' },
    ],
    Legal: [
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Cookie Policy', to: '/cookies' },
      { label: 'Licenses', to: '/licenses' },
    ],
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.footer 
      variants={footerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="relative bg-base-cream retro-grid-bg border-t-4 border-base-black pt-16 pb-8 overflow-hidden"
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-retro-orange via-retro-blue to-retro-purple" />
      <div className="absolute top-10 right-10 w-32 h-32 bg-retro-yellow/10 rounded-blob blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-24 h-24 bg-retro-lime/10 rounded-blob blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 retro-card bg-retro-orange border-2 border-base-black flex items-center justify-center"
              >
                <Rocket className="w-6 h-6 text-base-white" />
              </motion.div>
              <span className="font-retro-display font-black text-base-black text-xl group-hover:text-retro-orange transition-colors">
                RPL SMART
              </span>
            </Link>
            
            <p className="font-retro-mono text-xs text-base-black/60 mb-6 leading-relaxed">
              Empowering the next generation of tech talent through innovative, retro-futuristic learning experiences.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-2 mb-6">
              <RetroSocialButton icon={Github} href="https://github.com/rpl-smart" label="GitHub" color="purple" />
              <RetroSocialButton icon={Globe} href="https://rpl-smart.local" label="Website" color="blue" />
              <RetroSocialButton icon={MessageCircle} href="#" label="Discord" color="orange" />
              <RetroSocialButton icon={Mail} href="mailto:support@rpl-smart.local" label="Email" color="lime" />
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 p-2 rounded-retro bg-base-white border-2 border-base-black inline-flex">
              <motion.div 
                variants={pulseVariants}
                animate="animate"
                className="w-2 h-2 rounded-full bg-success"
              />
              <span className="font-retro-mono text-[10px] text-base-black/70">All Systems Operational</span>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(links).map(([category, items], index) => (
            <motion.div 
              key={category}
              variants={linkGroupVariants}
              custom={index + 1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <h4 className="font-retro-display font-black text-base-black text-sm mb-4 uppercase tracking-wide">
                {category}
              </h4>
              <ul className="space-y-1">
                {items.map((item) => (
                  <RetroLinkItem key={item.label} {...item} />
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="border-t-2 border-base-black/20 pt-8 pb-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-retro-display font-black text-base-black text-lg mb-2">
                Stay in the Loop 🚀
              </h3>
              <p className="font-retro-mono text-xs text-base-black/60">
                Get the latest updates, features, and retro news delivered to your inbox. No spam, just pixels.
              </p>
            </div>
            <div className="md:justify-self-end w-full max-w-md">
              <RetroNewsletterInput />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t-2 border-base-black/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Copyright */}
          <div className="flex items-center gap-2 text-center md:text-left">
            <p className="font-retro-mono text-[10px] text-base-black/50">
              © {currentYear} RPL Smart Ecosystem. Built with ❤️ & ☕
            </p>
            <span className="hidden md:inline text-base-black/30">|</span>
            <span className="font-retro-mono text-[10px] text-base-black/50">
              v2.0.0-retro
            </span>
          </div>

          {/* Bottom Links */}
          <div className="flex items-center gap-4">
            <button 
              onClick={scrollToTop}
              className="flex items-center gap-1 font-retro-mono text-[10px] text-base-black/60 hover:text-retro-orange transition-colors"
            >
              Back to Top <ArrowUp className="w-3 h-3" />
            </button>
            <a href="/sitemap.xml" className="font-retro-mono text-[10px] text-base-black/60 hover:text-retro-orange transition-colors">
              Sitemap
            </a>
          </div>
        </div>
      </div>

      {/* Decorative Sticker Badge */}
      <motion.div 
        variants={stickerVariants}
        whileHover="hover"
        className="absolute -top-3 -right-3 md:right-10"
      >
        <div className="retro-sticker bg-retro-pink text-base-white text-[10px] px-3 py-1 rotate-3 shadow-[2px_2px_0px_0px_#111111]">
          MADE WITH RETRO ✨
        </div>
      </motion.div>
      
      {/* Corner Accent */}
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-retro-blue pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-retro-orange pointer-events-none" />
    </motion.footer>
  );
}