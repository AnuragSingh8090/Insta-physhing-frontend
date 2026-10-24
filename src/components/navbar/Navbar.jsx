import { NavLink } from "react-router-dom";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IcoMonitor = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
    strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const IcoDatabase = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
    strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const IcoWifi = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
    strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IcoStop = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
    strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

// ─── Uptime formatter ─────────────────────────────────────────────────────────
const fmtUptime = (secs) => {
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${d}d ${h}h ${m}m ${s}s`;
};

export default function Navbar({ uptime = 0, autoRefresh = true, onToggleAutoRefresh }) {
  return (
    <header className="shrink-0 border-b border-[#131e35] bg-[#060d1c]/95 backdrop-blur px-4 flex items-center gap-4">
      {/* Brand */}
      <div className="flex items-center gap-2.5 py-2.5 shrink-0">
        <div className="w-7 h-7 rounded-full border-2 border-[#3d7aba] bg-[#0b1527] flex items-center justify-center shrink-0">
          <IcoWifi />
        </div>
        <span className="text-[14px] font-bold tracking-widest text-[#a0bce0] uppercase whitespace-nowrap">
          Server Monitor <span className="text-[#3d7aba]">v2.0</span>
        </span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-[#131e35] shrink-0" />

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        <NavLink
          to="/dashboard/monitor"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2.5 text-[12px] font-semibold tracking-widest uppercase border-b-2 transition-all cursor-pointer ${
              isActive
                ? "border-[#3d7aba] text-[#6ab0ff]"
                : "border-transparent text-[#3a5a8a] hover:text-[#6b8cba] hover:border-[#1e3260]"
            }`
          }
        >
          <IcoMonitor />
          Monitor
        </NavLink>

        <NavLink
          to="/dashboard/database"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2.5 text-[12px] font-semibold tracking-widest uppercase border-b-2 transition-all cursor-pointer ${
              isActive
                ? "border-[#3d7aba] text-[#6ab0ff]"
                : "border-transparent text-[#3a5a8a] hover:text-[#6b8cba] hover:border-[#1e3260]"
            }`
          }
        >
          <IcoDatabase />
          Database
        </NavLink>
      </nav>

      {/* Right side: status + uptime + stop */}
      <div className="ml-auto flex items-center gap-4">
        {/* Status */}
        <div className="flex flex-col leading-none">
          <span className="text-[9px] uppercase tracking-widest text-[#3a5a8a]">Status</span>
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-[#2ecc71] mt-0.5">
            <span className="w-2 h-2 rounded-full bg-[#2ecc71] animate-pulse shrink-0" />
            ONLINE
          </span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-[#131e35]" />

        {/* Server URL */}
        <div className="flex flex-col leading-none hidden lg:flex">
          <span className="text-[9px] uppercase tracking-widest text-[#3a5a8a]">Server URL</span>
          <span className="text-[11px] text-[#6ab0ff] mt-0.5">inst-phishing-backend.onrender.com</span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-[#131e35] hidden lg:block" />

        {/* Uptime */}
        <div className="flex flex-col leading-none">
          <span className="text-[9px] uppercase tracking-widest text-[#3a5a8a]">Uptime</span>
          <span className="text-[12px] font-bold text-[#e8c97a] mt-0.5">{fmtUptime(uptime)}</span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-[#131e35]" />

        {/* Force stop / resume */}
        <button
          type="button"
          onClick={onToggleAutoRefresh}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded border transition-all cursor-pointer ${
            autoRefresh
              ? "border-red-500/60 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : "border-[#2ecc71]/50 bg-[#2ecc71]/10 text-[#2ecc71] hover:bg-[#2ecc71]/20"
          }`}
        >
          <IcoStop />
          {autoRefresh ? "FORCE STOP SERVER" : "▶ RESUME LIVE"}
        </button>
      </div>
    </header>
  );
}
