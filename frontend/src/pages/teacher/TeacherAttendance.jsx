import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarCheck, Plus, QrCode, RefreshCw, X,
  Clock, CheckCircle2, Activity, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { api } from '../../api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';

const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

function SessionRow({ session, onShowQR, onGenQR, onClose }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`border-4 border-base-black rounded-retro overflow-hidden ${session.is_active ? 'shadow-[4px_4px_0px_0px_#FF5C00]' : 'shadow-[2px_2px_0px_0px_#111]'}`}>
      <div className={`p-4 flex flex-wrap items-center justify-between gap-3 ${session.is_active ? 'bg-retro-orange/10' : 'bg-base-white'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-retro border-2 border-base-black ${session.is_active ? 'bg-retro-orange text-base-white' : 'bg-base-gray'}`}>
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-retro-display font-black">{session.subject?.name || 'Sesi Absensi'}</p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border-2 border-base-black ${session.is_active ? 'bg-retro-lime' : 'bg-base-gray/40 text-base-black/50'}`}>
                {session.is_active ? '● AKTIF' : 'Selesai'}
              </span>
            </div>
            <p className="font-retro-mono text-[10px] text-base-black/60">{session.class?.name} • {session.start_time}–{session.end_time}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session.is_active && <>
            <Button size="sm" onClick={() => onShowQR(session.code)}><QrCode className="w-4 h-4 mr-1" />QR</Button>
            <Button size="sm" variant="outline" onClick={() => onGenQR(session.id)}><RefreshCw className="w-4 h-4 mr-1" />Baru</Button>
            <Button size="sm" variant="danger" onClick={() => onClose(session.id)}><X className="w-4 h-4 mr-1" />Tutup</Button>
          </>}
          <button onClick={() => setExpanded(v => !v)} className="p-2 border-2 border-base-black rounded-retro hover:bg-base-gray/20">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t-2 border-dashed border-base-black">
            <div className="p-4 grid grid-cols-4 gap-4 bg-base-gray/10">
              {[['Hadir', session.attended_count||0,'#00B894'], ['Terlambat', session.late_count||0,'#E17055'], ['Total', session.total_students||0,'#2E2BBF'], ['Kode', session.code||'-','#6C5CE7']].map(([l,v,c]) => (
                <div key={l}><p className="font-retro-mono text-[10px] text-base-black/50">{l}</p><p className="font-retro-display font-black text-lg" style={{color:c}}>{v}</p></div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TeacherAttendance() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({ class_id:'', subject_id:'', date: new Date().toISOString().split('T')[0], start_time:'07:00', end_time:'08:30', location:'' });

  const showToast = useCallback((msg, type='success') => { setToast({message:msg,type}); setTimeout(()=>setToast(null),3500); }, []);

  const { data: sessions, isLoading, refetch } = useQuery({
    queryKey: ['teacher-attendance-sessions', dateFilter],
    queryFn: () => api.get('/teacher/attendance/sessions', { params: { date: dateFilter } }),
  });
  const { data: classes } = useQuery({ queryKey: ['teacher-classes'], queryFn: () => api.get('/teacher/classes') });
  const { data: subjects } = useQuery({ queryKey: ['teacher-subjects'], queryFn: () => api.get('/teacher/subjects') });

  const createSession = useMutation({
    mutationFn: (data) => api.post('/teacher/attendance/sessions', data),
    onSuccess: () => { queryClient.invalidateQueries({queryKey:['teacher-attendance-sessions']}); setIsCreateOpen(false); showToast('✅ Sesi berhasil dibuat!'); },
    onError: (e) => showToast(`❌ ${e.response?.data?.message||'Gagal membuat sesi'}`, 'error'),
  });
  const generateQR = useMutation({
    mutationFn: (id) => api.post(`/teacher/attendance/sessions/${id}/generate-code`),
    onSuccess: (res) => { if(res?.data?.code){setQrCode(res.data.code);setIsQROpen(true);} showToast('✅ QR Code baru digenerate!'); },
    onError: () => showToast('❌ Gagal generate QR', 'error'),
  });
  const closeSession = useMutation({
    mutationFn: (id) => api.post(`/teacher/attendance/session/${id}/close`),
    onSuccess: () => { queryClient.invalidateQueries({queryKey:['teacher-attendance-sessions']}); showToast('✅ Sesi ditutup'); },
    onError: () => showToast('❌ Gagal menutup sesi', 'error'),
  });

  const sessionList = sessions?.data || [];
  const activeCount = sessionList.filter(s=>s.is_active).length;

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
      <AnimatePresence>
        {toast && <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="fixed top-24 right-6 z-50"><Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/></motion.div>}
      </AnimatePresence>

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3"><CalendarCheck className="w-8 h-8"/>Manajemen Absensi</h1>
            <p className="font-retro-mono text-sm text-base-black/70 mt-1">Buat sesi, generate QR, pantau kehadiran siswa</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={()=>{refetch();showToast('🔄 Diperbarui','info');}}><RefreshCw className="w-4 h-4 mr-1"/>Refresh</Button>
            <Button onClick={()=>setIsCreateOpen(true)}><Plus className="w-4 h-4 mr-1"/>Sesi Baru</Button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[['Sesi Aktif', activeCount, '#FF5C00', Activity], ['Total Sesi', sessionList.length, '#2E2BBF', CalendarCheck],
          ['Total Hadir', sessionList.reduce((a,s)=>a+(s.attended_count||0),0), '#00B894', CheckCircle2],
          ['Tanggal', new Date(dateFilter+'T00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short'}), '#6C5CE7', Clock]
        ].map(([label, value, color, Icon]) => (
          <div key={label} className="retro-card bg-base-white border-2 border-base-black p-3 flex items-center gap-3">
            <div className="p-2 rounded-retro border-2 border-base-black" style={{background:`${color}20`}}><Icon className="w-4 h-4" style={{color}}/></div>
            <div><p className="retro-heading text-xl" style={{color}}>{value}</p><p className="font-retro-mono text-[10px] text-base-black/60 uppercase">{label}</p></div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-4 flex gap-4 items-center flex-wrap">
        <span className="font-retro-mono text-xs font-black uppercase text-base-black/70">Filter Tanggal:</span>
        <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)}
          className="py-2 px-3 rounded-retro bg-base-gray/30 border-2 border-base-black font-retro-mono text-sm focus:outline-none focus:border-retro-orange"/>
        <button onClick={()=>setDateFilter(new Date().toISOString().split('T')[0])} className="font-retro-mono text-xs text-retro-orange hover:underline">Hari Ini</button>
      </motion.div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="retro-card bg-base-white border-4 border-base-black p-12 text-center">
            <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}}><CalendarCheck className="w-10 h-10 text-retro-orange"/></motion.div>
            <p className="font-retro-mono text-base-black/60 mt-3">Memuat data...</p>
          </div>
        ) : sessionList.length > 0 ? sessionList.map(s => (
          <SessionRow key={s.id} session={s} onShowQR={c=>{setQrCode(c);setIsQROpen(true);}} onGenQR={id=>generateQR.mutate(id)} onClose={id=>closeSession.mutate(id)}/>
        )) : (
          <div className="retro-card bg-base-white border-4 border-dashed border-base-black p-12 text-center">
            <CalendarCheck className="w-14 h-14 text-base-black/20 mx-auto mb-3"/>
            <p className="font-retro-mono text-base-black/50 mb-5">Belum ada sesi pada tanggal ini</p>
            <Button onClick={()=>setIsCreateOpen(true)}><Plus className="w-4 h-4 mr-1"/>Buat Sesi Baru</Button>
          </div>
        )}
      </div>

      <Modal isOpen={isQROpen} onClose={()=>setIsQROpen(false)} title="🎯 QR Code Absensi" maxWidth="sm">
        <div className="text-center p-6">
          <div className="w-56 h-56 bg-base-gray border-4 border-base-black mx-auto mb-4 flex items-center justify-center font-retro-display text-5xl font-black rounded-retro">{qrCode}</div>
          <p className="font-retro-mono text-sm text-base-black/60">Kode: <strong>{qrCode}</strong></p>
          <p className="font-retro-mono text-xs text-base-black/40 mt-1">Tampilkan ke siswa atau minta input manual</p>
        </div>
      </Modal>

      <Modal isOpen={isCreateOpen} onClose={()=>setIsCreateOpen(false)} title="✨ Buat Sesi Absensi Baru" maxWidth="lg">
        <form onSubmit={e=>{e.preventDefault();createSession.mutate(form);}} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Kelas *</label>
              <select value={form.class_id} onChange={e=>setForm(f=>({...f,class_id:e.target.value}))} required
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange">
                <option value="">-- Pilih Kelas --</option>
                {(classes?.data||[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Mata Pelajaran *</label>
              <select value={form.subject_id} onChange={e=>setForm(f=>({...f,subject_id:e.target.value}))} required
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange">
                <option value="">-- Pilih Mapel --</option>
                {(subjects?.data||[]).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Tanggal</label>
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange"/>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Mulai</label>
                <input type="time" value={form.start_time} onChange={e=>setForm(f=>({...f,start_time:e.target.value}))}
                  className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange"/>
              </div>
              <div className="flex-1">
                <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Selesai</label>
                <input type="time" value={form.end_time} onChange={e=>setForm(f=>({...f,end_time:e.target.value}))}
                  className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange"/>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Lokasi / Ruang</label>
              <input type="text" placeholder="Contoh: Lab Komputer 1" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange"/>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={()=>setIsCreateOpen(false)}>Batal</Button>
            <Button type="submit" disabled={createSession.isLoading}><Sparkles className="w-4 h-4 mr-1"/>{createSession.isLoading?'Membuat...':'Buat Sesi'}</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
