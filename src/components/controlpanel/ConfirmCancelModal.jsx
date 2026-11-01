import { useState } from "react";
import { Icons } from "./Icons";
import Button from "./Button";

const delay = (ms = 1500) => new Promise((r) => setTimeout(r, ms));

export default function ConfirmCancelModal({ onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);

  const go = async () => {
    setLoading(true);
    await delay();
    onConfirm();
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-[#0b1527] border border-[#1e3260] p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
          <Icons.Clock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#a0bce0]">Cancel scheduled message?</h3>
        <p className="mt-1 text-sm text-[#6b8cba]">Are you sure you want to cancel the scheduled message? It will not be sent.</p>
        <div className="mt-5 flex gap-2">
          <Button onClick={onClose} disabled={loading} className="flex-1 border border-[#1e3260] bg-[#0b1527] text-[#a0bce0] hover:bg-[#0f1e38]">
            No, keep it
          </Button>
          <Button onClick={go} loading={loading} className="flex-1 bg-red-600 text-white hover:bg-red-700">
            Yes, cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
