import { Icons } from "./Icons";

const fmt = (iso) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
};

const EMAIL_STATUS = {
  success: ["Success", "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"],
  failed: ["Failed", "bg-red-500/10 text-red-400 border-red-500/20"],
  scheduled: ["Scheduled", "bg-amber-500/10 text-amber-400 border-amber-500/20"],
  cancelled: ["Cancelled", "bg-[#0f1e38] text-[#6b8cba] border-[#1e3260]"],
};

const LOG_STATUS = {
  sent: { label: "Sent", dot: "bg-[#6ab0ff]", text: "text-[#6ab0ff]" },
  opened: { label: "Opened", dot: "bg-violet-500", text: "text-violet-400" },
  "password changed": { label: "Password changed", dot: "bg-teal-500", text: "text-teal-400" },
};

export default function Logs({ logs }) {
  if (!logs.length) return <p className="text-sm text-[#6b8cba] py-2">No notifications sent yet.</p>;

  return (
    <div className="space-y-1.5">
      {logs.map((l) => {
        const { date, time } = fmt(l.sentAt);
        const [emailLabel, emailCls] = EMAIL_STATUS[l.emailStatus] || EMAIL_STATUS.success;
        const life = LOG_STATUS[l.status] || LOG_STATUS.sent;

        return (
          <div
            key={l.id}
            className="grid grid-cols-[minmax(0,1fr)_10.5rem_5.75rem] items-center gap-x-6 rounded-lg bg-[#0b1527] border border-[#1e3260] px-3 py-2.5 text-sm"
          >
            <div className="min-w-0 flex items-center gap-2">
              <Icons.Mail className="w-4 h-4 shrink-0 text-[#3a5a8a]" />
              <span className="line-clamp-1 font-medium text-[#a0bce0]">{l.type}</span>
              <span className={`ml-1 inline-flex w-[8.5rem] shrink-0 items-center gap-1.5 text-xs font-medium ${life.text}`}>
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${life.dot}`} />
                <span className="truncate">{life.label}</span>
              </span>
            </div>
            <span className="flex w-full items-center gap-1.5 whitespace-nowrap text-[#6b8cba]">
              <Icons.Clock className="w-4 h-4 shrink-0" /> {date}, {time}
            </span>
            <span className={`inline-flex w-full justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${emailCls}`}>
              {emailLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
