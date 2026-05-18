import { useState, useCallback, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Copy, RefreshCw, Maximize2, X, Check,
  QrCode as QrCodeIcon, Clock, AlertCircle, Wifi
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// 🎯 QR CODE DISPLAY — uses qrcode.react (native ESM, no CJS issue)
// Encodes: attendance URL with session code + session ID
// ═══════════════════════════════════════════════════════════

const BASE_URL = import.meta.env.VITE_APP_URL || window.location.origin;

function buildUrl(code, sessionId) {
  if (!code) return '';
  const p = new URLSearchParams({ code: code.toUpperCase() });
  if (sessionId) p.append('sid', sessionId);
  return `${BASE_URL}/dashboard/student/attendance?${p.toString()}`;
}

// ─── Countdown hook ─────────────────────────────────────
function useCountdown(validUntil) {
  const [remaining, setRemaining] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!validUntil) return;
    const update = () => {
      const diff = new Date(validUntil) - Date.now();
      if (diff <= 0) { setRemaining('Kedaluwarsa'); setIsExpired(true); return; }
      setIsExpired(false);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0 ? `${h}j ${m}m ${s}d` : m > 0 ? `${m}m ${s}d` : `${s}d`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [validUntil]);

  return { remaining, isExpired };
}

// ─── Main Component ──────────────────────────────────────
export default function QRCodeDisplay({
  code,
  sessionId,
  validUntil,
  attendedCount = 0,
  totalStudents = 0,
  onRefresh,
  isRefreshing = false,
  sessionStatus = 'active',
  showActions = true,
  size = 220,
}) {
  const svgRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const { remaining, isExpired } = useCountdown(validUntil);

  const attendanceUrl = buildUrl(code, sessionId);
  const isActive = sessionStatus === 'active' || sessionStatus === 'reopened';
  const statusColor = isActive ? '#00B894' : isExpired ? '#E17055' : '#636e72';

  // ─── Download as PNG via hidden canvas ───────────────
  const downloadQR = useCallback(() => {
    const svg = svgRef.current?.querySelector('svg');
    if (!svg) return;
    const canvas = document.createElement('canvas');
    canvas.width = size * 2;
    canvas.height = size * 2;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const link = document.createElement('a');
      link.download = `qr-absensi-${code}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  }, [code, size]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(attendanceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [attendanceUrl]);

  const attendPct = totalStudents > 0 ? Math.round((attendedCount / totalStudents) * 100) : 0;

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        {/* Status badge + timer */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase border-2 tracking-wider"
            style={{ background: `${statusColor}20`, color: statusColor, borderColor: statusColor }}>
            {isActive ? '● AKTIF' : isExpired ? '✕ EXPIRED' : '○ DITUTUP'}
          </span>
          {validUntil && (
            <span className={`flex items-center gap-1 font-retro-mono text-xs ${isExpired ? 'text-danger' : 'text-base-black/60'}`}>
              <Clock className="w-3 h-3" />{remaining}
            </span>
          )}
        </div>

        {/* QR Code */}
        <div className="relative" ref={svgRef}>
          <motion.div
            animate={isActive && !isExpired
              ? { boxShadow: ['0 0 0px #FF5C00', '0 0 18px #FF5C0055', '0 0 0px #FF5C00'] }
              : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className="border-4 border-base-black rounded-retro overflow-hidden bg-white p-3"
          >
            {code ? (
              <div style={{ opacity: isActive ? 1 : 0.35 }}>
                <QRCodeSVG
                  value={attendanceUrl || code}
                  size={size}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#111111"
                  includeMargin={false}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center bg-base-gray/20"
                style={{ width: size, height: size }}>
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 text-base-black/30 mx-auto mb-2" />
                  <p className="font-retro-mono text-xs text-base-black/40">Kode belum tersedia</p>
                </div>
              </div>
            )}

            {/* Closed overlay */}
            {!isActive && code && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-black/60 rounded">
                <X className="w-10 h-10 text-white mb-1" />
                <p className="font-retro-display font-black text-white text-sm uppercase">Sesi Ditutup</p>
              </div>
            )}
          </motion.div>

          {/* Scan indicator */}
          {isActive && !isExpired && code && (
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-success text-white text-[10px] px-3 py-1 rounded-full font-black border-2 border-base-black whitespace-nowrap">
              <Wifi className="w-3 h-3" /> SIAP SCAN
            </motion.div>
          )}
        </div>

        {/* Manual code */}
        <div className="w-full text-center mt-2">
          <p className="font-retro-mono text-[10px] text-base-black/50 uppercase mb-1">Kode Manual</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-base-black rounded-retro bg-retro-yellow/20">
            <QrCodeIcon className="w-4 h-4 text-retro-orange" />
            <span className="font-retro-display font-black text-xl tracking-widest text-retro-orange">
              {code || '——'}
            </span>
          </div>
        </div>

        {/* Attendance progress */}
        {totalStudents > 0 && (
          <div className="w-full bg-base-gray/20 rounded-retro border-2 border-base-black p-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-retro-mono text-[10px] text-base-black/60 uppercase">Kehadiran</span>
              <span className="font-retro-display font-black text-sm text-retro-blue">{attendedCount} / {totalStudents}</span>
            </div>
            <div className="h-2 bg-base-gray/30 rounded-full border border-base-black overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${attendPct}%` }}
                transition={{ duration: 0.6 }} className="h-full bg-success rounded-full" />
            </div>
            <p className="font-retro-mono text-[9px] text-base-black/40 mt-1 text-right">{attendPct}% hadir</p>
          </div>
        )}

        {/* Action buttons */}
        {showActions && (
          <div className="flex gap-2 flex-wrap justify-center w-full">
            {onRefresh && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={onRefresh} disabled={isRefreshing}
                className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-xs font-black hover:bg-retro-orange/10 disabled:opacity-50 transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />Refresh QR
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.95 }} onClick={downloadQR} disabled={!code}
              className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-xs font-black hover:bg-retro-blue/10 disabled:opacity-40 transition-colors">
              <Download className="w-3.5 h-3.5" />Download
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={copyLink} disabled={!code}
              className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-xs font-black hover:bg-success/10 disabled:opacity-40 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin!' : 'Copy Link'}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setFullscreen(true)} disabled={!code}
              className="p-2 border-2 border-base-black rounded-retro hover:bg-base-gray/20 disabled:opacity-40 transition-colors">
              <Maximize2 className="w-4 h-4" />
            </motion.button>
          </div>
        )}

        <p className="font-retro-mono text-[9px] text-base-black/30 text-center">
          Siswa scan QR atau ketik kode manual di halaman absensi
        </p>
      </div>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-base-black/90 flex flex-col items-center justify-center gap-6 p-6"
            onClick={() => setFullscreen(false)}>
            <motion.div initial={{ scale: 0.7, rotate: -4 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.7 }}
              onClick={e => e.stopPropagation()}
              className="bg-white p-6 border-4 border-retro-orange rounded-retro shadow-[12px_12px_0px_#FF5C00]">
              <QRCodeSVG value={attendanceUrl || code || 'no-code'} size={300} level="H"
                bgColor="#FFFFFF" fgColor="#111111" includeMargin />
            </motion.div>
            <div className="text-center">
              <p className="font-retro-display font-black text-white text-2xl tracking-widest">{code}</p>
              <p className="font-retro-mono text-white/50 text-sm mt-1">Tap di luar untuk menutup</p>
            </div>
            <button onClick={() => setFullscreen(false)}
              className="absolute top-4 right-4 p-2 border-2 border-white rounded-retro text-white hover:bg-white/20 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
