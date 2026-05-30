import { useState, useEffect } from 'react';
import { BarChart2, Trophy, FileSpreadsheet, Award, BookOpen, AlertCircle } from 'lucide-react';
import studentApi from '../../../api/student';
import { motion } from 'framer-motion';
import { PageHeader, StatGrid, RetroCard } from '../../../components/ui/RetroLayouts';

// 🎨 ANIMATION VARIANTS
const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 } 
  }
};

export default function StudentGrades() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentApi.getGrades();
      if (res.status === 'success') {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data nilai akademik dari server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const getLetterGrade = (score) => {
    if (score >= 90) return { letter: 'A', color: 'bg-retro-lime text-base-black border-base-black' };
    if (score >= 80) return { letter: 'B', color: 'bg-retro-purple text-base-white border-base-black' };
    if (score >= 70) return { letter: 'C', color: 'bg-retro-yellow text-base-black border-base-black' };
    if (score >= 60) return { letter: 'D', color: 'bg-retro-orange text-base-white border-base-black' };
    return { letter: 'E', color: 'bg-retro-pink text-base-white border-base-black' };
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] retro-card bg-base-white p-8 shadow-hard">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 retro-card bg-retro-purple border-4 border-base-black flex items-center justify-center mb-4"
        >
          <Award className="w-8 h-8 text-base-white animate-pulse" />
        </motion.div>
        <p className="font-retro-display font-black text-xs text-base-black uppercase tracking-widest animate-pulse">
          Mengkalkulasi Nilai Akademik...
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
        <h3 className="retro-heading text-lg mb-2">Oops! Gagal Memuat Nilai</h3>
        <p className="font-retro-mono text-xs font-black text-base-black/70 uppercase tracking-widest mb-4">
          {error}
        </p>
        <button
          onClick={fetchGrades}
          className="retro-btn flex items-center gap-2 bg-base-black text-base-white hover:bg-retro-orange py-2 px-4"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const grades = data?.grades || [];
  const summary = data?.summary || { average: 0, highest: 0, lowest: 0, total_subjects: 0 };

  return (
    <div className="space-y-6">
      
      {/* ── Page Header ──────────────────────────────────── */}
      <PageHeader 
        title="Nilai KHS"
        icon={Award}
        description="Pantau perkembangan nilai mata pelajaran, UTS, UAS, dan rata-rata semester Anda."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard/student' },
          { label: 'Nilai KHS', path: '/dashboard/student/grades' }
        ]}
        actions={
          <button
            onClick={() => window.print()}
            className="retro-btn bg-retro-yellow text-base-black text-xs py-2.5 px-4 shadow-hard-sm"
          >
            <FileSpreadsheet className="w-4.5 h-4.5" />
            <span>PRINT LAPORAN KHS</span>
          </button>
        }
      />

      {/* ── Summary Stats ────────────────────────────────── */}
      <StatGrid cols={4}>
        <div className="border-4 border-base-black p-4 rounded-retro shadow-hard-sm flex items-center gap-4 bg-retro-yellow/10">
          <div className="w-12 h-12 border-2 border-base-black bg-base-white rounded-retro flex items-center justify-center shadow-hard-sm text-retro-orange shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-[10px] font-retro-mono font-black uppercase text-base-black/50 leading-none">Rata-Rata</h4>
            <p className="text-xl font-retro-display font-black text-base-black mt-1 leading-none">{summary.average}</p>
          </div>
        </div>

        <div className="border-4 border-base-black p-4 rounded-retro shadow-hard-sm flex items-center gap-4 bg-retro-purple/10">
          <div className="w-12 h-12 border-2 border-base-black bg-base-white rounded-retro flex items-center justify-center shadow-hard-sm text-retro-purple shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-[10px] font-retro-mono font-black uppercase text-base-black/50 leading-none">Tertinggi</h4>
            <p className="text-xl font-retro-display font-black text-base-black mt-1 leading-none">{summary.highest}</p>
          </div>
        </div>

        <div className="border-4 border-base-black p-4 rounded-retro shadow-hard-sm flex items-center gap-4 bg-retro-pink/10">
          <div className="w-12 h-12 border-2 border-base-black bg-base-white rounded-retro flex items-center justify-center shadow-hard-sm text-retro-pink shrink-0">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-[10px] font-retro-mono font-black uppercase text-base-black/50 leading-none">Terendah</h4>
            <p className="text-xl font-retro-display font-black text-base-black mt-1 leading-none">{summary.lowest}</p>
          </div>
        </div>

        <div className="border-4 border-base-black p-4 rounded-retro shadow-hard-sm flex items-center gap-4 bg-retro-blue/10">
          <div className="w-12 h-12 border-2 border-base-black bg-base-white rounded-retro flex items-center justify-center shadow-hard-sm text-retro-blue shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-[10px] font-retro-mono font-black uppercase text-base-black/50 leading-none">Mata Pelajaran</h4>
            <p className="text-xl font-retro-display font-black text-base-black mt-1 leading-none">{summary.total_subjects}</p>
          </div>
        </div>
      </StatGrid>

      {/* ── Grades Table ─────────────────────────────────── */}
      <motion.div 
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <RetroCard variant="white">
          <div className="flex items-center justify-between border-b-4 border-base-black pb-3 mb-4">
            <h3 className="font-retro-display font-black text-base-black uppercase tracking-tight text-xs flex items-center gap-1.5">
              <span>📊</span> Rincian Nilai Mata Pelajaran
            </h3>
            <span className="retro-sticker text-[7px] px-1.5 py-0.5 bg-retro-purple text-base-white font-black">SEMESTER INI</span>
          </div>

          {grades.length === 0 ? (
            <div className="text-center py-16 border-4 border-dashed border-base-black/20 rounded-retro bg-base-cream/20">
              <AlertCircle className="w-12 h-12 mx-auto text-base-black/20 mb-2 animate-bounce" />
              <p className="text-[10px] font-retro-mono font-bold uppercase text-base-black/40">Belum ada data nilai semester ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto border-2 border-base-black rounded-retro">
              <table className="w-full text-left border-collapse overflow-hidden">
                <thead>
                  <tr className="bg-base-gray border-b-2 border-base-black text-[9px] font-retro-display font-black uppercase tracking-wider text-base-black">
                    <th className="py-3 px-4 border-r-2 border-base-black w-24">Kode</th>
                    <th className="py-3 px-4 border-r-2 border-base-black">Mata Pelajaran</th>
                    <th className="py-3 px-4 border-r-2 border-base-black">Guru Pengampu</th>
                    <th className="py-3 px-4 text-center border-r-2 border-base-black w-20">Tugas</th>
                    <th className="py-3 px-4 text-center border-r-2 border-base-black w-20">UTS</th>
                    <th className="py-3 px-4 text-center border-r-2 border-base-black w-20">UAS</th>
                    <th className="py-3 px-4 text-center border-r-2 border-base-black w-28">Nilai Akhir</th>
                    <th className="py-3 px-4 text-center w-24">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-base-black/15 font-retro-mono text-[11px] font-bold text-base-black">
                  {grades.map((g, i) => {
                    const letterGrade = getLetterGrade(g.final_grade);
                    return (
                      <tr key={g.id || i} className="hover:bg-retro-yellow/5 transition-colors">
                        <td className="py-3.5 px-4 border-r-2 border-base-black/15 text-retro-purple uppercase font-black">{g.subject_code}</td>
                        <td className="py-3.5 px-4 border-r-2 border-base-black/15 uppercase font-retro-display text-xs">{g.subject_name}</td>
                        <td className="py-3.5 px-4 border-r-2 border-base-black/15 uppercase text-base-black/50 text-[10px]">{g.teacher_name || '—'}</td>
                        <td className="py-3.5 px-4 border-r-2 border-base-black/15 text-center">{g.task_grade ?? '—'}</td>
                        <td className="py-3.5 px-4 border-r-2 border-base-black/15 text-center">{g.uts_grade ?? '—'}</td>
                        <td className="py-3.5 px-4 border-r-2 border-base-black/15 text-center">{g.uas_grade ?? '—'}</td>
                        <td className="py-3.5 px-4 border-r-2 border-base-black/15 text-center text-sm font-black font-retro-display text-retro-orange">{g.final_grade}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 border-2 rounded font-retro-display font-black text-xs inline-block shadow-hard-sm ${letterGrade.color}`}>
                            {letterGrade.letter}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </RetroCard>
      </motion.div>
    </div>
  );
}
