import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Edit2, Trash2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export function ScheduleGridView({
  schedules,
  classes,
  subjects,
  teachers,
  selectedIds,
  onSelect,
  onEdit,
  onDelete,
  onView,
}) {
  const getClassName = (id) => (Array.isArray(classes) ? classes.find(c => c.id === id)?.name : '') || '-';
  const getSubjectName = (id) => (Array.isArray(subjects) ? subjects.find(s => s.id === id)?.name : '') || '-';
  const getTeacherName = (id) => (Array.isArray(teachers) ? teachers.find(t => t.id === id)?.name : '') || '-';

  return (
    <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {schedules.map((schedule) => (
        <motion.div
          key={schedule.id}
          variants={itemVariants}
          whileHover={{ y: -4, rotate: 1 }}
          className={twMerge(
            "retro-card relative group p-4 bg-base-white",
            selectedIds.includes(schedule.id) && "ring-4 ring-retro-orange shadow-hard"
          )}
        >
          <div className="absolute top-3 right-3 z-10">
            <input
              type="checkbox"
              checked={selectedIds.includes(schedule.id)}
              onChange={() => onSelect(schedule.id)}
              className="w-4 h-4 accent-retro-orange border-2 border-base-black cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 retro-card bg-retro-orange/20 border-retro-orange flex items-center justify-center">
              <Calendar className="w-6 h-6 text-retro-orange" />
            </div>
            <div className="min-w-0">
              <h4 className="font-retro-display font-black text-base-black text-sm truncate">{getClassName(schedule.class_id)}</h4>
              <p className="text-[10px] font-retro-mono text-base-black/60 capitalize">{schedule.day}</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-base-black/80 truncate font-black">{getSubjectName(schedule.subject_id)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-base-black/80 truncate">{getTeacherName(schedule.teacher_id)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-base-black/80">{schedule.start_time} - {schedule.end_time}</span>
            </div>
            {schedule.room && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-base-black/80 truncate">Ruang {schedule.room}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t-2 border-base-black/10 flex justify-between items-center">
            <span className={`retro-badge text-[10px] ${schedule.is_active ? 'retro-badge-green' : 'retro-badge-red'}`}>
              {schedule.is_active ? 'AKTIF' : 'NON-AKTIF'}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(schedule)} className="p-1.5 retro-btn retro-btn-sm retro-btn-outline"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => onDelete(schedule.id)} className="p-1.5 retro-btn retro-btn-sm bg-danger text-base-white border-danger"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
