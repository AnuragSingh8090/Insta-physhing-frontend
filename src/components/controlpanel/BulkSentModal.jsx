import { Icons } from "./Icons";
import Button from "./Button";

export default function BulkSentModal({ info, onClose }) {
  const done = info.sent + info.scheduled;
  const detail = [
    info.sent ? `${info.sent} sent now` : "",
    info.scheduled ? `${info.scheduled} scheduled` : "",
    info.skipped ? `${info.skipped} left unchanged` : "",
  ].filter(Boolean).join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-[#0b1527] border border-[#1e3260] p-6 text-center shadow-2xl">
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
          done ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
        }`}>
          {done ? <Icons.Check className="w-6 h-6" /> : <Icons.Send className="w-6 h-6" />}
        </div>
        <h3 className="text-base font-semibold text-[#a0bce0]">{done ? "Selected messages sent" : "Nothing to send"}</h3>
        <p className="mt-1 text-sm text-[#6b8cba]">
          {done
            ? `Each selected item used its own send settings. ${detail}.`
            : "Already scheduled items stay as they are, and a schedule needs a future time."}
        </p>
        <Button onClick={onClose} className="mt-5 w-full bg-[#3d7aba] text-white hover:bg-[#2d6aa4]">OK</Button>
      </div>
    </div>
  );
}
