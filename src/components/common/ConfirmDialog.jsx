import { FiAlertTriangle, FiTrash2 } from "react-icons/fi";
import Modal from "./Modal";

export default function ConfirmDialog({
  title,
  message,
  confirmText = "Delete",
  confirmIcon: ConfirmIcon = FiTrash2,
  onConfirm,
  onClose,
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-red-500/30 bg-red-500/10 text-red-400">
          <FiAlertTriangle size={18} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#a0bce0]">{title}</h2>
          <p className="mt-1 text-[12px] text-[#3a5a8a]">{message}</p>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-[#1e3260] px-4 py-1.5 text-[13px] text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#a0bce0] transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          autoFocus
          onClick={onConfirm}
          className="flex items-center gap-2 rounded border border-red-500/50 bg-red-500/10 px-4 py-1.5 text-[13px] text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
        >
          {ConfirmIcon && <ConfirmIcon size={13} />}
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
