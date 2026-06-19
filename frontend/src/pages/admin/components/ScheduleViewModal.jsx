import React from 'react';
import { Calendar, BookOpen, Users, MapPin, Clock } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { RetroCard } from '@/components/ui/RetroLayouts';

export function ScheduleViewModal({
  isOpen,
  onClose,
  selectedSchedule,
  classes,
  subjects,
  teachers,
  onEdit,
}) {
  const getClassName = (id) => (Array.isArray(classes) ? classes.find(c => c.id === id)?.name : '') || '-';
  const getSubjectName = (id) => (Array.isArray(subjects) ? subjects.find(s => s.id === id)?.name : '') || '-';
  const getTeacherName = (id) => (Array.isArray(teachers) ? teachers.find(t => t.id === id)?.name : '') || '-';

  return (
    <AnimatePresence>
      {isOpen && selectedSchedule && (
        <Modal isOpen={isOpen} onClose={onClose} title="Detail Jadwal" size="lg">
          <div className="space-y-8">
            <div className="flex items-center gap-6 p-4 bg-retro-orange/5 border-2 border-retro-orange rounded-retro">
              <div className="w-20 h-20 retro-card bg-retro-orange border-4 border-base-black flex items-center justify-center flex-shrink-0 shadow-hard">
                <Calendar className="w-10 h-10 text-base-white" />
              </div>
              <div className="min-w-0">
                <span className="retro-badge retro-badge-orange text-[9px] mb-2 inline-block">SESI KELAS</span>
                <h3 className="retro-heading text-2xl text-base-black truncate">{getClassName(selectedSchedule.class_id)}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-retro-display font-black text-retro-orange uppercase text-xs">{selectedSchedule.day}</span>
                  <span className="text-base-black/30 font-black">•</span>
                  <span className="font-retro-mono text-xs text-base-black/60">{selectedSchedule.start_time} - {selectedSchedule.end_time}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 border-2 border-retro-purple rounded-retro bg-retro-purple/5">
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="w-5 h-5 text-retro-purple" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-base-black/50">Mata Pelajaran</h4>
                </div>
                <p className="font-retro-display font-black text-base-black text-lg truncate">
                  {getSubjectName(selectedSchedule.subject_id)}
                </p>
              </div>

              <div className="p-4 border-2 border-retro-blue rounded-retro bg-retro-blue/5">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-5 h-5 text-retro-blue" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-base-black/50">Guru</h4>
                </div>
                <p className="font-retro-display font-black text-base-black text-lg truncate">
                  {getTeacherName(selectedSchedule.teacher_id)}
                </p>
              </div>

              <div className="p-4 border-2 border-base-black/20 rounded-retro bg-base-white">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-retro-orange" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-base-black/50">Lokasi</h4>
                </div>
                <p className="font-retro-display font-black text-base-black text-lg">
                  {selectedSchedule.room || 'Belum Ditentukan'}
                </p>
              </div>

              <div className="p-4 border-2 border-retro-lime rounded-retro bg-retro-lime/5">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-retro-lime" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-base-black/50">Status</h4>
                </div>
                <span className={twMerge(
                  "retro-badge text-xs px-4",
                  selectedSchedule.is_active ? "retro-badge-green" : "retro-badge-red"
                )}>
                  {selectedSchedule.is_active ? 'SESI AKTIF' : 'NON-AKTIF'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t-4 border-base-black">
              <Button variant="outline" onClick={onClose}>Tutup</Button>
              <Button variant="primary" onClick={() => { onClose(); onEdit(selectedSchedule); }}>Ubah Entri</Button>
            </div>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  );
}
