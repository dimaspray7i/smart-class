import React from 'react';
import { AlertCircle, Clock, Users } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const dayOptions = [
  { value: 'senin', label: 'Senin' },
  { value: 'selasa', label: 'Selasa' },
  { value: 'rabu', label: 'Rabu' },
  { value: 'kamis', label: 'Kamis' },
  { value: 'jumat', label: 'Jumat' },
  { value: 'sabtu', label: 'Sabtu' },
];

const quickTimeTemplates = [
  { label: 'Pagi (07:00-08:30)', start: '07:00', end: '08:30' },
  { label: 'Siang (10:00-11:30)', start: '10:00', end: '11:30' },
  { label: 'Sore (13:00-14:30)', start: '13:00', end: '14:30' },
  { label: 'Ekstra (15:00-16:30)', start: '15:00', end: '16:30' },
];

export function ScheduleFormModal({
  isOpen,
  isCreate,
  onClose,
  onSubmit,
  formData,
  setFormData,
  errors,
  classes,
  subjects,
  teachers,
  filteredTeachers,
  isLoading,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          title={isCreate ? "Tambah Jadwal Baru" : "Ubah Entri Jadwal"}
          size="2xl"
        >
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Select
                  label="Kelas Sasaran"
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  options={[
                    { value: '', label: 'Pilih Kelas' },
                    ...classes.map(c => ({ value: c.id, label: c.name }))
                  ]}
                  required
                  error={errors.class_id}
                />
                <Select
                  label="Mata Pelajaran"
                  value={formData.subject_id}
                  onChange={(e) => {
                    const newSubjectId = e.target.value;
                    const targetSubjectId = Number(newSubjectId);
                    const eligibleTeachers = teachers.filter(t =>
                      (t.profile?.subjects || []).some(s => s.id === targetSubjectId)
                    );

                    let nextTeacherId = '';
                    if (eligibleTeachers.length === 1) {
                      nextTeacherId = eligibleTeachers[0].id;
                    } else if (formData.teacher_id) {
                      const keepsTeacher = eligibleTeachers.some(t => t.id === Number(formData.teacher_id));
                      if (keepsTeacher) nextTeacherId = formData.teacher_id;
                    }

                    setFormData(prev => ({
                      ...prev,
                      subject_id: newSubjectId,
                      teacher_id: nextTeacherId
                    }));
                  }}
                  options={[
                    { value: '', label: 'Pilih Mata Pelajaran' },
                    ...subjects.map(s => ({ value: s.id, label: `${s.code} - ${s.name}` }))
                  ]}
                  required
                  error={errors.subject_id}
                />
                {formData.subject_id && filteredTeachers.length === 1 ? (
                  <div className="space-y-1.5">
                    <label className="font-retro-mono text-xs uppercase text-base-black font-black flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Guru Pengampu</label>
                    <div className="w-full px-3 py-2 border-2 border-base-black rounded-retro bg-base-gray/20 font-retro-mono text-sm text-base-black/70 cursor-not-allowed">
                      {filteredTeachers[0].name}
                    </div>
                    <p className="text-[10px] text-base-black/50 font-retro-mono mt-1 italic">Diisi otomatis berdasarkan mapel terpilih.</p>
                  </div>
                ) : formData.subject_id && filteredTeachers.length > 1 ? (
                  <Select
                    label="Pilih Guru Pengampu"
                    value={formData.teacher_id}
                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                    options={[
                      { value: '', label: 'Terdapat beberapa guru, silakan pilih' },
                      ...filteredTeachers.map(t => ({ value: t.id, label: t.name }))
                    ]}
                    required
                    error={errors.teacher_id}
                  />
                ) : formData.subject_id && filteredTeachers.length === 0 ? (
                  <div className="space-y-1.5">
                    <label className="font-retro-mono text-xs uppercase text-base-black font-black flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Guru Pengampu</label>
                    <div className="w-full px-3 py-2 border-2 border-danger rounded-retro bg-danger/10 font-retro-mono text-sm text-danger cursor-not-allowed">
                      Tidak ada guru yang mengampu mapel ini
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Hari"
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    options={dayOptions}
                    required
                  />
                  <Input
                    label="Ruangan"
                    placeholder="Contoh: LAB-01"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Waktu Mulai"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                  <Input
                    label="Waktu Selesai"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>

                <div className="p-3 retro-card bg-retro-yellow/5 border-retro-yellow/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-base-black/40 mb-3 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Templat Cepat
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickTimeTemplates.map(t => (
                      <button
                        type="button"
                        key={t.label}
                        onClick={() => setFormData({ ...formData, start_time: t.start, end_time: t.end })}
                        className="px-2 py-1 bg-base-white border-2 border-base-black rounded-retro-sm text-[9px] font-black hover:bg-retro-yellow transition-colors"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-base-gray/5 rounded-retro-sm">
                  <input
                    type="checkbox"
                    id="is_active_check"
                    checked={formData.is_active !== false}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 accent-retro-orange border-2 border-base-black rounded-sm"
                  />
                  <label htmlFor="is_active_check" className="text-xs font-black uppercase tracking-tight text-base-black/60 cursor-pointer">
                    Aktifkan Jadwal
                  </label>
                </div>
              </div>
            </div>

            {errors.non_field_errors && (
              <div className="p-4 retro-card bg-danger/10 border-danger border-2 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-danger" />
                <div>
                  <p className="text-xs font-black uppercase text-danger">Konflik Jadwal!</p>
                  <p className="text-[10px] font-retro-mono text-base-black/70 mt-1">{Array.isArray(errors.non_field_errors) ? errors.non_field_errors[0] : errors.non_field_errors}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t-4 border-base-black">
              <Button variant="outline" type="button" onClick={onClose}>Batal</Button>
              <Button variant="primary" type="submit" loading={isLoading}>
                {isCreate ? 'Tambah Jadwal' : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AnimatePresence>
  );
}
