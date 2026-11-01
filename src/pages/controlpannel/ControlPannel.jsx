import { useState, useRef, useEffect, useMemo } from "react";



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

  success: ["Success", "bg-emerald-50 text-emerald-700"],

  failed: ["Failed", "bg-red-50 text-red-700"],

  scheduled: ["Scheduled", "bg-amber-50 text-amber-700"],

  cancelled: ["Cancelled", "bg-slate-100 text-slate-600"],

};

const LOG_STATUS = {

  sent: { label: "Sent", dot: "bg-sky-500", text: "text-sky-700" },

  opened: { label: "Opened", dot: "bg-violet-500", text: "text-violet-700" },

  "password changed": { label: "Password changed", dot: "bg-teal-500", text: "text-teal-700" },

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

  return (

    <input

      ref={ref}

      type="checkbox"

      checked={checked}

      disabled={disabled}

      onChange={(e) => onChange(e.target.checked)}

      className="h-[18px] w-[18px] shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 rounded border-slate-400 accent-teal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"

    />

  );

};



const Avatar = ({ src, premium, size = "w-10 h-10" }) => {

  const img = (

    <div className={`${size} rounded-full overflow-hidden flex items-center justify-center bg-slate-100 text-slate-400`}>

      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <I.User className="w-5 h-5" />}

    </div>

  );

  if (!premium) return <div className="shrink-0 rounded-full ring-1 ring-slate-200">{img}</div>;

  return (

    <div className="relative shrink-0 mt-1.5">

      <span

        className="absolute text-amber-500 drop-shadow z-10"

        style={{ left: "86%", top: "13%", transform: "translate(-50%, -50%) rotate(45deg)" }}

      >

        <I.Crown className="w-4 h-4" />

      </span>

      <div className="rounded-full bg-gradient-to-br from-amber-200 via-yellow-500 to-amber-700 p-[2.5px] shadow-md shadow-amber-200">

        <div className="rounded-full bg-white p-[2px]">{img}</div>

      </div>

    </div>

  );

};



const Btn = ({ loading, children, className = "", ...p }) => (

  <button

    {...p}

    disabled={loading || p.disabled}

    className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${className}`}

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

        className="inline-flex w-60 items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"

      >

        <span className="flex items-center gap-2"><I.Filter className="w-4 h-4 text-slate-400" />{current.label}</span>

        <I.Chevron className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />

      </button>

      {open && (

        <ul className="absolute left-0 top-full mt-1.5 w-60 rounded-lg border border-slate-200 bg-white p-1 shadow-lg z-30">

          {FILTERS.map((f) => (

            <li key={f.value}>

              <button

                onClick={() => { onChange(f.value); setOpen(false); }}

                className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm text-left hover:bg-slate-50 ${f.value === value ? "text-teal-700 font-medium" : "text-slate-600"}`}

              >

                {f.label}

                {f.value === value && <I.Check className="w-4 h-4" />}

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

const selCls = "rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500";



function DateTimePicker({ value, onChange, disabled }) {

  const sel = value ? new Date(value) : null;

  const base = sel || new Date(Date.now() + 5 * 60000);

  const [open, setOpen] = useState(false);

  const [view, setView] = useState(new Date(base.getFullYear(), base.getMonth(), 1));

  const today = new Date(); today.setHours(0, 0, 0, 0);



  const h24 = base.getHours();

  const hour = h24 % 12 || 12;

  const pm = h24 >= 12;

  const minute = Math.floor(base.getMinutes() / 5) * 5;



  const commit = (d, h = hour, m = minute, isPm = pm) =>

    onChange(toLocalStr(new Date(d.getFullYear(), d.getMonth(), d.getDate(), (h % 12) + (isPm ? 12 : 0), m)));



  const first = view.getDay();

  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  const label = sel ? `${fmt(value).date}, ${fmt(value).time}` : "Select date & time";



  return (

    <div className="px-2 pb-1">

      <button

        type="button"

        disabled={disabled}

        onClick={() => setOpen(!open)}

        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${

          disabled ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400" : "border-slate-300 bg-white text-slate-700 hover:border-teal-500"

        }`}

      >

        <span className="flex items-center gap-2"><I.Clock className="w-4 h-4" /> {label}</span>

        <I.Chevron className={`w-4 h-4 transition-transform ${open && !disabled ? "rotate-180" : ""}`} />

      </button>



      {open && !disabled && (

        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">

          <div className="mb-2 flex items-center justify-between">

            <button onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} aria-label="Previous month" className="rounded p-1 text-slate-500 hover:bg-slate-100">

              <I.Chevron className="w-4 h-4 rotate-90" />

            </button>

            <span className="text-sm font-medium text-slate-800">{MONTHS[view.getMonth()]} {view.getFullYear()}</span>

            <button onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} aria-label="Next month" className="rounded p-1 text-slate-500 hover:bg-slate-100">

              <I.Chevron className="w-4 h-4 -rotate-90" />

            </button>

          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-slate-400 mb-1">

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

                  className={`h-8 rounded-md text-sm ${

                    active ? "bg-teal-600 text-white font-medium" : past ? "text-slate-300 cursor-not-allowed" : "text-slate-700 hover:bg-teal-50"

                  } ${!active && d.getTime() === today.getTime() ? "ring-1 ring-teal-400" : ""}`}

                >

                  {day}

                </button>

              );

            })}

          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">

            <I.Clock className="w-4 h-4 text-slate-400" />

            <select className={selCls} value={hour} onChange={(e) => commit(sel || today, +e.target.value)} aria-label="Hour">

              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => <option key={h} value={h}>{pad(h)}</option>)}

            </select>

            <span className="text-slate-400">:</span>

            <select className={selCls} value={minute} onChange={(e) => commit(sel || today, hour, +e.target.value)} aria-label="Minute">

              {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => <option key={m} value={m}>{pad(m)}</option>)}

            </select>

            <select className={selCls} value={pm ? "PM" : "AM"} onChange={(e) => commit(sel || today, hour, minute, e.target.value === "PM")} aria-label="AM or PM">

              <option>AM</option><option>PM</option>

            </select>

            <button onClick={() => setOpen(false)} className="ml-auto rounded-md bg-teal-600 px-3 py-1 text-sm font-medium text-white hover:bg-teal-700">Done</button>

          </div>

        </div>

      )}

    </div>

  );

}



/* ---------- send dropdown: pick ONE type, schedule at the end ---------- */

function SendMenu({ notify: n, onChange }) {

  const name = useRef(uid()).current;

  const [err, setErr] = useState("");

  const pending = !!n.pendingId && !!n.scheduledAt && new Date(n.scheduledAt).getTime() > Date.now();



  const changeTime = (v) => {

    if (new Date(v).getTime() <= Date.now()) return setErr("Pick a time in the future.");

    setErr("");

    onChange({ ...n, scheduledAt: v });

  };



  return (

    <div className="absolute right-0 top-full mt-1.5 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-30">

      <p className="text-xs font-medium text-slate-500 mb-2">Send notification for</p>

      {SEND_TYPES.map((t) => (

        <label

          key={t}

          className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm ${pending ? "cursor-not-allowed text-slate-400" : "cursor-pointer text-slate-700 hover:bg-slate-50"}`}

        >

          <input

            type="radio"

            name={name}

            checked={n.type === t}

            disabled={pending}

            onChange={() => onChange({ ...n, type: t })}

            className="h-4 w-4 shrink-0 accent-teal-600 disabled:cursor-not-allowed disabled:opacity-50"

          />

          {t}

        </label>

      ))}

      <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50/60 py-1">

        {pending ? (

          <p className="px-4 py-1.5 text-sm font-medium text-amber-700">Scheduled for</p>

        ) : (

          <label className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium cursor-pointer text-slate-700">

            <Checkbox checked={n.schedule} onChange={(v) => onChange({ ...n, schedule: v, scheduledAt: v ? n.scheduledAt : "" })} />

            Schedule

          </label>

        )}

        {(pending || n.schedule) && <DateTimePicker value={n.scheduledAt} onChange={changeTime} />}

        {err && <p className="px-4 pb-1 text-xs text-red-600">{err}</p>}

        {!err && pending && <p className="px-4 pb-1 text-xs text-slate-500">Change the date or time to reschedule.</p>}

        {!err && !pending && n.schedule && !n.scheduledAt && <p className="px-4 pb-1 text-xs text-slate-500">Pick a date and time to enable Send.</p>}

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

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">

      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">

        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">

          <I.Clock className="w-6 h-6" />

        </div>

        <h3 className="text-base font-semibold text-slate-900">Cancel scheduled message?</h3>

        <p className="mt-1 text-sm text-slate-500">Are you sure you want to cancel the scheduled message? It will not be sent.</p>

        <div className="mt-5 flex gap-2">

          <Btn onClick={onClose} disabled={loading} className="flex-1 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">No, keep it</Btn>

          <Btn onClick={go} loading={loading} className="flex-1 bg-red-600 text-white hover:bg-red-700">Yes, cancel</Btn>

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

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">

      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">

        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${done ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>

          {done ? <I.Check className="w-6 h-6" /> : <I.Send className="w-6 h-6" />}

        </div>

        <h3 className="text-base font-semibold text-slate-900">{done ? "Selected messages sent" : "Nothing to send"}</h3>

        <p className="mt-1 text-sm text-slate-500">

          {done

            ? `Each selected item used its own send settings. ${detail}.`

            : "Already scheduled items stay as they are, and a schedule needs a future time."}

        </p>

        <Btn onClick={onClose} className="mt-5 w-full bg-teal-600 text-white hover:bg-teal-700">OK</Btn>

      </div>

    </div>

  );

}



/* ---------- "message sent" popup ---------- */

function SentModal({ info, onClose }) {

  const when = info.scheduled ? fmt(info.scheduled) : null;

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">

      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">

        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">

          <I.Check className="w-6 h-6" />

        </div>

        <h3 className="text-base font-semibold text-slate-900">{when ? "Message scheduled" : "Message sent"}</h3>

        <p className="mt-1 text-sm text-slate-500">

          “{info.type}” {when ? `will be sent to ${info.email} on ${when.date}, ${when.time}.` : `notification was sent to ${info.email}.`}

        </p>

        <Btn onClick={onClose} className="mt-5 w-full bg-teal-600 text-white hover:bg-teal-700">OK</Btn>

      </div>

    </div>

  );

}



/* ---------- logs ---------- */

function Logs({ logs }) {

  if (!logs.length) return <p className="text-sm text-slate-500 py-2">No notifications sent yet.</p>;

  return (

    <div className="space-y-1.5">

      {logs.map((l) => {

        const { date, time } = fmt(l.sentAt);

        const [emailLabel, emailCls] = EMAIL_STATUS[l.emailStatus] || EMAIL_STATUS.success;

        const life = LOG_STATUS[l.status] || LOG_STATUS.sent;

        return (

          <div

            key={l.id}

            className="grid grid-cols-[minmax(0,1fr)_10.5rem_5.75rem] items-center gap-x-6 rounded-lg bg-white border border-slate-200 px-3 py-2.5 text-sm"

          >

            <div className="min-w-0 flex items-center gap-2">

              <I.Mail className="w-4 h-4 shrink-0 text-slate-400" />

              <span className="line-clamp-1 font-medium text-slate-700">{l.type}</span>

              <span className={`ml-1 inline-flex w-[8.5rem] shrink-0 items-center gap-1.5 text-xs font-medium ${life.text}`}>

                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${life.dot}`} />

                <span className="truncate">{life.label}</span>

              </span>

            </div>

            <span className="flex w-full items-center gap-1.5 whitespace-nowrap text-slate-500">

              <I.Clock className="w-4 h-4 shrink-0" /> {date}, {time}

            </span>

            <span className={`inline-flex w-full justify-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${emailCls}`}>{emailLabel}</span>

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

    const info = { type: n.type, email: r.email, scheduled: n.schedule ? n.scheduledAt : null };

    setSending(true);

    await delay();

    onSend();

    setSending(false);

    setDone(info);

  };



  return (

    <div className="border-b border-slate-100 last:border-0">

      <div className={`flex flex-wrap items-center gap-4 px-4 py-3 ${premium ? "bg-gradient-to-r from-amber-50/70 to-white" : "hover:bg-slate-50/70"}`}>

        <Checkbox checked={selected} onChange={onSelect} />

        <Avatar src={premium ? r.avatar : ""} premium={premium} />

        <div className="flex-1 min-w-[160px] space-y-0.5">

          <p className={`flex items-center gap-1.5 text-sm font-medium ${r.username ? "text-slate-800" : "text-slate-400"}`}>

            <I.User className="w-3.5 h-3.5 shrink-0 text-slate-400" />

            <span className="line-clamp-1">{r.username || "-"}</span>

          </p>

          <p className="flex items-center gap-1.5 text-sm text-slate-500">

            <I.Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />

            <span className="line-clamp-1">{r.email}</span>

          </p>

        </div>

        <div className="flex items-center gap-2 shrink-0">

          <Btn onClick={onEdit} className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 !px-3 !py-1.5">

            <I.Edit /> Edit

          </Btn>

          <Btn onClick={onDelete} loading={deleting} className="border border-red-200 bg-white text-red-600 hover:bg-red-50 !px-3 !py-1.5">

            {!deleting && <I.Trash />} Delete

          </Btn>

          <div ref={sendBox} className="relative inline-flex items-stretch overflow-visible rounded-lg">

            {pending ? (

              <button

                type="button"

                onClick={() => setConfirm(true)}

                title={`Scheduled for ${fmt(n.scheduledAt).date}, ${fmt(n.scheduledAt).time}`}

                className="inline-flex items-center gap-1.5 rounded-l-lg border border-r-0 border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"

              >

                <I.Close /> Cancel

              </button>

            ) : (

              <button

                type="button"

                onClick={send}

                disabled={sending || cantSend}

                title={cantSend ? "Pick a future date and time for the schedule" : "Send notification"}

                className="inline-flex items-center gap-1.5 rounded-l-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"

              >

                {sending ? <I.Spinner /> : <I.Send />} {sending ? "Sending" : "Send"}

              </button>

            )}

            <button

              type="button"

              onClick={() => setMenu((openMenu) => !openMenu)}

              disabled={sending}

              aria-label="Send options"

              aria-expanded={menu}

              title="Send options"

              className={`inline-flex items-center rounded-r-lg border bg-white px-1.5 text-slate-500 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-60 ${

                pending ? "border-red-300" : "border-slate-300"

              }`}

            >

              <I.Chevron className={`w-4 h-4 transition-transform ${menu ? "rotate-180" : ""}`} />

            </button>

            {menu && <SendMenu notify={n} onChange={onNotify} />}

          </div>

          <button

            onClick={() => setOpen(!open)}

            aria-label="Toggle logs"

            aria-expanded={open}

            title="Sent logs"

            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"

          >

            <I.Chevron className={`w-5 h-5 transition-transform ${open ? "rotate-180" : ""}`} />

          </button>

        </div>

      </div>

      {open && (

        <div className="bg-slate-50 px-4 py-3 sm:pl-[72px]">

          <p className="text-xs font-medium text-slate-500 mb-2">Sent notifications ({r.logs.length})</p>

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

const DEFAULT_ADDRESS = "Kanpur, UP, India"; // e.g. where a new-device login was detected

const blank = (adv) => ({

  _k: uid(), username: "", email: "", avatar: "",

  deviceName: adv ? DEFAULT_DEVICE : "",

  address: adv ? DEFAULT_ADDRESS : "",

});



function Field({ label, required, error, children }) {

  return (

    <div>

      <label className="block text-sm font-medium text-slate-700 mb-1">

        {label} {required ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(optional)</span>}

      </label>

      {children}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

    </div>

  );

}

const inputCls = (err) =>

  `w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 ${err ? "border-red-400" : "border-slate-300"}`;



function RecordModal({ mode, record, onClose, onSave }) {

  const adv = mode === "advance";

  const editing = !!record;

  const [entries, setEntries] = useState(editing ? [{ ...blank(adv), ...record }] : [blank(adv)]);

  const [errors, setErrors] = useState({});

  const [saving, setSaving] = useState(false);



  const set = (k, field, v) => setEntries((es) => es.map((e) => (e._k === k ? { ...e, [field]: v } : e)));

  const pickFile = (k, file) => {

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => set(k, "avatar", reader.result);

    reader.readAsDataURL(file);

  };



  const validate = () => {

    const errs = {};

    entries.forEach((e) => {

      const x = {};

      if (!e.email.trim()) x.email = "Email is required";

      else if (!/^\S+@\S+\.\S+$/.test(e.email)) x.email = "Enter a valid email";

      if (adv) {

        if (!e.username.trim()) x.username = "Username is required";

        if (!e.deviceName.trim()) x.deviceName = "Device name is required";

        if (!e.address.trim()) x.address = "Address is required";

        if (!e.avatar) x.avatar = "Profile picture is required";

      }

      if (Object.keys(x).length) errs[e._k] = x;

    });

    setErrors(errs);

    return !Object.keys(errs).length;

  };



  const save = async () => {

    if (!validate()) return;

    setSaving(true);

    await delay();

    onSave(entries);

    setSaving(false);

    onClose();

  };



  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">

      <div className="flex max-h-full w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">

            {adv && <I.Crown className="w-5 h-5 text-amber-500" />}

            {editing ? (adv ? "Edit advance data" : "Edit simple data") : adv ? "Add new advance data" : "Add new simple data"}

          </h2>

          <button onClick={onClose} disabled={saving} aria-label="Close" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50">

            <I.Close className="w-5 h-5" />

          </button>

        </div>



        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {entries.map((e, i) => {

            const er = errors[e._k] || {};

            return (

              <div key={e._k} className="rounded-xl border border-slate-200 p-4 space-y-3">

                {entries.length > 1 && (

                  <div className="flex items-center justify-between">

                    <span className="text-xs font-medium text-slate-500">Entry {i + 1}</span>

                    <button onClick={() => setEntries(entries.filter((x) => x._k !== e._k))} aria-label="Remove entry" className="text-slate-400 hover:text-red-600">

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

                {adv && (

                  <>

                    <Field label="Device name" required error={er.deviceName}>

                      <input className={inputCls(er.deviceName)} value={e.deviceName} onChange={(ev) => set(e._k, "deviceName", ev.target.value)} placeholder="e.g. Redmi Note 12" />

                    </Field>

                    <Field label="Address" required error={er.address}>

                      <input className={inputCls(er.address)} value={e.address} onChange={(ev) => set(e._k, "address", ev.target.value)} placeholder="City, country" />

                    </Field>

                    <Field label="Profile picture" required error={er.avatar}>

                      <div className="flex items-center gap-3">

                        <Avatar src={e.avatar} premium />

                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">

                          <I.Upload /> {e.avatar ? "Change image" : "Upload image"}

                          <input type="file" accept="image/*" className="hidden" onChange={(ev) => pickFile(e._k, ev.target.files[0])} />

                        </label>

                      </div>

                    </Field>

                  </>

                )}

              </div>

            );

          })}

          {!editing && (

            <button

              onClick={() => setEntries([...entries, blank(adv)])}

              className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-teal-500 hover:text-teal-700"

            >

              <I.Plus /> Add another entry

            </button>

          )}

        </div>



        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">

          <Btn onClick={onClose} disabled={saving} className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">Cancel</Btn>

          <Btn onClick={save} loading={saving} className="bg-teal-600 text-white hover:bg-teal-700">{saving ? "Saving" : "Save"}</Btn>

        </div>

      </div>

    </div>

  );

}



/* ---------- seed data: ONE array for simple + advance ---------- */

const defaultNotify = () => ({ type: SEND_TYPES[0], schedule: false, scheduledAt: "", pendingId: null });

const SEED = [

  { id: "1", type: "advance", username: "aarav_k", email: "aarav.kumar@example.com", deviceName: "Redmi Note 12", address: "Bengaluru, India", avatar: "", notify: defaultNotify(),

    logs: mkLogs([[SEND_TYPES[0], "2026-10-24T09:12:00", "success", "opened"], [SEND_TYPES[1], "2026-10-22T18:40:00", "failed", "sent"]]) },

  { id: "2", type: "simple", username: "", email: "support-team-with-a-very-long-address@example-company-domain.com", avatar: "", notify: defaultNotify(),

    logs: mkLogs([[SEND_TYPES[1], "2026-10-25T07:05:00", "success", "password changed"]]) },

  { id: "3", type: "simple", username: "meera.s", email: "meera@example.com", avatar: "", notify: { type: SEND_TYPES[1], schedule: false, scheduledAt: "", pendingId: null }, logs: [] },

  { id: "4", type: "advance", username: "rohan_dev", email: "rohan@example.com", deviceName: "Pixel 8", address: "Mumbai, India", avatar: "https://i.pravatar.cc/100?img=12", notify: defaultNotify(),

    logs: mkLogs([[SEND_TYPES[0], "2026-10-20T21:30:00", "success", "sent"], [SEND_TYPES[0], "2026-10-19T10:00:00", "success", "opened"], [SEND_TYPES[1], "2026-10-18T14:15:00", "failed", "sent"]]) },

  { id: "5", type: "simple", username: "kavya", email: "kavya@example.com", avatar: "", notify: defaultNotify(), logs: [] },

];



/* ---------- main ---------- */

export default function RecordsDashboard() {

  const [records, setRecords] = useState(SEED);

  const [filter, setFilter] = useState("all");

  const [selected, setSelected] = useState([]);

  const [modal, setModal] = useState(null); // { mode, record }

  const [deletingIds, setDeletingIds] = useState([]);

  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [bulkSending, setBulkSending] = useState(false);

  const [bulkResult, setBulkResult] = useState(null);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    const t = setTimeout(() => setLoading(false), 1500);

    return () => clearTimeout(t);

  }, []);



  const refresh = async () => {

    setLoading(true);

    setSelected([]);

    await delay();

    setLoading(false);

  };



  const visible = useMemo(() => records.filter((r) => filter === "all" || r.type === filter), [records, filter]);

  const selectedVisible = visible.filter((r) => selected.includes(r.id));

  const allChecked = visible.length > 0 && selectedVisible.length === visible.length;



  const toggleAll = () =>

    setSelected(allChecked ? selected.filter((id) => !visible.some((r) => r.id === id)) : [...new Set([...selected, ...visible.map((r) => r.id)])]);

  const toggleOne = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));



  const deleteOne = async (id) => {

    setDeletingIds((d) => [...d, id]);

    await delay();

    setRecords((rs) => rs.filter((r) => r.id !== id));

    setSelected((s) => s.filter((x) => x !== id));

    setDeletingIds((d) => d.filter((x) => x !== id));

  };

  const bulkDelete = async () => {

    setBulkDeleting(true);

    await delay();

    const ids = selectedVisible.map((r) => r.id);

    setRecords((rs) => rs.filter((r) => !ids.includes(r.id)));

    setSelected((s) => s.filter((x) => !ids.includes(x)));

    setBulkDeleting(false);

  };

  const canSendRow = (r) => {

    const n = r.notify;

    const pending = !!n.pendingId && !!n.scheduledAt && new Date(n.scheduledAt).getTime() > Date.now();

    const cantSend = n.schedule && (!n.scheduledAt || new Date(n.scheduledAt).getTime() <= Date.now());

    return !pending && !cantSend;

  };

  const makeLog = (n) => ({

    id: uid(),

    type: n.type,

    sentAt: n.schedule ? new Date(n.scheduledAt).toISOString() : new Date().toISOString(),

    emailStatus: n.schedule ? "scheduled" : "success",

    status: "sent",

  });

  const sendAll = async () => {

    const targets = selectedVisible.filter(canSendRow);

    const skipped = selectedVisible.length - targets.length;

    if (!targets.length) {

      setBulkResult({ sent: 0, scheduled: 0, skipped });

      return;

    }

    setBulkSending(true);

    await delay();

    const ids = new Set(targets.map((r) => r.id));

    setRecords((rs) =>

      rs.map((r) => {

        if (!ids.has(r.id)) return r;

        const n = r.notify;

        const log = makeLog(n);

        return { ...r, logs: [log, ...r.logs], notify: n.schedule ? { ...n, pendingId: log.id } : n };

      })

    );

    const scheduled = targets.filter((r) => r.notify.schedule).length;

    setBulkSending(false);

    setBulkResult({ sent: targets.length - scheduled, scheduled, skipped });

  };



  const handleSave = (entries) => {

    const mode = modal.mode;

    if (modal.record) {

      const e = entries[0];

      setRecords((rs) => rs.map((r) => (r.id === modal.record.id ? { ...r, username: e.username, email: e.email, deviceName: e.deviceName, address: e.address, avatar: e.avatar } : r)));

    } else {

      const created = entries.map((e) => ({

        id: uid(), type: mode, username: e.username, email: e.email,

        ...(mode === "advance" ? { deviceName: e.deviceName, address: e.address } : {}),

        avatar: mode === "advance" ? e.avatar : "", notify: defaultNotify(), logs: [],

      }));

      setRecords((rs) => [...created, ...rs]);

    }

  };



  // changing the time of an active schedule also moves its log entry

  const updateNotify = (id, notify) =>

    setRecords((rs) =>

      rs.map((r) =>

        r.id !== id ? r : {

          ...r,

          notify,

          logs: notify.pendingId

            ? r.logs.map((l) => (l.id === notify.pendingId ? { ...l, sentAt: new Date(notify.scheduledAt).toISOString() } : l))

            : r.logs,

        }

      )

    );



  const sendNotification = (id) =>

    setRecords((rs) =>

      rs.map((r) => {

        if (r.id !== id) return r;

        const n = r.notify;

        const log = makeLog(n);

        return { ...r, logs: [log, ...r.logs], notify: n.schedule ? { ...n, pendingId: log.id } : n };

      })

    );



  const clearSchedule = (r, emailStatus) => ({

    ...r,

    logs: r.logs.map((l) => (l.id === r.notify.pendingId ? { ...l, emailStatus, status: emailStatus === "success" ? "sent" : l.status } : l)),

    notify: { ...r.notify, schedule: false, scheduledAt: "", pendingId: null },

  });

  const cancelSchedule = (id) => setRecords((rs) => rs.map((r) => (r.id === id && r.notify.pendingId ? clearSchedule(r, "cancelled") : r)));



  // when a scheduled time is reached, mark it as sent and bring the Send button back

  useEffect(() => {

    const t = setInterval(() => {

      const due = (r) => r.notify.pendingId && new Date(r.notify.scheduledAt).getTime() <= Date.now();

      setRecords((rs) => (rs.some(due) ? rs.map((r) => (due(r) ? clearSchedule(r, "success") : r)) : rs));

    }, 1000);

    return () => clearInterval(t);

  }, []);



  return (

    <div className="h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">

      {/* Header (static) */}

      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 py-3">

        <div className="flex items-center gap-2">

          <FilterDropdown value={filter} onChange={setFilter} />

          <button

            onClick={refresh}

            disabled={loading}

            title="Refresh"

            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"

          >

            <I.Refresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh

          </button>

        </div>

        <div className="flex items-center gap-2">

          <Btn onClick={() => setModal({ mode: "simple", record: null })} className="border border-teal-600 bg-white text-teal-700 hover:bg-teal-50">

            <I.Plus /> Add simple record

          </Btn>

          <Btn onClick={() => setModal({ mode: "advance", record: null })} className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white hover:from-amber-600 hover:to-yellow-700">

            <I.Crown className="w-4 h-4" /> Add advance record

          </Btn>

        </div>

      </header>



      {/* Body (scrollable, fills remaining screen height) */}

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">

        {loading ? (

          <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white" role="status" aria-live="polite">

            <div className="flex h-14 items-center border-b border-slate-200 bg-slate-50 px-4">

              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />

            </div>

            {[0, 1, 2, 3, 4].map((i) => (

              <div key={i} className="flex items-center gap-4 border-b border-slate-100 px-4 py-4 last:border-0">

                <div className="h-[18px] w-[18px] animate-pulse rounded bg-slate-200" />

                <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />

                <div className="flex-1 space-y-2">

                  <div className="h-3.5 w-1/4 animate-pulse rounded bg-slate-200" />

                  <div className="h-3.5 w-2/5 animate-pulse rounded bg-slate-100" />

                </div>

                <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />

              </div>

            ))}

            <div className="flex items-center justify-center gap-2 py-5 text-sm text-slate-500">

              <I.Spinner className="w-4 h-4 text-teal-600" /> Loading records

            </div>

          </div>

        ) : (

        <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white">

          {/* list header */}

          <div className="flex h-14 items-center gap-4 rounded-t-xl border-b border-slate-200 bg-slate-50 px-4">

            <Checkbox checked={allChecked} indeterminate={!allChecked && selectedVisible.length > 0} onChange={toggleAll} />

            <span className="text-sm font-medium text-slate-600">

              {selectedVisible.length ? `${selectedVisible.length} selected` : `${visible.length} record${visible.length === 1 ? "" : "s"}`}

            </span>

            {selectedVisible.length > 0 && (

              <div className="ml-auto flex items-center gap-2">

                <Btn onClick={sendAll} loading={bulkSending} disabled={bulkDeleting} className="bg-teal-600 text-white hover:bg-teal-700 !py-1.5">

                  {!bulkSending && <I.Send />} Send all

                </Btn>

                <Btn onClick={bulkDelete} loading={bulkDeleting} disabled={bulkSending} className="bg-red-600 text-white hover:bg-red-700 !py-1.5">

                  {!bulkDeleting && <I.Trash />} Delete

                </Btn>

              </div>

            )}

          </div>



          {/* rows */}

          {visible.length === 0 ? (

            <p className="px-4 py-16 text-center text-sm text-slate-500">No records here yet. Use the buttons above to add one.</p>

          ) : (

            visible.map((r) => (

              <Row

                key={r.id}

                r={r}

                selected={selected.includes(r.id)}

                onSelect={() => toggleOne(r.id)}

                onEdit={() => setModal({ mode: r.type, record: r })}

                onDelete={() => deleteOne(r.id)}

                deleting={deletingIds.includes(r.id)}

                onNotify={(n) => updateNotify(r.id, n)}

                onSend={() => sendNotification(r.id)}

                onCancel={() => cancelSchedule(r.id)}

              />

            ))

          )}

        </div>

        )}

        <div className="h-72" />

      </main>



      {modal && <RecordModal mode={modal.mode} record={modal.record} onClose={() => setModal(null)} onSave={handleSave} />}

      {bulkResult && <BulkSentModal info={bulkResult} onClose={() => setBulkResult(null)} />}

    </div>

  );

}