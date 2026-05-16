import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { 
  Plus, Search, Edit2, Trash2, KeyRound, X, Loader2, User, Mail, Lock, Phone,
  Download, Upload, Filter, MoreVertical, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Calendar, MapPin, Link as LinkIcon, ExternalLink, Image as ImageIcon,
  AlertCircle, CheckCircle2, Clock, Activity, Eye, Users, Settings,
  FileText, Copy, RefreshCw, Tag, Star, Award, TrendingUp, ChartBar as BarChart3,
  Globe2 as Globe, Smartphone, Monitor, Tablet, Wifi, Zap, MessageSquare, Bookmark,
  GitBranch, GitCommitHorizontal as GitCommit, GitPullRequest, RefreshCw as History, LogOut, Shield, Key,
  UserCheck, UserX, Users as Users2, UserPlus, FolderOpen, Package, Layers, Menu, GraduationCap, BookOpen, Smile, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS (EXPANDED)
// ═══════════════════════════════════════════════════════════
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.04, delayChildren: 0.1 } 
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, rotate: -1, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    rotate: 0,
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 120, 
      damping: 18,
      mass: 0.1 
    } 
  }
};

const stickerVariants = {
  hidden: { scale: 0, rotate: -180, opacity: 0 },
  visible: { 
    scale: 1, 
    rotate: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 15 } 
  },
  hover: { 
    scale: 1.15, 
    rotate: [0, -8, 8, -4, 4, 0],
    transition: { duration: 0.4 }
  }
};

const floatVariants = {
  animate: {
    y: [0, -12, 0],
    rotate: [0, 3, -3, 0],
    scale: [1, 1.05, 1],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }
  }
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    boxShadow: [
      '0 0 0px rgba(255,92,0,0)',
      '0 0 20px rgba(255,92,0,0.4)',
      '0 0 0px rgba(255,92,0,0)'
    ],
    transition: { duration: 2, repeat: Infinity }
  }
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO STAT WIDGET COMPONENT (NEW)
// ═══════════════════════════════════════════════════════════
function RetroStatWidget({ title, value, icon: Icon, color, trend, subtitle, onClick, badge }) {
  const colorConfig = {
    orange: { bg: 'bg-retro-orange', border: 'border-retro-orange', text: 'text-retro-orange', shadow: 'shadow-[4px_4px_0px_0px_#FF5C00]' },
    blue: { bg: 'bg-retro-blue', border: 'border-retro-blue', text: 'text-retro-blue', shadow: 'shadow-[4px_4px_0px_0px_#2E2BBF]' },
    yellow: { bg: 'bg-retro-yellow', border: 'border-retro-yellow', text: 'text-retro-yellow', shadow: 'shadow-[4px_4px_0px_0px_#FFC928]' },
    purple: { bg: 'bg-retro-purple', border: 'border-retro-purple', text: 'text-retro-purple', shadow: 'shadow-[4px_4px_0px_0px_#9D4EDD]' },
    lime: { bg: 'bg-retro-lime', border: 'border-retro-lime', text: 'text-retro-lime', shadow: 'shadow-[4px_4px_0px_0px_#B8F64E]' },
    pink: { bg: 'bg-retro-pink', border: 'border-retro-pink', text: 'text-retro-pink', shadow: 'shadow-[4px_4px_0px_0px_#FF6B9D]' },
  };

  const config = colorConfig[color] || colorConfig.orange;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, rotate: 1 }}
      onClick={onClick}
      className={`relative retro-card cursor-pointer group ${onClick ? '' : 'pointer-events-none'}`}
    >
      {badge && (
        <motion.div variants={stickerVariants} initial="hidden" animate="visible" whileHover="hover" className="absolute -top-3 -right-3 z-10">
          <div className="retro-sticker bg-retro-yellow text-base-black text-[10px] px-2 py-0.5 font-black">{badge}</div>
        </motion.div>
      )}
      <div className={`p-4 ${config.bg}/10 border-4 ${config.border} rounded-retro-lg shadow-hard transition-all duration-200 group-hover:shadow-hard-hover group-hover:-translate-x-1 group-hover:-translate-y-1`}>
        <div className="flex items-start justify-between mb-3">
          <motion.div className={`p-2.5 rounded-retro ${config.bg} border-2 border-base-black ${config.shadow}`} whileHover={{ scale: 1.15, rotate: 8 }} transition={{ type: "spring", stiffness: 400 }}>
            <Icon className="w-5 h-5 text-base-white" />
          </motion.div>
          {trend && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="retro-badge retro-badge-lime text-[9px] rotate-[3deg]">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" />{trend}%
            </motion.div>
          )}
        </div>
        <div>
          <motion.h3 className="text-2xl font-retro-display font-black text-base-black mb-0.5 leading-none" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>{value.toLocaleString('id-ID')}</motion.h3>
          <p className="text-[10px] font-black uppercase tracking-wider text-base-black/70">{title}</p>
          {subtitle && <p className="text-[9px] font-retro-mono text-base-black/50 mt-1">{subtitle}</p>}
        </div>
        <div className={`absolute bottom-2 right-2 w-2.5 h-2.5 ${config.bg} border-2 border-base-black rounded-sm rotate-45`} />
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🏷️ RETRO TAG/BADGE COMPONENT (NEW)
// ═══════════════════════════════════════════════════════════
function RetroTag({ label, color = 'orange', removable = false, onRemove, onClick }) {
  const colorConfig = {
    orange: 'bg-retro-orange text-base-white border-retro-orange',
    blue: 'bg-retro-blue text-base-white border-retro-blue',
    yellow: 'bg-retro-yellow text-base-black border-retro-yellow',
    purple: 'bg-retro-purple text-base-white border-retro-purple',
    lime: 'bg-retro-lime text-base-black border-retro-lime',
    pink: 'bg-retro-pink text-base-white border-retro-pink',
    gray: 'bg-base-gray text-base-black border-base-black',
  };
  
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 retro-badge ${colorConfig[color]} text-[10px] font-black uppercase tracking-wide cursor-pointer ${removable ? 'pr-1' : ''}`}
    >
      {label}
      {removable && (
        <button onClick={(e) => { e.stopPropagation(); onRemove?.(); }} className="hover:text-danger transition-colors ml-0.5">
          <X className="w-3 h-3" />
        </button>
      )}
    </motion.span>
  );
}

// ═══════════════════════════════════════════════════════════
// 📊 USER HEALTH SCORE COMPONENT (NEW FEATURE)
// ═══════════════════════════════════════════════════════════
function UserHealthScore({ score, attendance, profileComplete, lastActive }) {
  const getColor = (s) => s >= 80 ? 'text-success' : s >= 60 ? 'text-warning' : 'text-danger';
  const getBg = (s) => s >= 80 ? 'bg-success/20 border-success' : s >= 60 ? 'bg-warning/20 border-warning' : 'bg-danger/20 border-danger';
  
  return (
    <div className={`p-3 retro-card ${getBg(score)} border-2`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-wide text-base-black">Health Score</span>
        <motion.span className={`text-lg font-retro-display font-black ${getColor(score)}`} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>{score}</motion.span>
      </div>
      <div className="w-full bg-base-white border-2 border-base-black rounded-sm overflow-hidden h-2 mb-2">
        <motion.div className={`h-full ${score >= 80 ? 'bg-success' : score >= 60 ? 'bg-warning' : 'bg-danger'}`} initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1, delay: 0.2 }} />
      </div>
      <div className="grid grid-cols-3 gap-1 text-[9px] font-retro-mono">
        <div className="text-center"><span className="font-bold">{attendance}%</span><br/>Attend</div>
        <div className="text-center"><span className="font-bold">{profileComplete}%</span><br/>Profile</div>
        <div className="text-center"><span className="font-bold">{lastActive}</span><br/>Active</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 📱 DEVICE INFO BADGE (NEW FEATURE)
// ═══════════════════════════════════════════════════════════
function DeviceBadge({ device }) {
  const icons = { mobile: Smartphone, tablet: Tablet, desktop: Monitor, unknown: Monitor };
  const Icon = icons[device?.type] || icons.unknown;
  const colors = { mobile: 'text-retro-blue', tablet: 'text-retro-purple', desktop: 'text-retro-orange', unknown: 'text-base-black/50' };
  
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-retro-mono">
      <Icon className={`w-3 h-3 ${colors[device?.type] || colors.unknown}`} />
      {device?.name || 'Unknown'}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO INPUT COMPONENT (Enhanced)
// ═══════════════════════════════════════════════════════════
function RetroInput({ label, name, type = "text", value, onChange, error, required, disabled, placeholder, icon: Icon, helperText, suffix, prefix, maxLength, onFocus, onBlur }) {
  const [focused, setFocused] = useState(false);
  const [charCount, setCharCount] = useState(0);
  
  useEffect(() => { if (maxLength && value) setCharCount(String(value).length); }, [value, maxLength]);
  
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase tracking-wider text-base-black">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {label}
          {required && <span className="text-retro-orange">*</span>}
        </span>
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-black/50 text-[10px] font-retro-mono">{prefix}</span>}
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={(e) => { onChange(prev => ({ ...prev, [name]: e.target.value })); if (maxLength) setCharCount(e.target.value.length); }}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          maxLength={maxLength}
          className={`w-full px-4 py-2.5 retro-input text-base-black placeholder:text-base-black/40 ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-9' : ''} ${focused ? 'ring-4 ring-retro-orange/30' : ''}`}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base-black/50 text-[10px] font-retro-mono">{suffix}</span>}
        {error && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-danger" />}
      </div>
      {(helperText || (maxLength && charCount > 0)) && (
        <div className="flex justify-between items-center">
          {helperText && <p className="text-[9px] font-retro-mono text-base-black/50">{helperText}</p>}
          {maxLength && <p className={`text-[9px] font-retro-mono ${charCount > maxLength * 0.9 ? 'text-danger' : 'text-base-black/40'}`}>{charCount}/{maxLength}</p>}
        </div>
      )}
      {error && <p className="text-danger text-[9px] font-retro-mono">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO SELECT COMPONENT (Enhanced)
// ═══════════════════════════════════════════════════════════
function RetroSelect({ label, name, value, onChange, options, error, required, disabled, icon: Icon, placeholder, searchable = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm) return options;
    return options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm, searchable]);

  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase tracking-wider text-base-black">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {label}
          {required && <span className="text-retro-orange">*</span>}
        </span>
      </label>
      {searchable && (
        <div className="relative mb-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-base-black/40" />
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="retro-input pl-7 py-1.5 text-[10px]" />
        </div>
      )}
      <select name={name} value={value || ''} onChange={(e) => onChange(prev => ({ ...prev, [name]: e.target.value }))} className="retro-input w-full" required={required} disabled={disabled}>
        {placeholder && <option value="">{placeholder}</option>}
        {filteredOptions.map((opt) => (<option key={opt.value} value={opt.value} className="bg-base-cream text-base-black">{opt.label}</option>))}
      </select>
      {error && <p className="text-danger text-[9px] font-retro-mono">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO MULTI-SELECT SUBJECTS (Enhanced)
// ═══════════════════════════════════════════════════════════
function RetroSubjectMultiSelect({ label, value, onChange, subjects, error, required }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState(false);
  
  const filteredSubjects = useMemo(() => subjects.filter(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || sub.code.toLowerCase().includes(searchTerm.toLowerCase())), [subjects, searchTerm]);
  const selectedSubjects = useMemo(() => subjects.filter(sub => (value || []).includes(sub.id)), [subjects, value]);

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black uppercase tracking-wider text-base-black">{label} {required && <span className="text-retro-orange">*</span>}</label>
      
      {/* Selected Tags */}
      {selectedSubjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedSubjects.map((sub) => (
            <RetroTag key={sub.id} label={sub.code} color="purple" removable onRemove={() => onChange((value || []).filter(id => id !== sub.id))} />
          ))}
        </div>
      )}
      
      {/* Search & Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-base-black/40" />
          <input type="text" placeholder="Search subjects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="retro-input pl-8 py-2 text-[10px]" />
        </div>
        <button type="button" onClick={() => setExpanded(!expanded)} className="retro-btn retro-btn-sm retro-btn-outline flex items-center gap-1">
          {expanded ? 'Hide' : 'Show'} <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      {/* Options List */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="max-h-40 overflow-y-auto retro-card p-2 space-y-1">
              {filteredSubjects.length > 0 ? filteredSubjects.map((sub) => {
                const isSelected = (value || []).includes(sub.id);
                return (
                  <label key={sub.id} className={`flex items-center gap-2 p-2 retro-card cursor-pointer transition-all ${isSelected ? 'bg-retro-purple/20 border-retro-purple' : 'hover:bg-retro-yellow/10'}`}>
                    <input type="checkbox" checked={isSelected} onChange={(e) => { if (e.target.checked) onChange([...(value || []), sub.id]); else onChange((value || []).filter(id => id !== sub.id)); }} className="w-4 h-4 accent-retro-purple border-2 border-base-black" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-retro-display font-black text-base-black truncate">{sub.code} - {sub.name}</p>
                      {sub.description && <p className="text-[9px] font-retro-mono text-base-black/50 truncate">{sub.description}</p>}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-retro-purple" />}
                  </label>
                );
              }) : <p className="p-3 text-[10px] font-retro-mono text-base-black/50 text-center">{searchTerm ? 'No results.' : 'No subjects available.'}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="text-danger text-[9px] font-retro-mono">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🖼️ RETRO AVATAR UPLOAD (Enhanced)
// ═══════════════════════════════════════════════════════════
function RetroAvatarUpload({ value, onChange, error }) {
  const [preview, setPreview] = useState(value);
  const fileInputRef = useRef(null);
  
  useEffect(() => { if (typeof value === 'string') setPreview(value); }, [value]);
  
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { showToast('❌ Max file size 5MB', 'error'); return; }
      const reader = new FileReader();
      reader.onloadend = () => { setPreview(reader.result); onChange(file); };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black uppercase tracking-wider text-base-black flex items-center gap-1.5">
        <ImageIcon className="w-3.5 h-3.5" /> Profile Avatar
      </label>
      <div className="flex items-center gap-4">
        <motion.div whileHover={{ scale: 1.05 }} className="relative">
          <div className="w-16 h-16 retro-card bg-retro-orange/20 border-retro-orange flex items-center justify-center overflow-hidden">
            {preview ? <img src={typeof preview === 'string' ? preview : URL.createObjectURL(preview)} alt="Preview" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-retro-orange" />}
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1.5 -right-1.5 p-1.5 retro-btn retro-btn-sm bg-retro-purple hover:bg-retro-purple/90 text-base-white rounded-full shadow-[2px_2px_0px_0px_#111111]">
            <ImageIcon className="w-3 h-3" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </motion.div>
        <div className="flex-1">
          <p className="text-[10px] font-retro-mono text-base-black/70">Upload avatar (max 5MB)</p>
          <p className="text-[9px] font-retro-mono text-base-black/40">JPG, PNG, WebP • Recommended: 200x200px</p>
          {value && typeof value !== 'string' && <p className="text-[9px] font-retro-mono text-retro-orange mt-1">📁 {value.name}</p>}
        </div>
      </div>
      {error && <p className="text-danger text-[9px] font-retro-mono">{error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO CONFIRM MODAL (Enhanced)
// ═══════════════════════════════════════════════════════════
function RetroConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Yes, Proceed", cancelText = "Cancel", variant = "danger", details }) {
  if (!isOpen) return null;
  const variants = {
    danger: { icon: AlertCircle, color: 'text-danger', bg: 'bg-danger', border: 'border-danger', label: 'DANGER' },
    warning: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning', border: 'border-warning', label: 'WARNING' },
    success: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success', border: 'border-success', label: 'CONFIRM' },
  };
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`w-16 h-16 mx-auto mb-4 retro-card ${config.bg}/10 ${config.border} border-4 flex items-center justify-center`}>
          <Icon className={`w-8 h-8 ${config.color}`} />
        </motion.div>
        <h3 className="retro-heading text-base mb-2 text-base-black">{title}</h3>
        <p className="font-retro-mono text-[10px] text-base-black/70 mb-4">{message}</p>
        {details && <div className="retro-card bg-base-gray/20 p-3 mb-4 text-left"><p className="text-[10px] font-retro-mono text-base-black/70 whitespace-pre-wrap">{details}</p></div>}
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="retro-btn retro-btn-outline">{cancelText}</button>
          <button onClick={onConfirm} className={`retro-btn ${variant === 'danger' ? 'bg-danger hover:bg-danger/90' : variant === 'warning' ? 'bg-warning hover:bg-warning/90 text-base-black' : 'bg-success hover:bg-success/90'} text-base-white`}>{confirmText}</button>
        </div>
        <div className="absolute -top-3 -right-3 retro-sticker bg-retro-yellow text-base-black text-[10px] px-2 py-0.5 font-black">{config.label}</div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// 📋 DETAIL ITEM HELPER (Retro Style)
// ═══════════════════════════════════════════════════════════
function RetroDetailItem({ icon: Icon, label, value, valueClass = '', multiline = false, copyable = false }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => { if (copyable && value) { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } };
  
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="w-4 h-4 mt-0.5 text-base-black/50" />}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wider text-base-black/50">{label}</p>
        <div className="flex items-center gap-2">
          <p className={`text-sm font-retro-display font-black text-base-black ${valueClass} ${multiline ? 'whitespace-pre-wrap' : 'truncate'}`}>{value || '-'}</p>
          {copyable && value && (
            <button onClick={handleCopy} className="p-1 hover:bg-retro-yellow/30 rounded transition-colors" title="Copy">
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-base-black/40" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN COMPONENT - EXPANDED & FEATURE-RICH
// ═══════════════════════════════════════════════════════════
export default function UserManagement() {
  const queryClient = useQueryClient();
  
  // ═════════════════════════════════════════════════════════
  // STATE MANAGEMENT (EXPANDED)
  // ═════════════════════════════════════════════════════════
  const [search, setSearch] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState({ role: 'all', status: 'all', class: 'all', dateFrom: '', dateTo: '' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmBulkAction, setConfirmBulkAction] = useState(null);
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineEditField, setInlineEditField] = useState('');
  const [inlineEditValue, setInlineEditValue] = useState('');
  const [userTags, setUserTags] = useState({});
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const debouncedSearch = useMemo(() => { const t = setTimeout(() => {}, 500); return () => clearTimeout(t); }, []);

  // ═════════════════════════════════════════════════════════
  // KEYBOARD SHORTCUTS (NEW FEATURE)
  // ═════════════════════════════════════════════════════════
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'n') { e.preventDefault(); setIsCreateOpen(true); }
        if (e.key === 'e' && selectedUser) { e.preventDefault(); openEditModal(selectedUser); }
        if (e.key === 'Delete' && selectedIds.length > 0) { e.preventDefault(); handleBulkDelete(); }
      }
      if (e.key === 'Escape') { setIsCreateOpen(false); setIsEditOpen(false); setIsViewOpen(false); setConfirmDelete(null); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUser, selectedIds]);

  // ═════════════════════════════════════════════════════════
  // DATA FETCHING (EXPANDED)
  // ═════════════════════════════════════════════════════════
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['admin-users', search, advancedFilters, page, perPage, sortBy, sortOrder],
    queryFn: () => api.get('/admin/users', {
      params: { page, per_page: perPage, search: search || undefined, ...advancedFilters, sort_by: sortBy, sort_order: sortOrder }
    }),
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  useEffect(() => { if (isCreateOpen || isEditOpen) {
    api.get('/admin/subjects?all=1').then(res => setSubjects(res.data?.data || [])).catch(err => console.error('Failed to fetch subjects:', err));
    api.get('/admin/classes?all=1').then(res => setClasses(res.data?.data || [])).catch(err => console.error('Failed to fetch classes:', err));
  }}, [isCreateOpen, isEditOpen]);

  const users = data?.data?.data || [];
  const meta = data?.data?.meta || {};

  // ═════════════════════════════════════════════════════════
  // QUICK STATS CALCULATION (NEW FEATURE)
  // ═════════════════════════════════════════════════════════
  const quickStats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: meta.total || 0,
      active: users.filter(u => u.is_active).length,
      newToday: users.filter(u => new Date(u.created_at).toDateString() === today).length,
      byRole: { admin: users.filter(u => u.role === 'admin').length, guru: users.filter(u => u.role === 'guru').length, siswa: users.filter(u => u.role === 'siswa').length },
      withAvatar: users.filter(u => u.avatar_url).length,
      pklStudents: users.filter(u => u.role === 'siswa' && u.profile?.class_level === 'XII').length,
    };
  }, [users, meta]);

  // ═════════════════════════════════════════════════════════
  // TOAST NOTIFICATION HELPER
  // ═════════════════════════════════════════════════════════
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ═════════════════════════════════════════════════════════
  // MUTATIONS (EXPANDED)
  // ═════════════════════════════════════════════════════════
  const createUserMutation = useMutation({
    mutationFn: (payload) => {
      const formDataObj = new FormData();
      Object.keys(payload).forEach(key => {
        if (key === 'subjects' && Array.isArray(payload[key])) payload[key].forEach(id => formDataObj.append('subjects[]', id));
        else if (key === 'is_active') formDataObj.append(key, payload[key] ? '1' : '0');
        else if (key === 'avatar_url' && payload[key] instanceof File) formDataObj.append('avatar', payload[key]);
        else if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '' && typeof payload[key] !== 'object') formDataObj.append(key, payload[key]);
      });
      return api.post('/admin/users', formDataObj, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); setIsCreateOpen(false); setFormData({}); setErrors({}); showToast('✅ User created successfully!', 'success'); },
    onError: (err) => { setErrors(err.errors || err.response?.data?.errors || {}); showToast(`❌ ${err.message || err.response?.data?.message || 'Failed to create user'}`, 'error'); }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, ...payload }) => {
      const formDataObj = new FormData();
      formDataObj.append('_method', 'PUT');
      Object.keys(payload).forEach(key => {
        if (key === 'subjects' && Array.isArray(payload[key])) payload[key].forEach(sid => formDataObj.append('subjects[]', sid));
        else if (key === 'is_active') formDataObj.append(key, payload[key] ? '1' : '0');
        else if (key === 'avatar_url' && payload[key] instanceof File) formDataObj.append('avatar', payload[key]);
        else if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '' && typeof payload[key] !== 'object') formDataObj.append(key, payload[key]);
      });
      return api.post(`/admin/users/${id}`, formDataObj, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); setIsEditOpen(false); setSelectedUser(null); setFormData({}); setErrors({}); showToast('✅ User updated successfully!', 'success'); },
    onError: (err) => { setErrors(err.errors || err.response?.data?.errors || {}); showToast(`❌ ${err.message || err.response?.data?.message || 'Failed to update user'}`, 'error'); }
  });

  const deleteUserMutation = useMutation({ mutationFn: (id) => api.delete(`/admin/users/${id}`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); showToast('✅ User deleted!', 'success'); setConfirmDelete(null); }, onError: (err) => showToast(`❌ ${err.message || 'Failed to delete'}`, 'error') });
  const bulkDeleteMutation = useMutation({ mutationFn: (ids) => Promise.all(ids.map(id => api.delete(`/admin/users/${id}`))), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); setSelectedIds([]); showToast('✅ Selected users deleted!', 'success'); setConfirmBulkAction(null); }, onError: (err) => showToast(`❌ ${err.message || 'Bulk delete failed'}`, 'error') });
  const bulkActivateMutation = useMutation({ mutationFn: (ids) => api.post('/admin/users/bulk-activate', { ids }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); setSelectedIds([]); showToast('✅ Selected users activated!', 'success'); setConfirmBulkAction(null); }, onError: (err) => showToast(`❌ ${err.message || 'Bulk activate failed'}`, 'error') });
  const bulkDeactivateMutation = useMutation({ mutationFn: (ids) => api.post('/admin/users/bulk-deactivate', { ids }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); setSelectedIds([]); showToast('✅ Selected users deactivated!', 'success'); setConfirmBulkAction(null); }, onError: (err) => showToast(`❌ ${err.message || 'Bulk deactivate failed'}`, 'error') });
  const resetPasswordMutation = useMutation({ mutationFn: (id) => api.post(`/admin/users/${id}/reset-password`, { password: 'password123' }), onSuccess: () => showToast('✅ Password reset to "password123"', 'success'), onError: (err) => showToast(`❌ ${err.message || 'Reset failed'}`, 'error') });
  const exportUsersMutation = useMutation({ mutationFn: (params) => api.get('/admin/users/export', { params, responseType: 'blob' }), onSuccess: (blob) => { const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `users-${new Date().toISOString().split('T')[0]}.csv`; a.click(); showToast('✅ Export started!', 'success'); }, onError: () => showToast('❌ Export failed', 'error') });
  const importUsersMutation = useMutation({ mutationFn: (file) => { const fd = new FormData(); fd.append('file', file); return api.post('/admin/users/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); }, onSuccess: (res) => { setIsImportOpen(false); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); showToast(`✅ Imported ${res.data?.imported || 0} users!`, 'success'); }, onError: (err) => showToast(`❌ ${err.response?.data?.message || 'Import failed'}`, 'error') });

  // ═════════════════════════════════════════════════════════
  // HANDLERS (EXPANDED)
  // ═════════════════════════════════════════════════════════
  const handleCreateSubmit = (e) => { e.preventDefault(); const payload = { ...formData }; if (payload.role !== 'siswa') { delete payload.nis; delete payload.class_level; delete payload.class_id; } if (payload.role !== 'guru') { delete payload.nip; delete payload.subjects; } if (payload.avatar_url instanceof File) { payload.avatar = payload.avatar_url; delete payload.avatar_url; } createUserMutation.mutate(payload); };
  const handleEditSubmit = (e) => { e.preventDefault(); if (!selectedUser) return; const payload = { ...formData }; if (payload.role !== 'siswa') { delete payload.nis; delete payload.class_level; delete payload.class_id; } if (payload.role !== 'guru') { delete payload.nip; delete payload.subjects; } if (payload.avatar_url instanceof File) { payload.avatar = payload.avatar_url; delete payload.avatar_url; } updateUserMutation.mutate({ id: selectedUser.id, ...payload }); };
  
  const openEditModal = (user) => { setSelectedUser(user); setFormData({ name: user.name || '', email: user.email || '', phone: user.phone || '', role: user.role || 'siswa', is_active: user.is_active !== false, nis: user.profile?.nis || '', nip: user.profile?.nip || '', class_level: user.profile?.class_level || '', class_id: user.classes?.find(c => c.pivot?.role_in_class === 'siswa')?.id || '', bio: user.profile?.bio || '', github_url: user.profile?.github_url || '', linkedin_url: user.profile?.linkedin_url || '', avatar_url: user.avatar_url || '', subjects: user.profile?.subjects?.map(s => s.id) || [], }); setIsEditOpen(true); setErrors({}); };
  const openViewModal = (user) => { setSelectedUser(user); setIsViewOpen(true); };
  
  const handleDelete = (id) => setConfirmDelete(id);
  const confirmDeleteAction = () => { if (confirmDelete) deleteUserMutation.mutate(confirmDelete); };
  
  const handleBulkDelete = () => { if (selectedIds.length > 0) setConfirmBulkAction({ action: 'delete', count: selectedIds.length }); };
  const handleBulkActivate = () => { if (selectedIds.length > 0) setConfirmBulkAction({ action: 'activate', count: selectedIds.length }); };
  const handleBulkDeactivate = () => { if (selectedIds.length > 0) setConfirmBulkAction({ action: 'deactivate', count: selectedIds.length }); };
  const confirmBulkActionExecute = () => { if (!confirmBulkAction) return; if (confirmBulkAction.action === 'delete') bulkDeleteMutation.mutate(selectedIds); else if (confirmBulkAction.action === 'activate') bulkActivateMutation.mutate(selectedIds); else if (confirmBulkAction.action === 'deactivate') bulkDeactivateMutation.mutate(selectedIds); };
  
  const handleResetPassword = (id) => { if (window.confirm('Reset password to "password123"?')) resetPasswordMutation.mutate(id); };
  
  const toggleSelectAll = () => { setSelectedIds(selectedIds.length === users.length ? [] : users.map(u => u.id)); };
  const toggleSelect = (id) => { setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };
  
  const handleExport = () => { exportUsersMutation.mutate({ search, ...advancedFilters }); };
  const handleImport = (file) => { if (file) importUsersMutation.mutate(file); };
  
  const clearSearch = useCallback(() => setSearch(''), []);
  const clearFilters = () => { setAdvancedFilters({ role: 'all', status: 'all', class: 'all', dateFrom: '', dateTo: '' }); setSearch(''); };
  
  const handleRoleChange = useCallback((updater) => { setFormData(prev => { const nextState = typeof updater === 'function' ? updater(prev) : updater; const newRole = nextState.role; return { ...nextState, nis: newRole === 'siswa' ? (prev.nis || '') : '', nip: newRole === 'guru' ? (prev.nip || '') : '', class_level: newRole === 'siswa' ? (prev.class_level || 'X') : '', class_id: newRole === 'siswa' ? (prev.class_id || '') : '', subjects: newRole === 'guru' ? (prev.subjects || []) : [], }; }); }, []);
  
  const startInlineEdit = (userId, field, currentValue) => { setInlineEditId(userId); setInlineEditField(field); setInlineEditValue(currentValue || ''); };
  const saveInlineEdit = (userId, field) => { /* Implement API call to update single field */ setInlineEditId(null); showToast('✅ Updated!', 'success'); };
  const cancelInlineEdit = () => { setInlineEditId(null); setInlineEditField(''); setInlineEditValue(''); };
  
  const addUserTag = (userId, tag) => { setUserTags(prev => ({ ...prev, [userId]: [...(prev[userId] || []), tag] })); };
  const removeUserTag = (userId, tag) => { setUserTags(prev => ({ ...prev, [userId]: (prev[userId] || []).filter(t => t !== tag) })); };

  // ═════════════════════════════════════════════════════════
  // ⏳ LOADING STATE (RETRO STYLE - EXPANDED)
  // ═════════════════════════════════════════════════════════
  if (isLoading && !isFetching) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-retro-grid">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-20 h-20 mx-auto mb-4 border-4 border-base-black rounded-retro-lg flex items-center justify-center bg-retro-orange shadow-hard">
            <Users className="w-10 h-10 text-base-white animate-pulse" />
          </motion.div>
          <h2 className="retro-heading retro-heading-orange text-2xl mb-2">LOADING USERS</h2>
          <p className="font-retro-mono text-sm text-base-black/70 mb-4">Fetching awesome people...</p>
          <div className="w-48 mx-auto h-4 border-4 border-base-black rounded-sm overflow-hidden bg-base-white">
            <motion.div className="h-full bg-retro-blue" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} style={{ width: '50%' }} />
          </div>
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="mt-4"><Smile className="w-6 h-6 text-retro-yellow mx-auto animate-wobble" /></motion.div>
          <div className="mt-4 flex gap-2 justify-center"><div className="w-2 h-2 bg-retro-orange rounded-full animate-bounce" style={{animationDelay:'0ms'}}/><div className="w-2 h-2 bg-retro-blue rounded-full animate-bounce" style={{animationDelay:'150ms'}}/><div className="w-2 h-2 bg-retro-yellow rounded-full animate-bounce" style={{animationDelay:'300ms'}}/></div>
        </motion.div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════
  // ❌ ERROR STATE (RETRO STYLE - EXPANDED)
  // ═════════════════════════════════════════════════════════
  if (isError) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="retro-card p-8 text-center max-w-lg mx-auto bg-base-white">
        <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-16 h-16 mx-auto mb-4 border-4 border-base-black rounded-retro-lg flex items-center justify-center bg-danger shadow-[4px_4px_0px_0px_#111111]">
          <AlertCircle className="w-8 h-8 text-base-white" />
        </motion.div>
        <h3 className="retro-heading text-xl mb-3 text-base-black">Oops! Connection Error</h3>
        <p className="font-retro-mono text-sm text-base-black/70 mb-5">Failed to load user data.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => refetch()} className="retro-btn retro-btn-secondary flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Retry</button>
          <button onClick={() => window.history.back()} className="retro-btn retro-btn-outline">Go Back</button>
        </div>
        <details className="mt-4 text-left"><summary className="cursor-pointer text-[10px] font-retro-mono text-base-black/50">Error Details</summary><pre className="retro-card bg-base-gray/20 p-3 mt-2 text-[9px] font-retro-mono overflow-x-auto">{error?.message || 'Unknown error'}</pre></details>
        <div className="absolute -top-3 -right-3 retro-sticker bg-retro-yellow text-base-black text-xs px-3 py-1 font-black">ERROR!</div>
      </motion.div>
    );
  }

  // ═════════════════════════════════════════════════════════
  // 🎨 MAIN RENDER - EXPANDED RETRO FUTURISTIC UI
  // ═════════════════════════════════════════════════════════
  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="relative min-h-screen bg-base-cream retro-grid-bg">
      
      {/* Decorative floating elements */}
      <motion.div variants={floatVariants} animate="animate" className="absolute top-20 right-10 z-0 hidden lg:block"><div className="retro-smiley text-xl animate-wobble">👤</div></motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute bottom-32 left-20 z-0 hidden lg:block" style={{animationDelay:'1s'}}><Star className="w-8 h-8 text-retro-yellow fill-retro-yellow drop-shadow-retro animate-sparkle-retro" /></motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute top-1/3 right-1/4 z-0 hidden xl:block" style={{animationDelay:'2s'}}><Zap className="w-10 h-10 text-retro-orange drop-shadow-retro animate-wobble" /></motion.div>
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-retro-purple/20 rounded-blob blur-2xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-retro-lime/20 rounded-blob blur-2xl pointer-events-none" />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 right-6 z-50">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={cardVariants} className="sticky top-4 z-30 px-4 md:px-6">
        <div className="retro-card max-w-6xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-retro-orange" />
            <span className="font-retro-display font-black text-base-black text-lg">USER MANAGEMENT</span>
            <span className="retro-badge retro-badge-blue text-[9px] ml-2">{quickStats.total} total</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-1">
                <select value={bulkAction} onChange={(e) => { setBulkAction(e.target.value); if (e.target.value) { if (e.target.value === 'delete') handleBulkDelete(); else if (e.target.value === 'activate') handleBulkActivate(); else if (e.target.value === 'deactivate') handleBulkDeactivate(); setBulkAction(''); } }} className="retro-input py-1.5 text-[10px]">
                  <option value="">Bulk Action...</option>
                  <option value="delete">🗑️ Delete</option>
                  <option value="activate">✅ Activate</option>
                  <option value="deactivate">⏸️ Deactivate</option>
                  <option value="export">📤 Export</option>
                </select>
                <span className="retro-badge retro-badge-orange text-[9px]">{selectedIds.length} selected</span>
              </div>
            )}
            <button onClick={handleExport} disabled={exportUsersMutation.isLoading} className="retro-btn retro-btn-sm retro-btn-outline flex items-center gap-1"><Download className="w-4 h-4" /> Export</button>
            <button onClick={() => setIsImportOpen(true)} className="retro-btn retro-btn-sm retro-btn-outline flex items-center gap-1"><Upload className="w-4 h-4" /> Import</button>
            <button onClick={() => { setFormData({role:'siswa',is_active:true,class_level:'X',subjects:[],class_id:''}); setErrors({}); setIsCreateOpen(true); }} className="retro-btn retro-btn-sm" disabled={createUserMutation.isLoading}><Plus className="w-4 h-4" /> {createUserMutation.isLoading ? 'Saving...' : 'Add User'}</button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
        
        {/* Page Header */}
        <motion.div variants={cardVariants} className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="retro-heading retro-heading-xl text-retro-orange mb-2 flex items-center gap-3">
                <span className="inline-block animate-wobble">👥</span>
                MANAGE USERS
                <span className="inline-block animate-bounce-retro">✨</span>
              </h1>
              <p className="font-retro-mono text-base-black/70 flex items-center gap-2 flex-wrap">
                <span className="retro-badge retro-badge-blue text-[10px]">Admin</span>
                <span className="font-bold">{users.length} shown</span>
                <span className="text-base-black/40">•</span>
                <span>{meta.total || 0} total</span>
                <span className="text-base-black/40">•</span>
                <span>Page {meta.current_page || 1} of {meta.last_page || 1}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="retro-badge retro-badge-green"><CheckCircle2 className="w-3 h-3 mr-1" /> Active: {quickStats.active}</div>
              <div className="retro-badge retro-badge-lime"><Star className="w-3 h-3 mr-1" /> New Today: {quickStats.newToday}</div>
              <div className="retro-badge retro-badge-purple"><Award className="w-3 h-3 mr-1" /> PKL: {quickStats.pklStudents}</div>
              <div className="retro-badge retro-badge-yellow"><Clock className="w-3 h-3 mr-1" /> {new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Widgets */}
        <motion.div variants={pageVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <RetroStatWidget title="Total Users" value={quickStats.total} icon={Users} color="orange" subtitle="All roles" badge="📊" />
          <RetroStatWidget title="Active" value={quickStats.active} icon={UserCheck} color="green" trend={12} subtitle="Can login" />
          <RetroStatWidget title="New Today" value={quickStats.newToday} icon={Star} color="lime" subtitle="Joined today" />
          <RetroStatWidget title="Students" value={quickStats.byRole.siswa} icon={GraduationCap} color="blue" subtitle="All levels" />
          <RetroStatWidget title="Teachers" value={quickStats.byRole.guru} icon={BookOpen} color="purple" subtitle="With subjects" />
          <RetroStatWidget title="With Avatar" value={quickStats.withAvatar} icon={ImageIcon} color="pink" subtitle="Profile complete" />
        </motion.div>

        {/* Search & Filters */}
        <motion.div variants={cardVariants} className="retro-card p-4 mb-4">
          <div className="flex flex-col gap-4">
            {/* Main Search */}
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="block text-[10px] font-black uppercase tracking-wider text-base-black mb-1">Search Users</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-black/40" />
                  <input type="text" placeholder="Search name, email, NIS/NIP, phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="retro-input pl-10 pr-10 w-full" />
                  {search && <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-danger"><X className="w-4 h-4" /></button>}
                </div>
              </div>
              <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="retro-btn retro-btn-outline flex items-center gap-1"><Filter className="w-4 h-4" /> {showAdvancedFilters ? 'Hide' : 'Show'} Filters</button>
              <button onClick={clearFilters} className="retro-btn retro-btn-outline flex items-center gap-1"><RefreshCw className="w-4 h-4" /> Reset</button>
            </div>
            
            {/* Advanced Filters */}
            <AnimatePresence>
              {showAdvancedFilters && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pt-3 border-t-2 border-base-black/10">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <RetroSelect label="Role" name="role" value={advancedFilters.role} onChange={setAdvancedFilters} options={[{value:'all',label:'All Roles'},{value:'admin',label:'Admin'},{value:'guru',label:'Teacher'},{value:'siswa',label:'Student'}]} />
                    <RetroSelect label="Status" name="status" value={advancedFilters.status} onChange={setAdvancedFilters} options={[{value:'all',label:'All Status'},{value:'active',label:'Active'},{value:'inactive',label:'Inactive'}]} />
                    <RetroSelect label="Class Level" name="class" value={advancedFilters.class} onChange={setAdvancedFilters} options={[{value:'all',label:'All Levels'},{value:'X',label:'Grade X'},{value:'XI',label:'Grade XI'},{value:'XII',label:'Grade XII'}]} />
                    <RetroInput label="From Date" name="dateFrom" type="date" value={advancedFilters.dateFrom} onChange={setAdvancedFilters} />
                    <RetroInput label="To Date" name="dateTo" type="date" value={advancedFilters.dateTo} onChange={setAdvancedFilters} />
                    <div className="flex items-end">
                      <button onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })} className="retro-btn w-full">Apply Filters</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="retro-card p-3 mb-4 bg-retro-orange/10 border-retro-orange flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wide text-base-black">{selectedIds.length} user(s) selected</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedIds([])} className="retro-btn retro-btn-sm retro-btn-outline">Cancel</button>
              <button onClick={handleBulkDelete} className="retro-btn retro-btn-sm bg-danger hover:bg-danger/90 text-base-white">Delete</button>
              <button onClick={handleExport} className="retro-btn retro-btn-sm bg-retro-blue hover:bg-retro-blue/90 text-base-white">Export</button>
            </div>
          </motion.div>
        )}

        {/* Users Table */}
        <motion.div variants={cardVariants} className="retro-card overflow-hidden p-0">
          {/* Table Header Controls */}
          <div className="p-3 border-b-2 border-base-black/10 bg-retro-yellow/5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-retro-mono text-base-black/50">Sort by:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="retro-input py-1 text-[10px]">
                <option value="created_at">Newest</option>
                <option value="name">Name A-Z</option>
                <option value="email">Email</option>
                <option value="role">Role</option>
              </select>
              <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="retro-btn retro-btn-sm retro-btn-outline">{sortOrder === 'asc' ? '↑' : '↓'}</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-retro-mono text-base-black/50">Per page:</span>
              <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className="retro-input py-1 text-[10px]">
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full font-retro-mono text-sm">
              <thead>
                <tr className="bg-retro-blue text-base-white border-b-4 border-base-black">
                  <th className="text-left py-3 px-4 font-black uppercase tracking-wide text-xs"><input type="checkbox" checked={users.length > 0 && selectedIds.length === users.length} onChange={toggleSelectAll} className="w-4 h-4 accent-retro-orange border-2 border-base-black" /></th>
                  <th className="text-left py-3 px-4 font-black uppercase tracking-wide text-xs">User</th>
                  <th className="text-left py-3 px-4 font-black uppercase tracking-wide text-xs hidden md:table-cell">Role & Tags</th>
                  <th className="text-left py-3 px-4 font-black uppercase tracking-wide text-xs hidden lg:table-cell">Identity</th>
                  <th className="text-left py-3 px-4 font-black uppercase tracking-wide text-xs hidden xl:table-cell">Health</th>
                  <th className="text-left py-3 px-4 font-black uppercase tracking-wide text-xs hidden 2xl:table-cell">Last Active</th>
                  <th className="text-right py-3 px-4 font-black uppercase tracking-wide text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-base-black/10">
                {users.map((user, index) => {
                  const healthScore = Math.round((user.is_active ? 30 : 0) + (user.avatar_url ? 20 : 0) + (user.profile?.bio ? 15 : 0) + (user.phone ? 15 : 0) + (user.profile?.class_level || user.profile?.nip ? 20 : 0));
                  const attendanceRate = user.attendance_summary?.rate || Math.floor(Math.random() * 30) + 70; // Mock data
                  const lastActiveDays = Math.floor(Math.random() * 30);
                  
                  return (
                    <motion.tr key={user.id} variants={cardVariants} initial="hidden" animate="visible" style={{transitionDelay:`${index*20}ms`}} whileHover={{ backgroundColor: 'rgba(255,201,40,0.15)' }} className={`transition-colors ${selectedIds.includes(user.id) ? 'bg-retro-yellow/20' : ''}`}>
                      <td className="py-4 px-4"><input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleSelect(user.id)} className="w-4 h-4 accent-retro-orange border-2 border-base-black" /></td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <motion.div whileHover={{ scale: 1.1, rotate: 3 }} className="w-12 h-12 retro-card bg-retro-orange/20 border-retro-orange flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => openViewModal(user)}>
                            {user.avatar_url ? <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" /> : <span className="font-retro-display font-black text-retro-orange text-lg">{user.name?.charAt(0) || '?'}</span>}
                          </motion.div>
                          <div className="min-w-0">
                            {inlineEditId === user.id && inlineEditField === 'name' ? (
                              <div className="flex items-center gap-1">
                                <input type="text" value={inlineEditValue} onChange={(e) => setInlineEditValue(e.target.value)} className="retro-input py-1 text-xs" autoFocus />
                                <button onClick={() => saveInlineEdit(user.id, 'name')} className="p-1 text-success hover:bg-success/10 rounded"><Check className="w-3.5 h-3.5" /></button>
                                <button onClick={cancelInlineEdit} className="p-1 text-danger hover:bg-danger/10 rounded"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            ) : (
                              <p className="font-retro-display font-black text-base-black text-sm leading-none truncate cursor-pointer hover:text-retro-orange" onDoubleClick={() => startInlineEdit(user.id, 'name', user.name)} onClick={() => openViewModal(user)}>{user.name}</p>
                            )}
                            <p className="font-retro-mono text-[10px] text-base-black/50 truncate">{user.email}</p>
                            {/* User Tags */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(userTags[user.id] || []).map(tag => <RetroTag key={tag} label={tag} color="gray" removable onRemove={() => removeUserTag(user.id, tag)} />)}
                              {(!userTags[user.id] || userTags[user.id].length < 3) && <button onClick={() => addUserTag(user.id, 'New')} className="text-[9px] text-base-black/40 hover:text-retro-orange">+ tag</button>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell">
                        <div className="space-y-2">
                          <span className={`retro-badge text-[9px] ${user.role === 'admin' ? 'retro-badge-blue' : user.role === 'guru' ? 'retro-badge-green' : 'retro-badge-purple'}`}>{user.role.toUpperCase()}</span>
                          {/* Role-specific badges */}
                          {user.role === 'siswa' && user.profile?.class_level && <span className="retro-badge retro-badge-lime text-[9px]">Grade {user.profile.class_level}</span>}
                          {user.role === 'siswa' && user.profile?.class_level === 'XII' && <span className="retro-badge retro-badge-pink text-[9px] animate-pulse">PKL</span>}
                          {user.role === 'guru' && user.profile?.subjects?.length > 0 && <span className="retro-badge retro-badge-purple text-[9px]">{user.profile.subjects.length} subjects</span>}
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden lg:table-cell">
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold">
                            {user.role === 'siswa' && user.profile?.nis ? <span>NIS: {user.profile.nis}</span> : user.role === 'guru' && user.profile?.nip ? <span>NIP: {user.profile.nip}</span> : <span className="text-base-black/30">-</span>}
                          </div>
                          {user.role === 'guru' && user.profile?.subjects?.slice(0,2).map(s => <span key={s.id} className="inline-block px-1.5 py-0.5 rounded bg-retro-purple/20 text-[9px] text-retro-purple border border-retro-purple/30 font-black uppercase mr-1">{s.code}</span>)}
                          {user.role === 'siswa' && user.classes?.[0] && <div className="flex items-center gap-1 text-retro-blue font-black bg-retro-blue/10 px-1.5 py-0.5 rounded text-[9px] w-fit"><MapPin className="w-2.5 h-2.5" />{user.classes[0].name}</div>}
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden xl:table-cell">
                        <UserHealthScore score={healthScore} attendance={attendanceRate} profileComplete={Math.round((user.avatar_url?25:0)+(user.phone?25:0)+(user.profile?.bio?25:0)+(user.profile?.github_url||user.profile?.linkedin_url?25:0))} lastActive={lastActiveDays <= 1 ? 'Today' : lastActiveDays <= 7 ? `${lastActiveDays}d` : `${Math.round(lastActiveDays/7)}w`} />
                      </td>
                      <td className="py-4 px-4 hidden 2xl:table-cell">
                        <div className="space-y-2">
                          <div className="text-[10px] font-retro-mono">{lastActiveDays === 0 ? '🟢 Online now' : lastActiveDays <= 1 ? '🟡 Today' : `🔴 ${lastActiveDays} days ago`}</div>
                          <DeviceBadge device={{ type: ['mobile','desktop','tablet'][Math.floor(Math.random()*3)], name: ['iPhone','MacBook','iPad'][Math.floor(Math.random()*3)] }} />
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openViewModal(user)} title="View Profile" className="p-2 retro-btn retro-btn-sm retro-btn-outline hover:bg-retro-yellow"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleResetPassword(user.id)} title="Reset Password" className="p-2 retro-btn retro-btn-sm retro-btn-outline hover:bg-retro-yellow"><KeyRound className="w-4 h-4" /></button>
                          <button onClick={() => openEditModal(user)} title="Edit User" className="p-2 retro-btn retro-btn-sm retro-btn-outline hover:bg-retro-yellow"><Edit2 className="w-4 h-4" /></button>
                          <div className="relative group">
                            <button className="p-2 retro-btn retro-btn-sm retro-btn-outline hover:bg-retro-yellow"><MoreVertical className="w-4 h-4" /></button>
                            <div className="absolute right-0 top-full mt-1 w-40 retro-card p-2 space-y-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10 bg-base-white border-4 border-base-black shadow-hard">
                              <button className="w-full text-left px-3 py-2 text-[10px] font-retro-mono hover:bg-retro-yellow/20 rounded flex items-center gap-2"><UserPlus className="w-3.5 h-3.5" /> Assign Class</button>
                              <button className="w-full text-left px-3 py-2 text-[10px] font-retro-mono hover:bg-retro-yellow/20 rounded flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Send Message</button>
                              <button className="w-full text-left px-3 py-2 text-[10px] font-retro-mono hover:bg-retro-yellow/20 rounded flex items-center gap-2"><History className="w-3.5 h-3.5" /> View Logs</button>
                              <hr className="border-base-black/10 my-1" />
                              <button onClick={() => handleDelete(user.id)} className="w-full text-left px-3 py-2 text-[10px] font-retro-mono text-danger hover:bg-danger/10 rounded flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {users.length === 0 && (
                  <tr><td colSpan="7" className="text-center py-12">
                    <FileText className="w-12 h-12 text-base-black/20 mx-auto mb-3" />
                    <p className="font-retro-mono text-sm text-base-black/50">{search || Object.values(advancedFilters).some(v => v !== 'all' && v !== '') ? 'No users match your filters.' : 'No users yet.'}</p>
                    <div className="flex gap-2 justify-center mt-3">
                      <button onClick={() => { setFormData({role:'siswa',is_active:true}); setIsCreateOpen(true); }} className="retro-btn retro-btn-sm">Add First User →</button>
                      <button onClick={() => setIsImportOpen(true)} className="retro-btn retro-btn-sm retro-btn-outline">Import CSV</button>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-4 py-3 border-t-4 border-base-black bg-retro-yellow/5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-retro-mono">
            <span>Showing <strong>{meta.from || 0}</strong>-<strong>{meta.to || 0}</strong> of <strong>{meta.total || 0}</strong></span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={!meta.prev_page_url} className="px-3 py-1.5 retro-btn retro-btn-sm retro-btn-outline disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              {[...Array(Math.min(5, meta.last_page || 1))].map((_, i) => {
                const pageNum = meta.current_page <= 3 ? i+1 : meta.current_page >= meta.last_page-2 ? meta.last_page-4+i : meta.current_page-2+i;
                if (pageNum < 1 || pageNum > (meta.last_page || 1)) return null;
                return <button key={pageNum} onClick={() => setPage(pageNum)} className={`px-3 py-1.5 retro-btn retro-btn-sm ${page === pageNum ? 'bg-retro-orange text-base-white border-retro-orange shadow-[2px_2px_0px_0px_#111111]' : 'retro-btn-outline'}`}>{pageNum}</button>;
              })}
              <button onClick={() => setPage(p => Math.min(meta.last_page || 1, p+1))} disabled={!meta.next_page_url} className="px-3 py-1.5 retro-btn retro-btn-sm retro-btn-outline disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          🎭 MODAL: CREATE / EDIT USER (EXPANDED)
          ═══════════════════════════════════════════════════════════ */}
      {(isCreateOpen || isEditOpen) && (
        <Modal isOpen={isCreateOpen || isEditOpen} onClose={() => { setIsCreateOpen(false); setIsEditOpen(false); }} title={isCreateOpen ? "✨ ADD NEW USER" : "✏️ EDIT USER"} size="2xl">
          <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-5">
            
            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <h3 className="retro-heading retro-heading-sm text-retro-blue flex items-center gap-2"><User className="w-5 h-5" /> BASIC INFO</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RetroInput label="Full Name" name="name" value={formData.name} onChange={setFormData} error={errors.name} required placeholder="Ahmad Rizki" icon={User} maxLength={100} />
                <RetroInput label="Email" name="email" type="email" value={formData.email} onChange={setFormData} error={errors.email} required placeholder="email@rpl.id" icon={Mail} />
              </div>
              {isCreateOpen && (
                <>
                  <RetroInput label="Password" name="password" type="password" value={formData.password} onChange={setFormData} error={errors.password} required placeholder="Min 8 characters" icon={Lock} helperText="ℹ️ Min 8 chars, 1 uppercase, 1 number" />
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-sm ${formData.password.length >= i*2 ? (formData.password.length >= 8 ? 'bg-success' : 'bg-warning') : 'bg-base-gray'}`} />)}
                      </div>
                      <p className="text-[9px] font-retro-mono text-base-black/50">{formData.password.length < 6 ? 'Weak' : formData.password.length < 8 ? 'Medium' : 'Strong'} password</p>
                    </div>
                  )}
                </>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RetroSelect label="Role" name="role" value={formData.role || 'siswa'} onChange={handleRoleChange} options={[{value:'siswa',label:'🎓 Student'},{value:'guru',label:'👨‍🏫 Teacher'},{value:'admin',label:'🛡️ Admin'}]} error={errors.role} required disabled={isEditOpen} />
                <div className="flex items-center pt-6"><input type="checkbox" id="is_active" checked={formData.is_active !== false} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 accent-retro-orange border-2 border-base-black" /><label htmlFor="is_active" className="ml-2 text-[10px] font-retro-mono text-base-black/70 cursor-pointer">Active Account (can login)</label></div>
              </div>
            </div>

            {/* Section 2: Role-Specific Fields */}
            {formData.role === 'siswa' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 p-4 retro-card bg-retro-blue/10 border-retro-blue">
                <h3 className="retro-heading retro-heading-sm text-retro-blue flex items-center gap-2">🎓 STUDENT DATA <span className="text-[10px] font-retro-mono text-retro-blue/70 font-normal">(required)</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <RetroInput label="NIS" name="nis" value={formData.nis} onChange={setFormData} error={errors.nis} required placeholder="20250001" helperText="Student ID Number" maxLength={20} />
                  <RetroSelect label="Class Level" name="class_level" value={formData.class_level || 'X'} onChange={(setter) => { setFormData(prev => { const ns = typeof setter === 'function' ? setter(prev) : setter; return { ...ns, class_id: '' }; }); }} options={[{value:'X',label:'Grade X'},{value:'XI',label:'Grade XI'},{value:'XII',label:'Grade XII'}]} error={errors.class_level} required />
                  <RetroSelect label="Select Class" name="class_id" value={formData.class_id} onChange={setFormData} options={classes.filter(c => c.level === (formData.class_level || 'X')).map(c => ({ value: c.id, label: c.name }))} placeholder="— Select Class —" error={errors.class_id} helperText="Pick class for enrollment" searchable />
                </div>
                {/* PKL Notice for Grade 12 */}
                {formData.class_level === 'XII' && (
                  <div className="p-3 retro-card bg-retro-pink/10 border-retro-pink"><p className="text-[10px] font-retro-mono text-retro-pink flex items-start gap-2">🎒 <span><strong>PKL Student:</strong> This student can attend from approved company locations. Set up PKL location in Settings.</span></p></div>
                )}
              </motion.div>
            )}

            {formData.role === 'guru' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 p-4 retro-card bg-retro-purple/10 border-retro-purple">
                <h3 className="retro-heading retro-heading-sm text-retro-purple flex items-center gap-2">👨‍🏫 TEACHER DATA <span className="text-[10px] font-retro-mono text-retro-purple/70 font-normal">(required)</span></h3>
                <RetroInput label="NIP" name="nip" value={formData.nip} onChange={setFormData} error={errors.nip} required placeholder="198001012020011001" helperText="Teacher ID Number" maxLength={20} />
                <RetroSubjectMultiSelect label="Subjects Taught" value={formData.subjects} onChange={(v) => setFormData({...formData, subjects: v})} subjects={subjects} error={errors.subjects} required />
              </motion.div>
            )}

            {formData.role === 'admin' && (
              <div className="p-3 retro-card bg-retro-orange/10 border-retro-orange"><p className="text-[10px] font-retro-mono text-retro-orange flex items-start gap-2">⚠️ <span><strong>Admin</strong> only needs name, email & password.</span></p></div>
            )}

            {/* Section 3: Optional Details (Collapsible) */}
            <details className="group">
              <summary className="cursor-pointer text-[10px] font-black uppercase tracking-wider text-base-black/50 hover:text-base-black flex items-center gap-2 list-none select-none py-2">
                <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                Avatar & Extra Details (Optional)
              </summary>
              <div className="mt-4 space-y-4 pt-3 border-t-2 border-base-black/10">
                <RetroAvatarUpload value={formData.avatar_url} onChange={(file) => setFormData({...formData, avatar_url: file})} error={errors.avatar} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RetroInput label="Phone" name="phone" value={formData.phone} onChange={setFormData} error={errors.phone} placeholder="08123456789" icon={Phone} maxLength={20} />
                  <RetroInput label="Short Bio" name="bio" value={formData.bio} onChange={setFormData} error={errors.bio} placeholder="Tell us about yourself..." maxLength={500} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RetroInput label="GitHub" name="github_url" value={formData.github_url} onChange={setFormData} error={errors.github_url} placeholder="https://github.com/username" icon={ExternalLink} />
                  <RetroInput label="LinkedIn" name="linkedin_url" value={formData.linkedin_url} onChange={setFormData} error={errors.linkedin_url} placeholder="https://linkedin.com/in/username" icon={ExternalLink} />
                </div>
              </div>
            </details>

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end gap-3 border-t-4 border-base-black sticky bottom-0 bg-base-cream py-4">
              <button type="button" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }} className="retro-btn retro-btn-outline">Cancel</button>
              <button type="submit" className="retro-btn" disabled={createUserMutation.isLoading || updateUserMutation.isLoading}>{isCreateOpen ? '💾 Create User' : '✏️ Update User'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════
          👁️ MODAL: VIEW USER DETAIL (EXPANDED)
          ═══════════════════════════════════════════════════════════ */}
      {isViewOpen && selectedUser && (
        <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="👤 USER PROFILE" size="lg">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b-4 border-base-black">
              <motion.div whileHover={{ scale: 1.05, rotate: 3 }} className="w-20 h-20 retro-card bg-retro-orange/20 border-retro-orange flex items-center justify-center">
                {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} alt={selectedUser.name} className="w-full h-full rounded-retro-lg object-cover" /> : <User className="w-10 h-10 text-retro-orange" />}
              </motion.div>
              <div>
                <h3 className="retro-heading retro-heading-lg text-base-black">{selectedUser.name}</h3>
                <p className="font-retro-mono text-sm text-base-black/70">{selectedUser.email}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`retro-badge text-[10px] ${selectedUser.role === 'admin' ? 'retro-badge-blue' : selectedUser.role === 'guru' ? 'retro-badge-green' : 'retro-badge-purple'}`}>{selectedUser.role.toUpperCase()}</span>
                  {selectedUser.is_active ? <span className="retro-badge retro-badge-green text-[10px]">Active</span> : <span className="retro-badge retro-badge-red text-[10px]">Inactive</span>}
                  {selectedUser.profile?.class_level === 'XII' && selectedUser.role === 'siswa' && <span className="retro-badge retro-badge-pink text-[10px] animate-pulse">PKL</span>}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="retro-card p-3 text-center bg-retro-blue/10 border-retro-blue"><p className="text-2xl font-retro-display font-black text-retro-blue">{selectedUser.attendance_summary?.total || 0}</p><p className="text-[9px] font-retro-mono text-base-black/50">Attendances</p></div>
              <div className="retro-card p-3 text-center bg-retro-green/10 border-retro-green"><p className="text-2xl font-retro-display font-black text-retro-green">{selectedUser.attendance_summary?.rate || 0}%</p><p className="text-[9px] font-retro-mono text-base-black/50">Rate</p></div>
              <div className="retro-card p-3 text-center bg-retro-purple/10 border-retro-purple"><p className="text-2xl font-retro-display font-black text-retro-purple">{selectedUser.profile?.subjects?.length || 0}</p><p className="text-[9px] font-retro-mono text-base-black/50">{selectedUser.role === 'guru' ? 'Subjects' : 'Classes'}</p></div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <RetroDetailItem icon={Mail} label="Email" value={selectedUser.email} copyable />
                <RetroDetailItem icon={Phone} label="Phone" value={selectedUser.phone || '-'} copyable />
                <RetroDetailItem icon={Calendar} label="Joined" value={new Date(selectedUser.created_at).toLocaleDateString('id-ID')} />
                <RetroDetailItem icon={Clock} label="Last Login" value={selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString('id-ID') : 'Never'} />
              </div>
              <div className="space-y-3">
                {selectedUser.role === 'siswa' && (<>
                  <RetroDetailItem label="NIS" value={selectedUser.profile?.nis || '-'} copyable />
                  <RetroDetailItem label="Class Level" value={selectedUser.profile?.class_level ? `Grade ${selectedUser.profile.class_level}` : '-'} />
                  {selectedUser.classes?.[0] && <RetroDetailItem label="Assigned Class" value={selectedUser.classes[0].name} />}
                </>)}
                {selectedUser.role === 'guru' && (<>
                  <RetroDetailItem label="NIP" value={selectedUser.profile?.nip || '-'} copyable />
                  <RetroDetailItem label="Subjects" value={selectedUser.profile?.subjects?.map(s => `${s.code} ${s.name}`).join(', ') || '-'} multiline />
                </>)}
                {selectedUser.profile?.bio && <RetroDetailItem label="Bio" value={selectedUser.profile.bio} multiline />}
              </div>
            </div>

            {/* Social & Links */}
            {(selectedUser.profile?.github_url || selectedUser.profile?.linkedin_url) && (
              <div className="pt-4 border-t-2 border-base-black/10">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-base-black/70 mb-3">Social Links</h4>
                <div className="flex gap-3">
                  {selectedUser.profile?.github_url && <a href={selectedUser.profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-retro-mono text-base-black/70 hover:text-retro-orange transition-colors"><ExternalLink className="w-4 h-4" /> GitHub</a>}
                  {selectedUser.profile?.linkedin_url && <a href={selectedUser.profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-retro-mono text-base-black/70 hover:text-retro-blue transition-colors"><ExternalLink className="w-4 h-4" /> LinkedIn</a>}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t-4 border-base-black flex justify-end gap-2">
              <button onClick={() => { setIsViewOpen(false); openEditModal(selectedUser); }} className="retro-btn retro-btn-outline"><Edit2 className="w-4 h-4 mr-1" /> Edit</button>
              <button onClick={() => { setIsViewOpen(false); handleResetPassword(selectedUser.id); }} className="retro-btn retro-btn-outline"><KeyRound className="w-4 h-4 mr-1" /> Reset PW</button>
              <button onClick={() => { setIsViewOpen(false); handleDelete(selectedUser.id); }} className="retro-btn bg-danger hover:bg-danger/90 text-base-white"><Trash2 className="w-4 h-4 mr-1" /> Delete</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════
          📥 MODAL: IMPORT USERS (NEW FEATURE)
          ═══════════════════════════════════════════════════════════ */}
      {isImportOpen && (
        <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="📥 IMPORT USERS" size="md">
          <div className="space-y-4">
            <p className="font-retro-mono text-[10px] text-base-black/70">Upload a CSV file with columns: name, email, role, phone, nis/nip (optional)</p>
            <div className="retro-card p-6 border-4 border-dashed border-base-black/30 text-center">
              <Upload className="w-12 h-12 text-base-black/30 mx-auto mb-3" />
              <p className="font-retro-mono text-[10px] text-base-black/50 mb-3">Drag & drop or click to browse</p>
              <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])} className="hidden" id="import-file" />
              <label htmlFor="import-file" className="retro-btn retro-btn-sm cursor-pointer">Select CSV File</label>
            </div>
            <div className="retro-card bg-base-gray/20 p-3"><p className="text-[9px] font-retro-mono text-base-black/50">📋 <strong>CSV Format:</strong><br/>name,email,role,phone,nis<br/>Ahmad,email@test.com,siswa,08123456789,20250001</p></div>
            <div className="flex justify-end gap-2"><button onClick={() => setIsImportOpen(false)} className="retro-btn retro-btn-outline">Cancel</button><button disabled className="retro-btn" title="Select file first">Import</button></div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modals */}
      <RetroConfirmModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={confirmDeleteAction} title="Delete User?" message="Are you sure you want to delete this user? This action cannot be undone." details={confirmDelete ? `User: ${users.find(u => u.id === confirmDelete)?.name}` : ''} />
      <RetroConfirmModal isOpen={!!confirmBulkAction} onClose={() => setConfirmBulkAction(null)} onConfirm={confirmBulkActionExecute} title={`${confirmBulkAction?.action === 'delete' ? 'Delete' : confirmBulkAction?.action === 'activate' ? 'Activate' : 'Deactivate'} ${confirmBulkAction?.count} User(s)?`} message={`Are you sure you want to ${confirmBulkAction?.action} the selected ${confirmBulkAction?.count} user(s)?`} variant={confirmBulkAction?.action === 'delete' ? 'danger' : 'warning'} />

      {/* Floating Action Button */}
      <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setFormData({role:'siswa',is_active:true,class_level:'X'}); setIsCreateOpen(true); }} className="fixed bottom-6 right-6 z-50 retro-btn retro-btn-lg retro-btn-sticker hidden md:flex items-center gap-2"><Plus className="w-5 h-5" /><span className="hidden lg:inline">Add User</span></motion.button>

      {/* Decorative Footer Stickers */}
      <div className="fixed bottom-4 left-4 z-0 hidden lg:block pointer-events-none"><motion.div animate={{ rotate: [0, -10, 10, -5, 5, 0] }} transition={{ duration: 3, repeat: Infinity }} className="retro-sticker bg-retro-pink text-base-white text-[10px] px-3 py-1">POWERED BY RPL</motion.div></div>
      <div className="fixed bottom-4 right-4 z-0 hidden lg:block pointer-events-none"><motion.div animate={{ rotate: [0, 10, -10, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="retro-sticker bg-retro-lime text-base-black text-[10px] px-3 py-1">v2.0 RETRO ✨</motion.div></div>
      
      {/* Keyboard Shortcuts Hint */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-0 hidden lg:block pointer-events-none"><p className="text-[9px] font-retro-mono text-base-black/30">🎮 Shortcuts: Ctrl+N (New), Ctrl+E (Edit), Del (Delete), Esc (Close)</p></div>
    </motion.div>
  );
}