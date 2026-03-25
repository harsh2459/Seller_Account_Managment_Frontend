import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-5">
        <div className="flex gap-3 items-start">
          <span className="mt-0.5 p-2 rounded-lg bg-red-50 text-red-500 border border-red-100">
            <AlertTriangle size={18} />
          </span>
          <p className="text-sm text-slate-600">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </Modal>
  );
}
