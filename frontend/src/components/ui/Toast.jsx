import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  const icons = {
    success: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
    error: { icon: AlertCircle, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30' },
    warning: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' }, // ✅ ADDED
  };
  
  const config = icons[type] || icons.info; // Fallback to info
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl ${config.bg} ${config.border} border shadow-lg min-w-[300px]`}
      >
        <Icon className={`w-5 h-5 ${config.color}`} />
        <p className="text-sm text-gray-900 dark:text-white flex-1">{message}</p>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}