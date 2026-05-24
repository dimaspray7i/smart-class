import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, MapPin, Users, Mail, Smartphone, Globe, Search, Plus, 
  Trash2, Edit2, Eye, Map, Briefcase, UserCheck, AlertCircle, 
  CheckCircle2, Clock, Calendar, Download, Filter, RefreshCw, Star
} from 'lucide-react';
import { adminAPI } from '../../api';
import { ID } from '../../i18n/id';

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

const cardVariants = {
  hidden: { opacity: 0, y: 30, rotate: -1 },
  visible: { 
    opacity: 1, y: 0, rotate: 0,
    transition: { type: "spring", stiffness: 100, damping: 15, mass: 0.1 } 
  }
};

const floatVariants = {
  animate: {
    y: [0, -8, 0], rotate: [0, 2, -2, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  }
};

// 🎪 DECORATIVE ELEMENTS
function PklDecorations() {
  return (
    <>
      <motion.div variants={floatVariants} animate="animate" className="absolute top-20 right-10 z-0 hidden lg:block">
        <div className="retro-smiley text-xl animate-wobble">🏢</div>
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute bottom-32 left-20 z-0 hidden lg:block" style={{animationDelay:'1s'}}>
        <Star className="w-8 h-8 text-retro-yellow fill-retro-yellow drop-shadow-retro animate-sparkle-retro" />
      </motion.div>
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-retro-purple/20 rounded-blob blur-2xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-retro-lime/20 rounded-blob blur-2xl pointer-events-none" />
    </>
  );
}

// 🗺️ MAP PREVIEW COMPONENT
function LocationMap({ lat, lng, companyName }) {
  if (!lat || !lng) return (
    <div className="flex flex-col items-center justify-center h-full rounded-retro bg-base-gray border-2 border-dashed border-base-black/30 text-base-black/50">
      <MapPin className="w-8 h-8 mb-2 opacity-50" />
      <p className="font-retro-mono text-xs">Koordinat GPS Belum Ditentukan</p>
    </div>
  );

  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  return (
    <div className="relative h-full w-full group">
      <iframe
        title={`Map for ${companyName}`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        src={embedUrl}
        allowFullScreen
      />
      <div className="absolute top-3 left-3 px-3 py-1.5 rounded-retro bg-retro-orange border-2 border-base-black text-[10px] text-base-white font-retro-mono flex items-center gap-2 shadow-hard-sm">
        <div className="w-2 h-2 rounded-sm bg-base-white animate-pulse" />
        {lat}, {lng}
      </div>
    </div>
  );
}

// Helper to ensure we always work with arrays
const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray(data.data)) return data.data;
  if (data && typeof data === 'object') return Object.values(data);
  return [];
};

export default function PKLManagement() {
  const queryClient = useQueryClient();
  
  // State Management
  const [activeTab, setActiveTab] = useState('locations');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '', address: '', latitude: '', longitude: '',
    radius_meters: 100, supervisor_name: '', supervisor_phone: '',
    supervisor_email: '', is_approved: true, student_ids: []
  });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  // Fetch PKL Locations
  const { data: locationsData, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['pkl-locations'],
    queryFn: () => adminAPI.getPklLocations().then(res => res.data?.data || []),
  });

  // Fetch Students (RPL Grade 12)
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['pkl-students'],
    queryFn: () => adminAPI.getPklStudents({ per_page: 100 }).then(res => res.data?.data || []),
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Mutations
  const submitMutation = useMutation({
    mutationFn: (data) => {
      if (selectedLocation) {
        return adminAPI.updatePklLocation(selectedLocation.id, data);
      }
      return adminAPI.createPklLocation(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pkl-locations']);
      setIsModalOpen(false);
      showToast(selectedLocation ? '🏢 Lokasi PKL berhasil diupdate!' : '🏢 Lokasi PKL berhasil ditambahkan!', 'success');
    },
    onError: (err) => {
      setErrors(err.response?.data?.errors || {});
      showToast(selectedLocation ? '❌ Gagal mengupdate lokasi' : '❌ Gagal menambahkan lokasi', 'error');
    }
  });

  const assignMutation = useMutation({
    mutationFn: (data) => adminAPI.assignPklStudents(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pkl-students']);
      queryClient.invalidateQueries(['pkl-locations']);
      showToast('✅ Siswa berhasil diassign!', 'success');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deletePklLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['pkl-locations']);
      showToast('✅ Lokasi PKL berhasil dihapus!', 'success');
    },
    onError: (err) => {
      showToast(`❌ ${err.message || 'Gagal menghapus lokasi PKL'}`, 'error');
    }
  });

  const stats = useMemo(() => {
    const locations = ensureArray(locationsData);
    const students = ensureArray(studentsData);
    return {
      totalLocations: locations.length,
      placedStudents: students.filter(s => s.pkl_location_id).length,
      unplacedStudents: students.filter(s => !s.pkl_location_id).length,
      totalStudents: students.length
    };
  }, [locationsData, studentsData]);

  // Handlers
  const handleOpenModal = (location = null) => {
    if (location) {
      setSelectedLocation(location);
      setFormData({
        ...location,
        student_ids: location.students?.map(s => s.id) || []
      });
    } else {
      setSelectedLocation(null);
      setFormData({
        company_name: '', address: '', latitude: '', longitude: '',
        radius_meters: 100, supervisor_name: '', supervisor_phone: '',
        supervisor_email: '', is_approved: true, student_ids: []
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  const toggleStudentSelection = (studentId) => {
    setFormData(prev => {
      const ids = prev.student_ids.includes(studentId)
        ? prev.student_ids.filter(id => id !== studentId)
        : [...prev.student_ids, studentId];
      return { ...prev, student_ids: ids };
    });
  };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6 relative">
      <PklDecorations />

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
        title={ID.nav.pkl}
        icon={Briefcase}
        description="Kelola lokasi Praktik Kerja Lapangan (PKL) dan penempatan siswa."
        breadcrumbs={[{ label: ID.nav.pkl, path: '/admin/pkl' }]}
        actions={
          <Button variant="primary" onClick={() => handleOpenModal()} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tambah Lokasi
          </Button>
        }
      />

      {/* Stats */}
      <StatGrid>
        <RetroStatWidget title="Total Lokasi" value={stats.totalLocations} icon={Building2} color="orange" />
        <RetroStatWidget title="Siswa Terplot" value={stats.placedStudents} icon={UserCheck} color="purple" trend={Math.round((stats.placedStudents/stats.totalStudents)*100) || 0} />
        <RetroStatWidget title="Siswa Belum Terplot" value={stats.unplacedStudents} icon={Users} color="blue" />
        <RetroStatWidget title="Total Kapasitas" value={ensureArray(locationsData).reduce((acc, loc) => acc + (loc.capacity || 0), 0) || 0} icon={MapPin} color="lime" />
      </StatGrid>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-base-gray/20 rounded-retro-sm border-2 border-base-black w-fit">
        <button 
          onClick={() => setActiveTab('locations')}
          className={twMerge(
            "px-6 py-2 rounded-retro-sm text-xs font-black uppercase transition-all",
            activeTab === 'locations' ? "bg-base-black text-base-white shadow-hard-sm" : "text-base-black hover:bg-base-black/5"
          )}
        >
          Lokasi PKL
        </button>
        <button 
          onClick={() => setActiveTab('assignments')}
          className={twMerge(
            "px-6 py-2 rounded-retro-sm text-xs font-black uppercase transition-all",
            activeTab === 'assignments' ? "bg-base-black text-base-white shadow-hard-sm" : "text-base-black hover:bg-base-black/5"
          )}
        >
          Penempatan Siswa
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'locations' ? (
          <motion.div key="loc" variants={pageVariants} className="space-y-6">
            <RetroSection title="Daftar Lokasi PKL">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {ensureArray(locationsData).map((loc) => (
                  <RetroCard key={loc.id} className="p-0 overflow-hidden group flex flex-col md:flex-row h-full md:h-64">
                    <div className="w-full md:w-1/2 h-48 md:h-full border-b-4 md:border-b-0 md:border-r-4 border-base-black">
                      <LocationMap lat={loc.latitude} lng={loc.longitude} companyName={loc.company_name} />
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-retro-display font-black text-lg text-base-black uppercase leading-tight group-hover:text-retro-orange transition-colors">
                            {loc.company_name}
                          </h4>
                          <span className={twMerge(
                            "px-2 py-0.5 rounded-retro-sm text-[10px] font-black border-2",
                            loc.is_approved ? "bg-success/10 border-success text-success" : "bg-danger/10 border-danger text-danger"
                          )}>
                            {loc.is_approved ? 'DISETUJUI' : 'MENUNGGU'}
                          </span>
                        </div>
                        <p className="font-retro-mono text-xs text-base-black/60 line-clamp-2 mb-4">
                          <MapPin className="w-3 h-3 inline mr-1" /> {loc.address}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-retro-sm bg-base-gray/30 border border-base-black/10 text-[10px] font-retro-mono">
                            <Users className="w-3 h-3 text-retro-purple" />
                            {loc.students?.length || 0} Siswa
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-retro-sm bg-base-gray/30 border border-base-black/10 text-[10px] font-retro-mono">
                            <Clock className="w-3 h-3 text-retro-blue" />
                            {loc.radius_meters}m Radius
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(loc)}>Ubah</Button>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          icon={Trash2} 
                          onClick={() => {
                            if (window.confirm(`Apakah Anda yakin ingin menghapus lokasi PKL ${loc.company_name}?`)) {
                              deleteMutation.mutate(loc.id);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </RetroCard>
                ))}
              </div>
            </RetroSection>
          </motion.div>
        ) : (
          <motion.div key="assign" variants={pageVariants} className="space-y-6">
            <RetroSection title="Penempatan Siswa">
              <RetroCard className="p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <Input 
                      label="Cari Siswa"
                      placeholder="Cari nama siswa..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      prefix={<Search className="w-4 h-4" />}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline"><Filter className="w-4 h-4 mr-1" /> Filter</Button>
                  </div>
                </div>
              </RetroCard>

              <RetroTable 
                data={ensureArray(studentsData).filter(s => s.name.toLowerCase().includes(search.toLowerCase()))}
                isLoading={isLoadingStudents}
                columns={[
                  {
                    header: 'Siswa',
                    key: 'name',
                    render: (val, row) => (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-retro bg-retro-orange/20 border-2 border-retro-orange flex items-center justify-center font-retro-display font-black text-retro-orange">
                          {val.charAt(0)}
                        </div>
                        <div>
                          <p className="font-retro-display font-black text-base-black">{val}</p>
                          <p className="font-retro-mono text-[10px] text-base-black/50">NIS: {row.profile?.nis || row.nis || '-'}</p>
                        </div>
                      </div>
                    )
                  },
                  {
                    header: 'Lokasi Saat Ini',
                    key: 'pkl_location_id',
                    render: (val, row) => (
                      val ? (
                        <div className="flex items-center gap-2 text-retro-purple font-black">
                          <Building2 className="w-4 h-4" />
                          {row.pkl_location?.company_name}
                        </div>
                      ) : (
                        <span className="text-base-black/30 italic">Belum Terplot</span>
                      )
                    )
                  },
                  {
                    header: 'Pilih Lokasi Penempatan',
                    key: 'actions',
                    render: (_, row) => (
                      <select 
                        className="bg-base-white border-2 border-base-black rounded-retro-sm px-3 py-1.5 text-xs font-retro-mono focus:border-retro-orange focus:outline-none"
                        value={row.pkl_location_id || ''}
                        onChange={(e) => assignMutation.mutate({ student_ids: [row.id], pkl_location_id: e.target.value })}
                      >
                        <option value="">Batalkan Penempatan</option>
                        {ensureArray(locationsData).map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.company_name}</option>
                        ))}
                      </select>
                    )
                  }
                ]}
              />
            </RetroSection>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Create/Edit Location */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedLocation ? "Ubah Lokasi PKL" : "Tambah Lokasi PKL"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Nama Perusahaan / Instansi" 
              value={formData.company_name} 
              onChange={e => setFormData({...formData, company_name: e.target.value})}
              required
              icon={Building2}
            />
            <Input 
              label="Nama Pembimbing Lapangan" 
              value={formData.supervisor_name} 
              onChange={e => setFormData({...formData, supervisor_name: e.target.value})}
              icon={UserCheck}
            />
          </div>
          
          <Input 
            label="Alamat Lengkap" 
            value={formData.address} 
            onChange={e => setFormData({...formData, address: e.target.value})}
            required
            icon={MapPin}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
              label="Latitude" 
              value={formData.latitude} 
              onChange={e => setFormData({...formData, latitude: e.target.value})}
              required
              placeholder="-6.200000"
            />
            <Input 
              label="Longitude" 
              value={formData.longitude} 
              onChange={e => setFormData({...formData, longitude: e.target.value})}
              required
              placeholder="106.816666"
            />
            <Input 
              label="Radius Presensi (Meter)" 
              type="number"
              value={formData.radius_meters} 
              onChange={e => setFormData({...formData, radius_meters: e.target.value})}
              required
              placeholder="100"
            />
          </div>

          <div className="p-4 bg-retro-orange/5 border-2 border-base-black border-dashed rounded-retro">
            <p className="text-[10px] font-black uppercase text-base-black/50 mb-3">Pratinjau Peta</p>
            <div className="h-48">
              <LocationMap lat={formData.latitude} lng={formData.longitude} companyName={formData.company_name} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t-2 border-base-black/10">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={submitMutation.isPending}>
              {selectedLocation ? 'Simpan Perubahan' : 'Tambah Lokasi'}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
