import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, Clock, MapPin, BookOpen, Sparkles, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../api';
import Toast from '../../components/ui/Toast';

const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
// Helper to get day name in Indonesian
const getTodayName = () => {
  const day = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
  return day === 'Minggu' ? 'Senin' : day; // Fallback for Sunday
};
const TODAY_DAY = getTodayName();

function ScheduleCard({ item, isToday, onGenerateSession, isGenerating }) {
  const isNow = item.is_now;

  return (
    <motion.div variants={cardVariants} whileHover={{ x: 4 }}
      className={`p-4 rounded-retro border-2 transition-all ${
        isToday ? (isNow ? 'border-success bg-success/10 shadow-[4px_4px_0px_0px_#00B894]' : 'border-retro-orange bg-retro-orange/5 shadow-[3px_3px_0px_0px_#FF5C00]') : 'border-base-black bg-base-white hover:bg-retro-yellow/10'
      }`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-3 rounded-retro border-2 border-base-black flex-shrink-0 ${
            isToday ? (isNow ? 'bg-success text-white' : 'bg-retro-orange text-white') : 'bg-base-gray'
          }`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-retro-display font-black text-base-black text-lg">{item.subject?.name}</h3>
              {item.day && (
                <span className="px-2 py-0.5 rounded-retro bg-retro-blue/10 border border-retro-blue text-[9px] text-retro-blue font-retro-mono font-black uppercase">
                  {item.day}
                </span>
              )}
            </div>
            <p className="font-retro-mono text-xs text-base-black/70 mt-0.5">
              Kelas {item.class?.name}
            </p>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="flex items-center gap-1.5 font-retro-mono text-xs text-base-black/70 bg-base-white px-2 py-1 rounded-full border border-base-black/20">
                <Clock className="w-3.5 h-3.5" /> {item.start_time} – {item.end_time}
              </span>
              {item.room && (
                <span className="flex items-center gap-1.5 font-retro-mono text-xs text-base-black/70 bg-base-white px-2 py-1 rounded-full border border-base-black/20">
                  <MapPin className="w-3.5 h-3.5" /> {item.room}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {isToday && (
          <div className="flex flex-col items-end gap-2 shrink-0">
            {isNow && (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-success text-white border-2 border-base-black">
                WAKTU SEKARANG
              </span>
            )}
            <button 
              onClick={() => onGenerateSession(item.id)}
              disabled={isGenerating}
              className={`flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 border-2 border-base-black rounded-retro font-retro-mono text-xs font-black transition-all ${
                isNow ? 'bg-retro-blue text-white shadow-[2px_2px_0px_0px_#111] hover:bg-retro-blue/90' : 'bg-white hover:bg-base-gray/20'
              }`}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isGenerating ? 'Membuat...' : 'Buat Sesi Absen'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function TeacherSchedules() {
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Load classes taught by teacher
  const { data: classesData } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => api.get('/teacher/classes'),
  });

  // Load subjects taught by teacher
  const { data: subjectsData } = useQuery({
    queryKey: ['teacher-subjects'],
    queryFn: () => api.get('/teacher/subjects'),
  });

  // Load schedule based on filters
  const { data: schedule, isLoading, isError } = useQuery({
    queryKey: ['teacher-schedule', selectedDay.toLowerCase(), selectedClass, selectedSubject],
    queryFn: () => api.get(`/teacher/schedule/today`, {
      params: {
        day: selectedDay.toLowerCase(),
        class_id: selectedClass || undefined,
        subject_id: selectedSubject || undefined
      }
    }),
  });

  const classes = classesData?.data || [];
  const subjects = subjectsData?.data || [];
  const scheduleList = schedule?.data || [];

  const generateSession = useMutation({
    mutationFn: (scheduleId) => api.post(`/teacher/attendance/generate/${scheduleId}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-sessions-today'] });
      setToast({ message: 'Sesi absensi berhasil dibuat!', type: 'success' });
      setTimeout(() => {
        navigate('/dashboard/teacher/attendance');
      }, 1000);
    },
    onError: (err) => {
      setToast({ message: err.response?.data?.message || 'Gagal membuat sesi absensi.', type: 'error' });
    }
  });

  const isTodaySelected = selectedDay.toLowerCase() === TODAY_DAY.toLowerCase();

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      {/* Header Info */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3">
              <CalendarCheck className="w-8 h-8" /> Jadwal Mengajar
            </h1>
            <p className="font-retro-mono text-sm text-base-black/70 mt-1">
              Manajemen jadwal dan pembuatan sesi absensi.
            </p>
          </div>
          {scheduleList.length > 0 && (
            <div className="retro-card bg-retro-yellow/20 border-2 border-retro-yellow px-4 py-2 shrink-0 text-center">
              <span className="font-retro-mono text-xs font-black">📚 {scheduleList.length} Jam Pelajaran</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Advanced Filters */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-5 space-y-4">
        <h3 className="font-retro-display font-black text-sm text-base-black uppercase tracking-wider flex items-center gap-2">
          ⚙️ Filter Jadwal & Penugasan
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Day Filter */}
          <div className="space-y-1">
            <label className="font-retro-mono text-[10px] text-base-black/60 uppercase font-black">Hari</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full p-2.5 rounded-retro border-2 border-base-black font-retro-mono text-xs bg-base-white focus:outline-none focus:border-retro-blue focus:ring-1 focus:ring-retro-blue"
            >
              <option value="all">Semua Hari</option>
              <option value="senin">Senin</option>
              <option value="selasa">Selasa</option>
              <option value="rabu">Rabu</option>
              <option value="kamis">Kamis</option>
              <option value="jumat">Jumat</option>
              <option value="sabtu">Sabtu</option>
            </select>
          </div>

          {/* Class Filter */}
          <div className="space-y-1">
            <label className="font-retro-mono text-[10px] text-base-black/60 uppercase font-black">Kelas</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2.5 rounded-retro border-2 border-base-black font-retro-mono text-xs bg-base-white focus:outline-none focus:border-retro-blue focus:ring-1 focus:ring-retro-blue"
            >
              <option value="">Semua Kelas</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="space-y-1">
            <label className="font-retro-mono text-[10px] text-base-black/60 uppercase font-black">Mata Pelajaran</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2.5 rounded-retro border-2 border-base-black font-retro-mono text-xs bg-base-white focus:outline-none focus:border-retro-blue focus:ring-1 focus:ring-retro-blue"
            >
              <option value="">Semua Mapel</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter (Mock) */}
          <div className="space-y-1">
            <label className="font-retro-mono text-[10px] text-base-black/60 uppercase font-black">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full p-2.5 rounded-retro border-2 border-base-black font-retro-mono text-xs bg-base-white focus:outline-none focus:border-retro-blue focus:ring-1 focus:ring-retro-blue"
            >
              <option value="1">Semester 1 (Ganjil)</option>
              <option value="2">Semester 2 (Genap)</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Schedule List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="retro-card bg-base-white border-4 border-base-black p-10 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-4 border-t-retro-blue border-r-transparent border-b-retro-blue border-l-transparent mx-auto"
            />
            <p className="font-retro-mono text-base-black/60 mt-4">Memuat jadwal...</p>
          </div>
        ) : isError ? (
          <div className="retro-card bg-danger/10 border-4 border-danger p-10 text-center">
            <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3" />
            <p className="font-retro-mono font-black text-danger">Gagal memuat jadwal!</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-white border-2 border-danger rounded-retro font-retro-mono text-xs hover:bg-danger/5 transition-colors">
              Coba Lagi
            </button>
          </div>
        ) : scheduleList.length > 0 ? (
          scheduleList.map((item) => (
            <ScheduleCard 
              key={item.id} 
              item={item} 
              isToday={isTodaySelected || (selectedDay === 'all' && item.day?.toLowerCase() === TODAY_DAY.toLowerCase())}
              onGenerateSession={(id) => generateSession.mutate(id)}
              isGenerating={generateSession.isPending && generateSession.variables === item.id}
            />
          ))
        ) : (
          <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-dashed border-base-black p-16 text-center">
            <div className="w-20 h-20 bg-base-gray/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarCheck className="w-10 h-10 text-base-black/30" />
            </div>
            <h3 className="font-retro-display font-black text-xl text-base-black mb-2">Jadwal Kosong</h3>
            <p className="font-retro-mono text-base-black/50">
              Tidak ada jadwal mengajar yang cocok dengan filter yang dipilih
            </p>
          </motion.div>
        )}
      </div>

      {/* Tips */}
      <motion.div variants={cardVariants} className="retro-card bg-retro-blue/10 border-4 border-retro-blue p-5">
        <h3 className="font-retro-display font-black text-retro-blue mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Info & Tips
        </h3>
        <ul className="space-y-2">
          {[
            'Jadwal yang ditampilkan sesuai dengan pembagian tugas dari kurikulum.',
            'Anda dapat langsung membuat Sesi Absensi dari jadwal di hari ini.',
            'Jika ada perubahan jadwal mendadak, Anda juga bisa membuat sesi absensi manual di menu Absensi.',
          ].map((info, i) => (
            <li key={i} className="font-retro-mono text-xs text-retro-blue/80 flex gap-2 leading-relaxed">
              <span className="font-black mt-0.5">•</span> {info}
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
