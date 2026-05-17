import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Eye, CalendarCheck, TrendingUp, ChevronRight } from 'lucide-react';
import { api } from '../../api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

export default function TeacherStudents() {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const { data: students, isLoading } = useQuery({
    queryKey: ['teacher-students'],
    queryFn: () => api.get('/teacher/students'),
  });
  const { data: classes } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => api.get('/teacher/classes'),
  });

  const filteredStudents = useMemo(() => {
    let list = students?.data || [];
    if (classFilter !== 'all') list = list.filter(s => String(s.class_id) === classFilter);
    if (search) list = list.filter(s =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.nis?.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [students, search, classFilter]);

  const classList = classes?.data || [];

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3">
          <Users className="w-8 h-8" /> Data Siswa
        </h1>
        <p className="font-retro-mono text-sm text-base-black/70 mt-1">Pantau profil, kehadiran, dan perkembangan siswa Anda</p>
      </motion.div>

      <motion.div variants={cardVariants} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          ['Total Siswa', filteredStudents.length, '#6C5CE7', Users],
          ['Kelas Aktif', classList.length, '#2E2BBF', CalendarCheck],
          ['Rata Kehadiran', '—', '#00B894', TrendingUp],
        ].map(([label, value, color, Icon]) => (
          <div key={label} className="retro-card bg-base-white border-2 border-base-black p-3 flex items-center gap-3">
            <div className="p-2 rounded-retro border-2 border-base-black" style={{ background: `${color}20` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="retro-heading text-xl" style={{ color }}>{value}</p>
              <p className="font-retro-mono text-[10px] text-base-black/60 uppercase">{label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-black/40" />
          <input type="text" placeholder="Cari nama atau NIS..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 py-2 pr-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-gray/20 focus:outline-none focus:border-retro-orange" />
        </div>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange">
          <option value="all">Semua Kelas</option>
          {classList.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
      </motion.div>

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-retro-blue text-base-white border-b-4 border-base-black">
                {['No', 'Nama Siswa', 'NIS', 'Kelas', 'Kehadiran', 'Aksi'].map(h => (
                  <th key={h} className="p-4 font-retro-display tracking-widest text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" className="p-10 text-center font-retro-mono text-base-black/50">Memuat data siswa...</td></tr>
              ) : filteredStudents.length > 0 ? filteredStudents.map((student, i) => (
                <motion.tr key={student.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="border-b-2 border-base-black border-dashed hover:bg-retro-yellow/10 transition-colors">
                  <td className="p-4 font-retro-mono text-sm text-base-black/50">{i + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-base-black bg-retro-blue/20 flex items-center justify-center font-retro-display font-black text-sm text-retro-blue">
                        {student.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-retro-display font-black text-base-black">{student.name}</span>
                    </div>
                  </td>
                  <td className="p-4 font-retro-mono text-sm">{student.nis || '—'}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-retro-lime/20 border-2 border-retro-lime rounded-full text-xs font-black">{student.class?.name || '—'}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-base-gray border border-base-black rounded-full overflow-hidden max-w-20">
                        <div className="h-full bg-success rounded-full" style={{ width: `${student.attendance_rate || 0}%` }} />
                      </div>
                      <span className="font-retro-mono text-xs">{student.attendance_rate || 0}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Button size="sm" variant="outline" onClick={() => setSelectedStudent(student)}>
                      <Eye className="w-4 h-4 mr-1" /> Detail
                    </Button>
                  </td>
                </motion.tr>
              )) : (
                <tr><td colSpan="6" className="p-10 text-center font-retro-mono text-base-black/50">Tidak ada siswa ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <Modal isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} title={`👤 ${selectedStudent?.name}`} maxWidth="md">
        {selectedStudent && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-base-black bg-retro-blue/20 flex items-center justify-center font-retro-display font-black text-2xl text-retro-blue">
                {selectedStudent.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-retro-display font-black text-xl">{selectedStudent.name}</p>
                <p className="font-retro-mono text-sm text-base-black/60">NIS: {selectedStudent.nis || '—'} • {selectedStudent.class?.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Email', selectedStudent.email || '—'],
                ['Kelas', selectedStudent.class?.name || '—'],
                ['Kehadiran', `${selectedStudent.attendance_rate || 0}%`],
                ['Status', selectedStudent.status || 'Aktif'],
              ].map(([k, v]) => (
                <div key={k} className="p-3 border-2 border-base-black border-dashed rounded-retro">
                  <p className="font-retro-mono text-[10px] text-base-black/50 uppercase">{k}</p>
                  <p className="font-retro-display font-black mt-1">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
