import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Clock, Calendar, Search, Filter, Download, 
  CheckCircle2, XCircle, AlertCircle, RefreshCw, Eye,
  QrCode, MapPin, Smartphone, UserCheck, Shield, Star
} from 'lucide-react';
import { adminAPI } from '../../api';

// 🏛️ CENTRALIZED UI COMPONENTS
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Toast from '../../components/ui/Toast';
import RetroTable, { TableActions } from '../../components/ui/RetroTable';
import { PageHeader, RetroSection, StatGrid, RetroCard, RetroStatWidget } from '../../components/ui/RetroLayouts';
import { twMerge } from 'tailwind-merge';

// 🎨 ANIMATION VARIANTS
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const floatVariants = {
  animate: {
    y: [0, -8, 0], rotate: [0, 2, -2, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  }
};

// 🎪 DECORATIVE ELEMENTS
function AttendanceDecorations() {
  return (
    <>
      <motion.div variants={floatVariants} animate="animate" className="absolute top-20 right-10 z-0 hidden lg:block">
        <div className="retro-smiley text-xl animate-wobble">⏱️</div>
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute bottom-32 left-20 z-0 hidden lg:block" style={{animationDelay:'1s'}}>
        <Star className="w-8 h-8 text-retro-yellow fill-retro-yellow drop-shadow-retro animate-sparkle-retro" />
      </motion.div>
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-retro-purple/20 rounded-blob blur-2xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-retro-lime/20 rounded-blob blur-2xl pointer-events-none" />
    </>
  );
}

export default function AttendanceManagement() {
  const queryClient = useQueryClient();
  
  // State Management
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch Attendance Data
  const { data: attendanceData, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-attendance', date, statusFilter],
    queryFn: () => adminAPI.getAttendance({ 
      date, 
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: search || undefined
    }).then(res => res.data || []),
  });

  // Fetch Stats
  const stats = useMemo(() => {
    const data = attendanceData || [];
    return {
      total: data.length,
      present: data.filter(a => a.status === 'present').length,
      late: data.filter(a => a.status === 'late').length,
      absent: data.filter(a => a.status === 'absent').length,
      permission: data.filter(a => ['permit', 'sick'].includes(a.status)).length,
    };
  }, [attendanceData]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleExport = () => {
    showToast('⏳ Exporting attendance data...', 'info');
    // Implement export logic
  };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6 relative">
      <AttendanceDecorations />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <div className="fixed top-24 right-6 z-50">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <PageHeader 
        title="Attendance Tracking"
        icon={Clock}
        description="Pantau kehadiran siswa secara realtime, validasi koordinat GPS, dan kelola perizinan."
        breadcrumbs={[{ label: 'Attendance', path: '/admin/attendance' }]}
        actions={
          <div className="flex gap-2">
            <Input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40 py-2 h-10"
            />
            <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <StatGrid>
        <RetroStatWidget title="Total Siswa" value={stats.total} icon={Users} color="orange" />
        <RetroStatWidget title="Hadir" value={stats.present} icon={CheckCircle2} color="green" />
        <RetroStatWidget title="Terlambat" value={stats.late} icon={Clock} color="purple" />
        <RetroStatWidget title="Izin/Sakit" value={stats.permission} icon={AlertCircle} color="blue" />
      </StatGrid>

      {/* Filters & Monitoring */}
      <RetroSection>
        <RetroCard className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <Input 
                label="Search Student"
                placeholder="Cari nama atau NIS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                prefix={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex bg-base-gray/10 p-1 rounded-retro border-2 border-base-black">
                {['all', 'present', 'late', 'absent'].map(status => (
                  <button 
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={twMerge(
                      "px-4 py-1.5 rounded-retro-sm text-xs font-black uppercase transition-all",
                      statusFilter === status ? "bg-base-black text-base-white shadow-hard-sm" : "text-base-black hover:bg-base-black/5"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <Button variant="outline" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></Button>
            </div>
          </div>
        </RetroCard>
      </RetroSection>

      {/* Attendance Table */}
      <RetroSection>
        <RetroTable 
          data={attendanceData || []}
          isLoading={isLoading}
          columns={[
            {
              header: 'Student',
              key: 'user.name',
              render: (val, row) => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-retro bg-retro-orange/20 border-2 border-retro-orange flex items-center justify-center font-retro-display font-black text-retro-orange">
                    {row.user?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-retro-display font-black text-base-black">{row.user?.name}</p>
                    <p className="font-retro-mono text-[10px] text-base-black/50">NIS: {row.user?.profile?.nis || '-'}</p>
                  </div>
                </div>
              )
            },
            {
              header: 'Check In',
              key: 'check_in',
              render: (val) => val ? (
                <div className="flex flex-col">
                  <span className="font-retro-mono font-black text-sm">{val}</span>
                  <span className="text-[10px] text-base-black/50">Device: Mobile App</span>
                </div>
              ) : '-'
            },
            {
              header: 'Status',
              key: 'status',
              render: (val) => (
                <span className={twMerge(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase border-2",
                  val === 'present' ? "bg-success/10 border-success text-success" :
                  val === 'late' ? "bg-retro-purple/10 border-retro-purple text-retro-purple" :
                  val === 'absent' ? "bg-danger/10 border-danger text-danger" :
                  "bg-retro-blue/10 border-retro-blue text-retro-blue"
                )}>
                  {val}
                </span>
              )
            },
            {
              header: 'Verification',
              key: 'is_verified',
              render: (val) => (
                <div className="flex items-center gap-2">
                  <Shield className={twMerge("w-4 h-4", val ? "text-success" : "text-base-black/20")} />
                  <MapPin className={twMerge("w-4 h-4", val ? "text-retro-blue" : "text-base-black/20")} />
                  <Smartphone className={twMerge("w-4 h-4", val ? "text-retro-orange" : "text-base-black/20")} />
                </div>
              )
            },
            {
              header: 'Actions',
              key: 'actions',
              align: 'right',
              render: (_, row) => (
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => { setSelectedAttendance(row); setIsViewOpen(true); }}
                    className="p-2 hover:bg-base-black/10 rounded-retro-sm transition-all"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-success/10 text-success rounded-retro-sm transition-all">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              )
            }
          ]}
        />
      </RetroSection>

      {/* Details Modal */}
      <Modal 
        isOpen={isViewOpen} 
        onClose={() => setIsViewOpen(false)}
        title="Attendance Evidence"
        size="md"
      >
        {selectedAttendance && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-retro border-4 border-base-black overflow-hidden bg-base-gray">
                {selectedAttendance.selfie_url ? (
                  <img src={selectedAttendance.selfie_url} alt="Selfie" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Users className="w-8 h-8 opacity-20" /></div>
                )}
              </div>
              <div>
                <h3 className="retro-heading retro-heading-sm text-base-black">{selectedAttendance.user?.name}</h3>
                <p className="font-retro-mono text-xs text-base-black/50">Checked in at {selectedAttendance.check_in}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-base-gray/10 rounded-retro border-2 border-base-black">
                <p className="text-[10px] font-black text-base-black/50 uppercase">Coordinates</p>
                <p className="font-retro-mono text-xs">{selectedAttendance.latitude || '0'}, {selectedAttendance.longitude || '0'}</p>
              </div>
              <div className="p-3 bg-base-gray/10 rounded-retro border-2 border-base-black">
                <p className="text-[10px] font-black text-base-black/50 uppercase">Device ID</p>
                <p className="font-retro-mono text-xs truncate">{selectedAttendance.device_id || 'Unknown'}</p>
              </div>
            </div>

            <div className="h-48 rounded-retro border-2 border-base-black overflow-hidden">
               {/* Map snippet placeholder */}
               <div className="w-full h-full bg-base-gray flex items-center justify-center relative">
                  <MapPin className="w-12 h-12 text-retro-orange opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-retro-mono text-base-black/40">
                     GPS Verification Active
                  </div>
               </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t-2 border-base-black/10">
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
              <Button variant="danger">Invalidate</Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
