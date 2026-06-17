import React from 'react';
import { Plus, ListIcon, LayoutGrid, CalendarDays } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { PageHeader, StatGrid, RetroStatWidget } from '../../components/ui/RetroLayouts';
import Button from '../../components/ui/Button';
import { Calendar, School, BookOpen, Users } from 'lucide-react';
import { ID } from '../../i18n/id';

export function ScheduleHeader({
  viewMode,
  setViewMode,
  onCreateNew,
  meta,
  classes,
  subjects,
  teachers,
}) {
  return (
    <>
      <PageHeader
        title={ID.nav.schedules}
        icon={Calendar}
        description="Rencanakan dan kelola jadwal pelajaran kelas, distribusi mata pelajaran, dan alokasi ruangan."
        breadcrumbs={[{ label: ID.nav.schedules, path: '/admin/schedules' }]}
        actions={
          <div className="flex gap-2">
            <div className="flex p-1 bg-base-gray/20 rounded-retro-sm">
              <button
                onClick={() => setViewMode('list')}
                className={twMerge(
                  "p-2 rounded-retro-sm transition-all",
                  viewMode === 'list' ? "bg-base-black text-base-white shadow-hard-sm" : "hover:bg-base-black/10 text-base-black"
                )}
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={twMerge(
                  "p-2 rounded-retro-sm transition-all",
                  viewMode === 'grid' ? "bg-base-black text-base-white shadow-hard-sm" : "hover:bg-base-black/10 text-base-black"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={twMerge(
                  "p-2 rounded-retro-sm transition-all",
                  viewMode === 'weekly' ? "bg-base-black text-base-white shadow-hard-sm" : "hover:bg-base-black/10 text-base-black"
                )}
              >
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>
            <Button
              variant="primary"
              onClick={onCreateNew}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Jadwal
            </Button>
          </div>
        }
      />

      <StatGrid>
        <RetroStatWidget
          title="Total Jadwal"
          value={meta.total || 0}
          icon={Calendar}
          color="orange"
        />
        <RetroStatWidget
          title="Kelas Terdaftar"
          value={classes.length}
          icon={School}
          color="blue"
        />
        <RetroStatWidget
          title="Mapel Aktif"
          value={subjects.length}
          icon={BookOpen}
          color="purple"
        />
        <RetroStatWidget
          title="Total Guru"
          value={teachers.length}
          icon={Users}
          color="lime"
        />
      </StatGrid>
    </>
  );
}
