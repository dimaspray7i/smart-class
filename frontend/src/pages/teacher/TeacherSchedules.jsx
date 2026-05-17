import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CalendarCheck, Clock, MapPin, BookOpen, Sparkles } from 'lucide-react';
import { api } from '../../api';

const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const TODAY_DAY = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

function ScheduleCard({ item, isToday }) {
  return (
    <motion.div whileHover={{ x: 4 }}
      className={`p-4 rounded-retro border-2 transition-all ${isToday ? 'border-retro-orange bg-retro-orange/10 shadow-[3px_3px_0px_0px_#FF5C00]' : 'border-base-black bg-base-white hover:bg-retro-yellow/10'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-retro border-2 border-base-black flex-shrink-0 ${isToday ? 'bg-retro-orange text-base-white' : 'bg-base-gray'}`}>
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="font-retro-display font-black text-base-black">{item.subject?.name}</p>
            <p className="font-retro-mono text-[10px] text-base-black/60 mt-0.5">
              Kelas {item.class?.name}
            </p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 font-retro-mono text-[10px] text-base-black/60">
                <Clock className="w-3 h-3" /> {item.start_time} – {item.end_time}
              </span>
              {item.room && (
                <span className="flex items-center gap-1 font-retro-mono text-[10px] text-base-black/60">
                  <MapPin className="w-3 h-3" /> {item.room}
                </span>
              )}
            </div>
          </div>
        </div>
        {isToday && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-retro-lime border-2 border-base-black flex-shrink-0">
            Hari Ini
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function TeacherSchedules() {
  const [selectedDay, setSelectedDay] = useState(TODAY_DAY);

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['teacher-schedule', 'today'],
    queryFn: () => api.get('/teacher/schedule/today'),
  });

  const scheduleList = schedule?.data || [];

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3">
              <CalendarCheck className="w-8 h-8" /> Jadwal Mengajar
            </h1>
            <p className="font-retro-mono text-sm text-base-black/70 mt-1">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="retro-card bg-retro-yellow/20 border-2 border-retro-yellow px-4 py-2">
            <span className="font-retro-mono text-xs font-black">📚 {scheduleList.length} Jam Pelajaran Hari Ini</span>
          </div>
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-2 flex gap-1 overflow-x-auto">
        {DAYS.map(day => (
          <button key={day} onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-retro font-retro-mono text-xs font-black uppercase tracking-wide border-2 border-base-black whitespace-nowrap transition-all ${selectedDay === day ? 'bg-retro-blue text-base-white shadow-[2px_2px_0px_0px_#111]' : 'bg-base-white hover:bg-retro-yellow/20'}`}>
            {day === TODAY_DAY ? `⭐ ${day}` : day}
          </button>
        ))}
      </motion.div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="retro-card bg-base-white border-4 border-base-black p-10 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <CalendarCheck className="w-10 h-10 text-retro-blue" />
            </motion.div>
            <p className="font-retro-mono text-base-black/60 mt-3">Memuat jadwal...</p>
          </div>
        ) : scheduleList.length > 0 ? (
          scheduleList.map((item, idx) => (
            <ScheduleCard key={item.id} item={item} isToday={selectedDay === TODAY_DAY && idx === 0} />
          ))
        ) : (
          <div className="retro-card bg-base-white border-4 border-dashed border-base-black p-12 text-center">
            <CalendarCheck className="w-14 h-14 text-base-black/20 mx-auto mb-3" />
            <p className="font-retro-mono text-base-black/50">📭 Tidak ada jadwal mengajar hari {selectedDay.toLowerCase()}</p>
          </div>
        )}
      </div>

      <motion.div variants={cardVariants} className="retro-card bg-retro-blue/10 border-4 border-retro-blue p-5">
        <h3 className="font-retro-display font-black text-retro-blue mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Info Jadwal
        </h3>
        <ul className="space-y-1.5">
          {[
            'Jadwal yang ditampilkan adalah jadwal aktif untuk hari ini.',
            'Gunakan tombol "Gen QR" di dashboard untuk membuat sesi absensi dari jadwal.',
            'Hubungi admin jika terdapat perubahan jadwal mengajar.',
          ].map((info, i) => (
            <li key={i} className="font-retro-mono text-xs text-retro-blue/80 flex gap-2">
              <span>•</span> {info}
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
