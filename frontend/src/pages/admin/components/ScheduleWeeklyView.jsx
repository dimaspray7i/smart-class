import React from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, School } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const dayOptions = [
  { value: 'senin', label: 'Senin' },
  { value: 'selasa', label: 'Selasa' },
  { value: 'rabu', label: 'Rabu' },
  { value: 'kamis', label: 'Kamis' },
  { value: 'jumat', label: 'Jumat' },
  { value: 'sabtu', label: 'Sabtu' },
];

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export function ScheduleWeeklyView({
  schedules,
  classes,
  subjects,
  onView,
}) {
  const getClassName = (id) => (Array.isArray(classes) ? classes.find(c => c.id === id)?.name : '') || '-';
  const getSubjectName = (id) => (Array.isArray(subjects) ? subjects.find(s => s.id === id)?.name : '') || '-';

  return (
    <motion.div variants={itemVariants} className="retro-card bg-base-white overflow-hidden p-6">
      <div className="overflow-x-auto">
        <div className="min-w-[800px] grid grid-cols-6 gap-3">
          <div className="font-black text-[10px] uppercase tracking-widest text-base-black/40 p-2 text-center flex items-center justify-center border-2 border-dashed border-base-black/10 rounded-retro-sm">Waktu</div>
          {dayOptions.map(d => (
            <div key={d.value} className="retro-card bg-retro-blue text-base-white border-2 border-base-black p-3 text-center font-black text-xs uppercase tracking-tight shadow-hard-sm">
              {d.label}
            </div>
          ))}

          {['07:00', '08:30', '10:00', '11:30', '13:00', '14:30'].map(time => (
            <React.Fragment key={time}>
              <div className="p-2 flex items-center justify-center font-retro-mono text-xs font-black text-base-black/60 bg-base-gray/10 rounded-retro-sm border-2 border-base-black/5">
                {time}
              </div>
              {dayOptions.map(d => {
                const slot = schedules.find(s => s.day === d.value && s.start_time === time && s.is_active);
                return (
                  <motion.div
                    key={`${d.value}-${time}`}
                    whileHover={slot ? { scale: 1.02, y: -2 } : {}}
                    className={twMerge(
                      "p-3 border-2 rounded-retro-sm min-h-[80px] transition-all",
                      slot
                        ? "bg-retro-yellow/20 border-retro-yellow shadow-hard-sm cursor-pointer"
                        : "bg-base-gray/5 border-base-black/5 border-dashed"
                    )}
                    onClick={() => slot && onView(slot)}
                  >
                    {slot ? (
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-base-black leading-tight uppercase truncate">{getSubjectName(slot.subject_id)}</p>
                        <div className="flex items-center gap-1">
                          <School className="w-2.5 h-2.5 text-retro-orange" />
                          <span className="font-retro-mono text-[9px] font-bold text-base-black/60 truncate">{getClassName(slot.class_id)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-retro-purple" />
                          <span className="font-retro-mono text-[9px] text-base-black/40 truncate">{slot.room || '-'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Plus className="w-4 h-4 text-base-black/20" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="mt-8 flex items-center justify-center gap-4 py-4 bg-base-gray/5 border-2 border-dashed border-base-black/10 rounded-retro-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-retro-yellow/20 border-2 border-retro-yellow rounded-sm" />
          <span className="text-[10px] font-retro-mono font-bold text-base-black/60 uppercase">Jadwal Aktif</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-base-gray/5 border-2 border-dashed border-base-black/10 rounded-sm" />
          <span className="text-[10px] font-retro-mono font-bold text-base-black/60 uppercase">Slot Kosong</span>
        </div>
        <p className="text-[10px] font-retro-mono text-base-black/40 italic ml-4">
          💡 Tampilan mingguan hanya menampilkan jadwal aktif.
        </p>
      </div>
    </motion.div>
  );
}
