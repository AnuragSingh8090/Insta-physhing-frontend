import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { io } from "socket.io-client";
import InstagramEndpoints from "../../services/api-endpoints";

// ─── Icons ────────────────────────────────────────────────────────────────────

const Ic = ({ d, cls = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
    strokeLinecap="round" strokeLinejoin="round" className={cls}>
    {d}
  </svg>
);

const IcoRefresh  = () => <Ic d={<><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>} />;
const IcoDownload = () => <Ic d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>} />;
const IcoClear    = () => <Ic d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></>} />;
const IcoTrash    = () => <Ic cls="w-3.5 h-3.5" d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>} />;
const IcoCopy     = () => <Ic d={<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>} />;
const IcoChevron  = ({ open }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
    className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IcoServer   = () => <Ic cls="w-4 h-4" d={<><rect x="2" y="3" width="20" height="5" rx="1"/><rect x="2" y="10" width="20" height="5" rx="1"/><rect x="2" y="17" width="20" height="5" rx="1"/></>} />;
const IcoChevDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ─── Colours ──────────────────────────────────────────────────────────────────

const METHOD_COLOR = {
  GET:    "bg-[#2ecc71] text-[#0a0f1a]",
  POST:   "bg-[#3498db] text-[#0a0f1a]",
  PUT:    "bg-[#f39c12] text-[#0a0f1a]",
  DELETE: "bg-[#e74c3c] text-white",
  PATCH:  "bg-[#9b59b6] text-white",
};

const statusMeta = (s) => {
  if (s >= 500) return { dot: "bg-red-500",    badge: "bg-red-500/15 text-red-400 border-red-500/30" };
  if (s >= 400) return { dot: "bg-red-400",    badge: "bg-red-500/15 text-red-400 border-red-500/30" };
  if (s >= 300) return { dot: "bg-yellow-400", badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" };
  return         { dot: "bg-[#2ecc71]",  badge: "bg-[#2ecc71]/10 text-[#2ecc71] border-[#2ecc71]/30" };
};

const respColor = (ms) => ms > 300 ? "text-red-400" : ms > 150 ? "text-yellow-400" : "text-[#2ecc71]";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtTs = (d) =>
  d.toLocaleString("en-IN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).replace(",", "") + " IST";

const fmtClock = (d) => d.toLocaleTimeString("en-US", { hour12: false });

// ─── Copy button ──────────────────────────────────────────────────────────────

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border border-[#2a3a5c] text-[#6b8cba] hover:border-[#3d5a8a] hover:text-[#a0bce0] transition-colors cursor-pointer"
    >
      <IcoCopy />
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

// ─── JSON block (recursive — handles nested objects & arrays) ─────────────────

const JsonValue = ({ v }) => {
  if (v === null || v === undefined)
    return <span className="text-[#6b8cba]">null</span>;
  if (typeof v === "string")
    return <span className="text-[#e8c97a]">"{v}"</span>;
  if (typeof v === "number" || typeof v === "boolean")
    return <span className="text-[#e8c97a]">{String(v)}</span>;
  if (Array.isArray(v)) {
    return (
      <span>
        <span className="text-[#6b8cba]">[</span>
        {v.map((item, i) => (
          <div key={i} className="pl-4">
            <JsonValue v={item} />
            {i < v.length - 1 && <span className="text-[#6b8cba]">,</span>}
          </div>
        ))}
        <span className="text-[#6b8cba]">]</span>
      </span>
    );
  }
  // Object — recurse
  const entries = Object.entries(v);
  return (
    <span>
      <span className="text-[#6b8cba]">{"{"}</span>
      {entries.map(([k, val], i) => (
        <div key={k} className="pl-4">
          <span className="text-[#a0bce0]">"{k}"</span>
          <span className="text-[#6b8cba]">: </span>
          <JsonValue v={val} />
          {i < entries.length - 1 && <span className="text-[#6b8cba]">,</span>}
        </div>
      ))}
      <span className="text-[#6b8cba]">{"}"}</span>
    </span>
  );
};

const JsonBlock = ({ data }) => {
  if (!data) return null;
  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  return (
    <div className="font-mono text-[12px] leading-relaxed">
      <JsonValue v={parsed} />
    </div>
  );
};

// ─── Headers block ────────────────────────────────────────────────────────────

const HeadersBlock = ({ headers }) => {
  const entries = Object.entries(headers).filter(([, v]) => v !== undefined);
  return (
    <div className="font-mono text-[12px] leading-relaxed">
      <span className="text-[#6b8cba]">{"{"}</span>
      {entries.map(([k, v], i) => (
        <div key={k} className="pl-4">
          <span className="text-[#a0bce0]">"{k}"</span>
          <span className="text-[#6b8cba]">: </span>
          <span className="text-[#e8c97a]">"{v}"</span>
          {i < entries.length - 1 && <span className="text-[#6b8cba]">,</span>}
        </div>
      ))}
      <span className="text-[#6b8cba]">{"}"}</span>
    </div>
  );
};

// ─── Card section ─────────────────────────────────────────────────────────────

const CardSection = ({ icon, title, copyText, children }) => (
  <div className="mt-3">
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-[#3d7aba]">
        <span>{icon}</span>
        {title}
      </div>
      {copyText && <CopyBtn text={copyText} />}
    </div>
    <div className="rounded border border-[#1a2d50] bg-[#070d1a] px-3 py-2.5">
      {children}
    </div>
  </div>
);

// ─── Confirm dialog ───────────────────────────────────────────────────────────

const IcoAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
    strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

function ConfirmDialog({ title, message, onConfirm, onClose }) {
  useEffect(() => {
    const h = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060d1c]/80 p-4"
      onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true"
        className="w-full max-w-md rounded border border-[#1e3260] bg-[#0b1527] p-6 shadow-[0_24px_48px_-12px_rgba(0,0,20,0.8)]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-red-500/30 bg-red-500/10 text-red-400">
            <IcoAlert />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#a0bce0]">{title}</h2>
            <p className="mt-1 text-[12px] text-[#3a5a8a]">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose}
            className="rounded border border-[#1e3260] px-4 py-1.5 text-[13px] text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#a0bce0] transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={onConfirm} autoFocus
            className="flex items-center gap-2 rounded border border-red-500/50 bg-red-500/10 px-4 py-1.5 text-[13px] text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer">
            <IcoTrash /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Request card — collapsed by default, with per-card delete ───────────────

const RequestCard = ({ req, onDelete }) => {
  const [open, setOpen] = useState(false);
  const sm = statusMeta(req.status);

  return (
    <div className={`rounded border ${open ? "border-[#1e3260]" : "border-[#131e35]"} bg-[#0b1527] overflow-hidden`}>

      {/* Summary row */}
      <div className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#0f1e38] transition-colors">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex-1 flex items-center gap-2.5 text-left cursor-pointer min-w-0"
        >
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${sm.dot}`} />

          <span className="text-[11px] text-[#4a6a9a] font-mono shrink-0 hidden sm:block">
            {fmtTs(req.timestamp)}
          </span>

          <span className={`px-2 py-0.5 text-[11px] font-bold rounded shrink-0 ${METHOD_COLOR[req.method] ?? "bg-gray-600 text-white"}`}>
            {req.method}
          </span>

          <span className="flex-1 font-mono text-[13px] text-[#6ab0ff] truncate">
            {req.path}
          </span>

          <span className={`px-2 py-0.5 text-[11px] font-bold rounded border shrink-0 ${sm.badge}`}>
            {req.status}
          </span>

          <span className={`text-[12px] font-mono font-bold shrink-0 w-14 text-right ${respColor(req.ms)}`}>
            {req.ms}ms
          </span>

          <IcoChevron open={open} />
        </button>

        {/* Per-request delete button */}
        <button
          onClick={() => onDelete(req.id)}
          title="Delete this request"
          aria-label="Delete this request"
          className="shrink-0 p-1 rounded text-[#3a5a8a] hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
        >
          <IcoTrash />
        </button>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="px-3 pb-3 border-t border-[#131e35]">

          <CardSection icon={<IcoServer />} title="Request Info">
            <div className="space-y-1 font-mono text-[12px]">
              <div className="flex gap-2">
                <span className="text-[#4a6a9a] w-28 shrink-0">IP Address:</span>
                <span className="text-[#a0bce0]">{req.ip || "—"}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#4a6a9a] w-28 shrink-0">Response Time:</span>
                <span className={`font-bold ${respColor(req.ms)}`}>{req.ms}ms</span>
              </div>
            </div>
          </CardSection>

          <CardSection
            icon={<span className="text-[10px]">▣</span>}
            title="Request Headers"
            copyText={JSON.stringify(
              Object.fromEntries(Object.entries(req.reqHeaders ?? {}).filter(([, v]) => v !== undefined)),
              null, 2
            )}
          >
            <HeadersBlock headers={req.reqHeaders ?? {}} />
          </CardSection>

          {req.reqBody && (
            <CardSection
              icon={<span className="text-[10px]">▣</span>}
              title="Request Body"
              copyText={JSON.stringify(req.reqBody, null, 2)}
            >
              <JsonBlock data={req.reqBody} />
            </CardSection>
          )}

          {req.resBody && (
            <CardSection
              icon={<span className="text-[10px]">▣</span>}
              title="Response Body"
              copyText={JSON.stringify(req.resBody, null, 2)}
            >
              <JsonBlock data={req.resBody} />
            </CardSection>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Bar chart ────────────────────────────────────────────────────────────────

const BarChart = ({ data }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-14">
      {data.map((v, i) => (
        <div key={i} className="flex-1">
          <div
            className="w-full rounded-t"
            style={{
              height: `${Math.max(4, (v / max) * 100)}%`,
              background: "linear-gradient(to top, #1a4a8a, #3d7aba)",
            }}
          />
        </div>
      ))}
    </div>
  );
};

// ─── Custom dropdown (matches existing style) ──────────────────────────────────

function Dropdown({ value, onChange, options }) {
  const [open, setOpen]     = useState(false);
  const [active, setActive] = useState(0);
  const rootRef             = useRef(null);
  const selected            = options.find(o => o.value === value);

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
    if      (e.key === "ArrowDown")                        { e.preventDefault(); setActive(i => (i + 1) % options.length); }
    else if (e.key === "ArrowUp")                          { e.preventDefault(); setActive(i => (i - 1 + options.length) % options.length); }
    else if (e.key === "Enter" || e.key === " ")           { e.preventDefault(); choose(options[active]); }
  };

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button" aria-haspopup="listbox" aria-expanded={open}
        onClick={() => open ? setOpen(false) : openMenu()}
        className="flex h-7 min-w-[9rem] items-center gap-2 rounded border border-[#1e3260] bg-[#0b1527] px-2.5 text-left text-[11px] text-[#6b8cba] outline-none transition-colors hover:border-[#3d7aba] hover:text-[#a0bce0] focus-visible:ring-1 focus-visible:ring-[#3d7aba]/50 cursor-pointer"
      >
        <span className="flex-1 truncate">{selected?.label}</span>
        <IcoChevDown />
      </button>
      {open && (
        <ul role="listbox"
          className="absolute left-0 top-full z-30 mt-1 w-full min-w-[10rem] overflow-hidden rounded border border-[#1e3260] bg-[#0b1527] p-1 shadow-[0_12px_28px_-8px_rgba(0,0,0,0.7)]">
          {options.map((opt, i) => (
            <li key={opt.value} role="option" aria-selected={opt.value === value}
              onMouseEnter={() => setActive(i)} onClick={() => choose(opt)}
              className={`flex cursor-pointer items-center gap-2 rounded px-2.5 py-1.5 text-[11px] transition-colors ${
                i === active ? "bg-[#1e3260] text-[#a0bce0]" : "text-[#6b8cba]"
              }`}>
              <span className="flex-1">{opt.label}</span>
              {opt.value === value && <span className="text-[#3d7aba] text-[9px]">✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Filter options ───────────────────────────────────────────────────────────

const STATUS_OPTS = [
  { value: "all", label: "All Status" },
  { value: "2xx", label: "2xx Success" },
  { value: "4xx", label: "4xx Client Error" },
  { value: "5xx", label: "5xx Server Error" },
];
const METHOD_OPTS = [
  { value: "all",    label: "All Methods" },
  { value: "GET",    label: "GET" },
  { value: "POST",   label: "POST" },
  { value: "PUT",    label: "PUT" },
  { value: "DELETE", label: "DELETE" },
];
const REQUEST_OPTS = [
  { value: "all",   label: "All Requests" },
  { value: "creds", label: "With Credentials" },
];

// ─── Monitor page ─────────────────────────────────────────────────────────────

export default function Monitor() {
  const { autoRefresh } = useOutletContext();
  const [requests,    setRequests]    = useState([]);
  const [search,      setSearch]      = useState("");
  const [statusF,     setStatusF]     = useState("all");
  const [methodF,     setMethodF]     = useState("all");
  const [requestF,    setRequestF]    = useState("all");
  const [now,         setNow]         = useState(new Date());
  const [loading,     setLoading]     = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);
  const socketRef                     = useRef(null);
  const autoRefreshRef                = useRef(autoRefresh);

  // Keep autoRefreshRef in sync so the socket callback always sees the latest value
  useEffect(() => { autoRefreshRef.current = autoRefresh; }, [autoRefresh]);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Load initial logs + establish WebSocket connection ──────────────────────
  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch(`${InstagramEndpoints.backendBaseUrl}/api/logs`);
      const json = await res.json();
      const logs = (json?.data?.logs ?? []).map(l => ({
        ...l,
        timestamp: new Date(l.timestamp),
      }));
      setRequests(logs);
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();

    // Connect WebSocket
    const socket = io(InstagramEndpoints.socketUrl, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("newLog", (log) => {
      if (!autoRefreshRef.current) return;
      setRequests(prev =>
        [{ ...log, timestamp: new Date(log.timestamp) }, ...prev].slice(0, 500)
      );
    });

    socket.on("logDeleted", ({ id }) => {
      setRequests(prev => prev.filter(r => r.id !== id));
    });

    socket.on("logsCleared", () => {
      setRequests([]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [loadLogs]);

  // ── Delete a single request ────────────────────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    // Optimistic local removal
    setRequests(prev => prev.filter(r => r.id !== id));
    try {
      await fetch(`${InstagramEndpoints.backendBaseUrl}/api/logs/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Delete failed:", err);
      // Re-fetch on error to restore correct state
      loadLogs();
    }
  }, [loadLogs]);

  // ── Delete all requests ─────────────────────────────────────────────────────
  const handleClearAll = useCallback(async () => {
    setRequests([]);
    try {
      await fetch(`${InstagramEndpoints.backendBaseUrl}/api/logs`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Clear all failed:", err);
      loadLogs();
    }
  }, [loadLogs]);

  // ── Refresh (re-fetch from API) ──────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    loadLogs();
  }, [loadLogs]);

  // ── Confirm delete (single or all) ───────────────────────────────────────────
  const handleConfirm = () => {
    if (confirmAction?.type === "single") {
      handleDelete(confirmAction.id);
    } else if (confirmAction?.type === "all") {
      handleClearAll();
    }
    setConfirmAction(null);
  };

  // ── Filter ───────────────────────────────────────────────────────────────────
  const filtered = requests.filter(r => {
    const q = search.toLowerCase();
    const matchSearch  = !q || r.path.toLowerCase().includes(q) || (r.ip || "").includes(q) ||
      (r.user ?? "").toLowerCase().includes(q) || String(r.status).includes(q);
    const matchStatus  =
      statusF === "all" ||
      (statusF === "2xx" && r.status >= 200 && r.status < 300) ||
      (statusF === "4xx" && r.status >= 400 && r.status < 500) ||
      (statusF === "5xx" && r.status >= 500);
    const matchMethod  = methodF  === "all" || r.method  === methodF;
    const matchRequest = requestF === "all" || (requestF === "creds" && r.user);
    return matchSearch && matchStatus && matchMethod && matchRequest;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const total   = requests.length;
  const success = requests.filter(r => r.status < 400).length;
  const failed  = requests.filter(r => r.status >= 400).length;
  const avgMs   = total ? Math.round(requests.reduce((a, r) => a + (r.ms || 0), 0) / total) : 0;

  const chartData = Array.from({ length: 8 }, (_, i) => {
    const slice = requests.slice(i * 5, i * 5 + 5);
    return slice.length ? Math.round(slice.reduce((a, r) => a + (r.ms || 0), 0) / slice.length) : 0;
  }).reverse();

  const endpointCounts = requests.reduce((acc, r) => {
    acc[r.path] = (acc[r.path] ?? 0) + 1; return acc;
  }, {});
  const topEndpoints = Object.entries(endpointCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxEpCount   = topEndpoints[0]?.[1] ?? 1;

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "requests.json"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Main 80/20 split ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT — request log (80%) */}
        <div className="flex flex-col w-4/5 border-r border-[#131e35] overflow-hidden">

          {/* Controls */}
          <div className="shrink-0 border-b border-[#131e35] bg-[#080f1e] px-3 py-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button className="flex items-center gap-1.5 text-[11px] text-[#6ab0ff] border border-[#1e3260] rounded px-2.5 py-1 hover:border-[#2a4a7a] transition-colors cursor-pointer">
                <span className="text-[10px]">▶</span> REQUEST LOGS <span className="text-[#3a5a8a]">▾</span>
              </button>
              <Dropdown value={statusF}  onChange={setStatusF}  options={STATUS_OPTS}  />
              <Dropdown value={methodF}  onChange={setMethodF}  options={METHOD_OPTS}  />
              <Dropdown value={requestF} onChange={setRequestF} options={REQUEST_OPTS} />
              <div className="relative flex-1 min-w-[140px]">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3a5a8a]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search path, IP, user…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-7 pl-8 pr-3 text-[11px] rounded border border-[#1e3260] bg-[#0b1527] text-[#a0bce0] placeholder:text-[#2a4a7a] focus:outline-none focus:border-[#3d7aba] transition-colors"
                />
              </div>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1 h-7 px-2.5 text-[11px] rounded border border-[#1e3260] text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#a0bce0] transition-colors cursor-pointer"
              >
                <IcoRefresh /> Refresh
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 h-7 px-2.5 text-[11px] rounded border border-[#1e3260] text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#a0bce0] transition-colors cursor-pointer"
              >
                <IcoDownload /> Download
              </button>
              <button
                onClick={() => setConfirmAction({ type: "all" })}
                className="flex items-center gap-1 h-7 px-2.5 text-[11px] rounded border border-[#1e3260] text-[#6b8cba] hover:border-red-500/50 hover:text-red-400 transition-colors cursor-pointer"
              >
                <IcoClear /> Clear
              </button>
            </div>
            <div className="mt-1.5 text-[10px] text-[#3a5a8a]">
              Showing <span className="text-[#6ab0ff]">{filtered.length}</span> of{" "}
              <span className="text-[#6ab0ff]">{total}</span> requests
            </div>
          </div>

          {/* Request list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {loading
              ? <p className="text-center text-[#2a4a7a] text-sm py-16">LOADING…</p>
              : filtered.length === 0
                ? <p className="text-center text-[#2a4a7a] text-sm py-16">NO MATCHING REQUESTS</p>
                : filtered.map(req => <RequestCard key={req.id} req={req} onDelete={(id) => setConfirmAction({ type: "single", id })} />)
            }
          </div>
        </div>

        {/* RIGHT — stats (20%) */}
        <div className="w-1/5 flex flex-col overflow-y-auto px-3 py-3 gap-3">

          <div className="rounded border border-[#1e3260] bg-[#0b1527] p-3">
            <p className="text-[9px] uppercase tracking-widest text-[#3a5a8a] mb-1">Total Requests</p>
            <p className="text-3xl font-bold text-[#a0bce0]">{total}</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="rounded bg-[#0d2a0d] border border-[#1a5a1a] p-2 text-center">
                <p className="text-[9px] uppercase tracking-widest text-[#2ecc71]/60 mb-0.5">Success</p>
                <p className="text-xl font-bold text-[#2ecc71]">{success}</p>
              </div>
              <div className="rounded bg-[#2a0d0d] border border-[#5a1a1a] p-2 text-center">
                <p className="text-[9px] uppercase tracking-widest text-red-400/60 mb-0.5">Failed</p>
                <p className="text-xl font-bold text-red-400">{failed}</p>
              </div>
            </div>
          </div>

          <div className="rounded border border-[#1e3260] bg-[#0b1527] p-3">
            <p className="text-[9px] uppercase tracking-widest text-[#3a5a8a] mb-1">Average Response Time</p>
            <p className="text-3xl font-bold text-[#a0bce0]">
              {avgMs >= 1000 ? `${(avgMs / 1000).toFixed(1)}s` : `${avgMs}ms`}
            </p>
            <p className="text-[10px] text-[#3a5a8a] mt-0.5">Across all requests</p>
          </div>

          <div className="rounded border border-[#1e3260] bg-[#0b1527] p-3">
            <p className="text-[9px] uppercase tracking-widest text-[#3a5a8a] mb-2">Response Time Chart</p>
            <BarChart data={chartData} />
          </div>

          <div className="rounded border border-[#1e3260] bg-[#0b1527] p-3">
            <p className="text-[9px] uppercase tracking-widest text-[#3a5a8a] mb-2">Top Endpoints</p>
            <div className="space-y-2">
              {topEndpoints.map(([path, count]) => (
                <div key={path}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-[#6ab0ff] truncate flex-1 mr-2 font-mono">{path}</span>
                    <span className="text-[10px] text-[#a0bce0] font-bold shrink-0">{count}</span>
                  </div>
                  <div className="h-1 w-full bg-[#0f1e38] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#3d7aba]"
                      style={{ width: `${(count / maxEpCount) * 100}%` }} />
                  </div>
                </div>
              ))}
              {topEndpoints.length === 0 && (
                <p className="text-[10px] text-[#3a5a8a]">No data yet</p>
              )}
            </div>
          </div>

          <div className="rounded border border-[#1e3260] bg-[#0b1527] p-3 text-center mt-auto">
            <p className="text-[9px] uppercase tracking-widest text-[#3a5a8a] mb-0.5">System Time</p>
            <p className="text-[15px] font-bold text-[#e8c97a] tracking-widest">{fmtClock(now)}</p>
          </div>

        </div>
      </div>

      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.type === "all" ? "Clear all logs?" : "Delete this request?"}
          message={confirmAction.type === "all"
            ? "All request logs will be permanently removed. This cannot be undone."
            : "This request log will be permanently removed. This cannot be undone."}
          onConfirm={handleConfirm}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
