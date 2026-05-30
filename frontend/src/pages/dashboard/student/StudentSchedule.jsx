import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, AlertCircle, BookOpen, Star } from 'lucide-react';
import studentApi from '../../../api/student';
import { motion } from 'framer-motion';
import { PageHeader, RetroSection, RetroCard } from '../../../components/ui/RetroLayouts';

// 🎨 ANIMATION VARIANTS
const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 } 
  }
};

export default function StudentSchedule() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState('');

  const fetchSchedule = async (day = '') => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentApi.getSchedules(day ? { day } : {});
      if (res.status === 'success') {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat jadwal pelajaran dari server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(selectedDay);
  }, [selectedDay]);

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] retro-card bg-base-white p-8 shadow-hard">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 retro-card bg-retro-purple border-4 border-base-black flex items-center justify-center mb-4"
        >
          <BookOpen className="w-8 h-8 text-base-white animate-pulse" />
        </motion.div>
        <p className="font-retro-display font-black text-xs text-base-black uppercase tracking-widest animate-pulse">
          Mengambil Data Jadwal...
        </p>
        <div className="w-48 h-2 bg-base-gray border-2 border-base-black rounded-sm overflow-hidden mt-3">
          <motion.div 
            className="h-full bg-retro-purple"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            style={{ width: '50%' }}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border-4 border-base-black bg-danger/10 p-8 rounded-retro shadow-hard text-center">
        <AlertCircle className="w-12 h-12 text-danger mb-3 animate-bounce" />
        <h3 className="retro-heading text-lg mb-2">Oops! Gagal Memuat Jadwal</h3>
        <p className="font-retro-mono text-xs font-black text-base-black/70 uppercase tracking-widest mb-4">
          {error}
        </p>
        <button
          onClick={() => fetchSchedule(selectedDay)}
          className="retro-btn flex items-center gap-2 bg-base-black text-base-white hover:bg-retro-orange py-2 px-4"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const todaySchedule = data?.today || [];
  const allSchedules = data?.schedules || {};
  const currentClass = data?.class || null;

  return (
    <div className="space-y-6">
      
      {/* ── Page Header ──────────────────────────────────── */}
      <PageHeader 
        title="Jadwal Pelajaran"
        icon={Calendar}
        description="Pantau pembagian jam pelajaran kelas Anda untuk mengoptimalkan efisiensi belajar."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard/student' },
          { label: 'Jadwal', path: '/dashboard/student/schedule' }
        ]}
        actions={
          <div className="retro-sticker bg-retro-yellow text-base-black text-[10px] px-3 py-1 font-black shadow-hard-sm border-2 border-base-black">
            KELAS: {currentClass ? currentClass.name : '—'}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Today's Schedule Panel ─────────────────────── */}
        <div className="lg:col-span-1">
          <RetroCard variant="white" className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 border-b-4 border-base-black pb-3">
                <Clock className="w-4 h-4 text-retro-purple" />
                <h3 className="font-retro-display font-black text-base-black uppercase tracking-tight text-xs">
                  Hari Ini ({data?.today_name})
                </h3>
              </div>

              {todaySchedule.length === 0 ? (
                <div className="text-center py-12 border-4 border-dashed border-base-black/20 rounded-retro bg-base-cream/20">
                  <AlertCircle className="w-10 h-10 mx-auto text-base-black/20 mb-2" />
                  <p className="text-[10px] font-retro-mono font-bold uppercase text-base-black/40">
                    Tidak ada jadwal pelajaran hari ini
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaySchedule.map((s) => (
                    <motion.div
                      key={s.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className={`border-4 border-base-black p-4 rounded-retro transition-all shadow-hard-sm ${
                        s.is_now
                          ? 'bg-retro-purple/10 border-l-8 border-l-retro-purple shadow-hard'
                          : 'bg-base-white'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[8px] font-retro-mono font-black uppercase bg-base-black text-base-white px-2 py-0.5 rounded shadow-hard-sm">
                          {s.start_time} - {s.end_time}
                        </span>
                        {s.is_now && (
                          <span className="text-[8px] font-retro-mono font-black uppercase bg-retro-purple text-base-white px-2 py-0.5 rounded border-2 border-base-black animate-pulse shadow-hard-sm">
                            NOW
                          </span>
                        )}
                      </div>
                      <h4 className="font-retro-display font-black text-xs text-base-black uppercase tracking-wide leading-tight">
                        {s.subject?.name}
                      </h4>
                      <p className="text-[9px] font-retro-mono font-bold text-base-black/60 uppercase mt-1">
                        {s.teacher?.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-3 text-[9px] font-retro-mono font-bold text-retro-purple uppercase">
                        <MapPin className="w-4 h-4 text-base-black" />
                        <span>{s.room || 'Ruang Kelas'}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </RetroCard>
        </div>

        {/* ── Weekly Schedule Panel ──────────────────────── */}
        <div className="lg:col-span-2">
          <RetroCard variant="white" className="h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b-4 border-base-black pb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-retro-orange" />
                <h3 className="font-retro-display font-black text-base-black uppercase tracking-tight text-xs">
                  Jadwal Mingguan
                </h3>
              </div>

              {/* Day Filter Controls */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedDay('')}
                  className={`px-3 py-1 border-2 border-base-black rounded-retro text-[9px] font-retro-display font-black uppercase tracking-wider transition-all shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 ${
                    selectedDay === ''
                      ? 'bg-base-black text-base-white'
                      : 'bg-base-white text-base-black hover:bg-retro-yellow/20'
                  }`}
                >
                  Semua
                </button>
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-1 border-2 border-base-black rounded-retro text-[9px] font-retro-display font-black uppercase tracking-wider transition-all shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 ${
                      selectedDay === day
                        ? 'bg-retro-purple text-base-white border-base-black shadow-hard-sm'
                        : 'bg-base-white text-base-black hover:bg-retro-purple/10'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {Object.keys(allSchedules).length === 0 ? (
              <div className="text-center py-16 border-4 border-dashed border-base-black/20 rounded-retro bg-base-cream/20">
                <BookOpen className="w-12 h-12 mx-auto text-base-black/20 mb-2" />
                <p className="text-[10px] font-retro-mono font-bold uppercase text-base-black/40">
                  Data jadwal pelajaran kosong
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(allSchedules)
                  .filter(([dayName]) => !selectedDay || dayName.toLowerCase() === selectedDay.toLowerCase())
                  .map(([dayName, schedules]) => (
                    <div key={dayName} className="space-y-3">
                      <h4 className="font-retro-display font-black text-xs text-base-black border-l-4 border-base-black pl-2.5 uppercase tracking-widest bg-retro-yellow/15 py-1 rounded-sm">
                        📅 Hari {dayName}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {schedules.map((s) => (
                          <motion.div
                            key={s.id}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            className="border-2 border-base-black bg-base-cream/10 p-4 rounded-retro hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-base-white transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-center mb-2.5 border-b border-base-black/5 pb-2">
                                <span className="text-[8px] font-retro-mono font-black uppercase bg-retro-purple/15 text-retro-purple px-2 py-0.5 border border-retro-purple rounded leading-none">
                                  {s.start_time} - {s.end_time}
                                </span>
                                <span className="retro-sticker text-[7px] px-1.5 py-0 bg-base-black text-base-white leading-none">
                                  {s.subject?.code}
                                </span>
                              </div>
                              <h5 className="font-retro-display font-black text-xs text-base-black uppercase tracking-wide leading-tight">
                                {s.subject?.name}
                              </h5>
                              <p className="text-[9px] font-retro-mono font-bold text-base-black/50 uppercase mt-1 leading-normal">
                                {s.teacher?.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 mt-3 text-[9px] font-retro-mono font-bold text-retro-purple uppercase">
                              <MapPin className="w-4 h-4 text-base-black" />
                              <span>{s.room || 'Ruang Kelas'}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </RetroCard>
        </div>

      </div>
    </div>
  );
}
