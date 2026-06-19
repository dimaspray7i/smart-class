import React from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export function ScheduleConfirmModals({
  confirmDelete,
  onDeleteCancel,
  onDeleteConfirm,
  confirmBulkDelete,
  selectedIdsCount,
  onBulkDeleteCancel,
  onBulkDeleteConfirm,
  isDeleting,
}) {
  return (
    <>
      <Modal isOpen={!!confirmDelete} onClose={onDeleteCancel} title="Konfirmasi Penghapusan" size="md">
        <div className="text-center p-4">
          <div className="w-20 h-20 bg-danger/10 border-4 border-danger rounded-retro mx-auto mb-6 flex items-center justify-center">
            <Trash2 className="w-10 h-10 text-danger" />
          </div>
          <h3 className="retro-heading text-xl mb-3">Hapus jadwal ini?</h3>
          <p className="text-sm font-retro-mono text-base-black/60 mb-8">
            Tindakan ini akan menghapus sesi kelas ini secara permanen. Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" className="flex-1" onClick={onDeleteCancel}>Batal</Button>
            <Button variant="primary" className="bg-danger border-danger flex-1" onClick={onDeleteConfirm} loading={isDeleting}>Ya, Hapus</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={confirmBulkDelete} onClose={onBulkDeleteCancel} title="Hapus Massal" size="md">
        <div className="text-center p-4">
          <div className="w-20 h-20 bg-danger/10 border-4 border-danger rounded-retro mx-auto mb-6 flex items-center justify-center">
            <Trash2 className="w-10 h-10 text-danger" />
          </div>
          <h3 className="retro-heading text-xl mb-3">Hapus {selectedIdsCount} jadwal terpilih?</h3>
          <p className="text-sm font-retro-mono text-base-black/60 mb-8">
            Anda akan menghapus beberapa entri jadwal sekaligus. Tindakan ini bersifat final.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" className="flex-1" onClick={onBulkDeleteCancel}>Batal</Button>
            <Button variant="primary" className="bg-danger border-danger flex-1" onClick={onBulkDeleteConfirm} loading={isDeleting}>Ya, Hapus Semua</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
