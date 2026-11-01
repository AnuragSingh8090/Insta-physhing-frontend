import { Icons } from "./Icons";
import Button from "./Button";

const fmt = (iso) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
};

export default function SentModal({ info, onClose }) {
  const when = info.scheduled ? fmt(info.scheduled) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-[#0b1527] border border-[#1e3260] p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Icons.Check className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#a0bce0]">{when ? "Message scheduled" : "Message sent"}</h3>
        <p className="mt-1 text-sm text-[#6b8cba]">
          "{info.type}" {when ? `will be sent to ${info.email} on ${when.date}, ${when.time}.` : `notification was sent to ${info.email}.`}
        </p>
        <Button onClick={onClose} className="mt-5 w-full bg-[#3d7aba] text-white hover:bg-[#2d6aa4]">OK</Button>
      </div>
    </div>
  );
}
