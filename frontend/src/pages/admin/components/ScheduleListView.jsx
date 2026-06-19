import React from 'react';
import { BookOpen, Users, Clock, MapPin, School } from 'lucide-react';
import RetroTable, { TableActions } from '@/components/ui/RetroTable';

export function ScheduleListView({
  schedules,
  meta,
  classes,
  subjects,
  teachers,
  selectedIds,
  onSelect,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
  onPageChange,
}) {
  const getClassName = (id) => (Array.isArray(classes) ? classes.find(c => c.id === id)?.name : '') || '-';
  const getSubjectName = (id) => (Array.isArray(subjects) ? subjects.find(s => s.id === id)?.name : '') || '-';
  const getTeacherName = (id) => (Array.isArray(teachers) ? teachers.find(t => t.id === id)?.name : '') || '-';

  return (
    <RetroTable
      data={schedules}
      columns={[
        {
          header: 'Kelas',
          key: 'class_id',
          render: (id) => (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-retro-sm bg-retro-orange/20 border-2 border-retro-orange flex items-center justify-center">
                <School className="w-4 h-4 text-retro-orange" />
              </div>
              <span className="font-retro-display font-black text-base-black text-sm">{getClassName(id)}</span>
            </div>
          )
        },
        {
          header: 'Mata Pelajaran & Guru',
          key: 'subject_id',
          render: (sid, item) => (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-retro-purple" />
                <span className="text-base-black font-black text-sm">{getSubjectName(sid)}</span>
              </div>
              <div className="flex items-center gap-2 text-base-black/50">
                <Users className="w-3 h-3" />
                <span className="text-[10px] font-retro-mono">{getTeacherName(item.teacher_id)}</span>
              </div>
            </div>
          )
        },
        {
          header: 'Jadwal',
          key: 'day',
          render: (day, item) => (
            <div className="flex flex-col">
              <span className="font-black text-base-black uppercase tracking-wider text-xs">{day}</span>
              <span className="text-[10px] text-base-black/60 flex items-center gap-1 font-retro-mono">
                <Clock className="w-3 h-3" /> {item.start_time} - {item.end_time}
              </span>
            </div>
          )
        },
        {
          header: 'Ruangan',
          key: 'room',
          render: (room) => (
            <div className="flex items-center gap-1.5 text-base-black/70">
              <MapPin className="w-3.5 h-3.5 text-retro-orange" />
              <span className="text-xs font-retro-mono">{room || '-'}</span>
            </div>
          )
        },
        {
          header: 'Status',
          key: 'is_active',
          render: (active) => (
            <span className={`retro-badge text-[10px] ${active ? 'retro-badge-green' : 'retro-badge-red'}`}>
              {active ? 'AKTIF' : 'NON-AKTIF'}
            </span>
          )
        }
      ]}
      actions={(row) => (
        <TableActions
          onView={() => onView(row)}
          onEdit={() => onEdit(row)}
          onDelete={() => onDelete(row.id)}
        />
      )}
      selectedIds={selectedIds}
      onSelect={onSelect}
      onSelectAll={() => onSelectAll(schedules.map(s => s.id))}
      pagination={{
        currentPage: meta.current_page || 1,
        totalPages: meta.last_page || 1,
        totalItems: meta.total || 0,
        onPageChange,
      }}
    />
  );
}
