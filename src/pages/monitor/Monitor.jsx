import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { io } from "socket.io-client";
import { FiRefreshCw, FiDownload, FiTrash2, FiSearch } from "react-icons/fi";
import InstagramEndpoints from "../../services/api-endpoints";
import Dropdown from "../../components/common/Dropdown";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import RequestCard from "../../components/monitor/RequestCard";
import StatsSidebar from "../../components/monitor/StatsSidebar";

// ─── Filter options ───────────────────────────────────────────────────────────
const STATUS_OPTS = [
  { value: "all", label: "All Status" },
  { value: "2xx", label: "2xx Success" },
  { value: "4xx", label: "4xx Client Error" },
  { value: "5xx", label: "5xx Server Error" },
];
const METHOD_OPTS = [
  { value: "all", label: "All Methods" },
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "DELETE", label: "DELETE" },
];
const REQUEST_OPTS = [
  { value: "all", label: "All Requests" },
  { value: "creds", label: "With Credentials" },
];

export default function Monitor() {
  const { autoRefresh } = useOutletContext();
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [methodF, setMethodF] = useState("all");
  const [requestF, setRequestF] = useState("all");
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);
  const [serverStartTime, setServerStartTime] = useState(null);
  const socketRef = useRef(null);
  const autoRefreshRef = useRef(autoRefresh);

  // Keep autoRefreshRef in sync so the socket callback always sees the latest value
  useEffect(() => {
    autoRefreshRef.current = autoRefresh;
  }, [autoRefresh]);

  // System Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Load initial logs + establish WebSocket connection ──────────────────────
  const loadLogs = useCallback(async () => {
    try {
      // Fetch logs and server start time in parallel
      const [logsRes, metaRes] = await Promise.all([
        fetch(`${InstagramEndpoints.backendBaseUrl}/api/logs`),
        fetch(`${InstagramEndpoints.backendBaseUrl}/api/logs/meta`),
      ]);
      const logsJson = await logsRes.json();
      const metaJson = await metaRes.json();

      const logs = (logsJson?.data?.logs ?? []).map((l) => ({
        ...l,
        timestamp: new Date(l.timestamp),
      }));
      setRequests(logs);

      if (metaJson?.data?.serverStartTime) {
        setServerStartTime(new Date(metaJson.data.serverStartTime));
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();

    // Connect WebSocket
    const socket = io(InstagramEndpoints.backendBaseUrl, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("newLog", (log) => {
      if (!autoRefreshRef.current) return;
      setRequests((prev) =>
        [{ ...log, timestamp: new Date(log.timestamp) }, ...prev].slice(0, 500)
      );
    });

    socket.on("logDeleted", ({ id }) => {
      setRequests((prev) => prev.filter((r) => r.id !== id));
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
  const handleDelete = useCallback(
    async (id) => {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      try {
        await fetch(`${InstagramEndpoints.backendBaseUrl}/api/logs/${id}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Delete failed:", err);
        loadLogs();
      }
    },
    [loadLogs]
  );

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
  const filtered = requests.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.path.toLowerCase().includes(q) ||
      (r.ip || "").includes(q) ||
      (r.user ?? "").toLowerCase().includes(q) ||
      String(r.status).includes(q);
    const matchStatus =
      statusF === "all" ||
      (statusF === "2xx" && r.status >= 200 && r.status < 300) ||
      (statusF === "4xx" && r.status >= 400 && r.status < 500) ||
      (statusF === "5xx" && r.status >= 500);
    const matchMethod = methodF === "all" || r.method === methodF;
    const matchRequest = requestF === "all" || (requestF === "creds" && r.user);
    return matchSearch && matchStatus && matchMethod && matchRequest;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const total = requests.length;
  const success = requests.filter((r) => r.status < 400).length;
  const failed = requests.filter((r) => r.status >= 400).length;
  const avgMs = total
    ? Math.round(requests.reduce((a, r) => a + (r.ms || 0), 0) / total)
    : 0;

  const chartData = Array.from({ length: 8 }, (_, i) => {
    const slice = requests.slice(i * 5, i * 5 + 5);
    return slice.length
      ? Math.round(slice.reduce((a, r) => a + (r.ms || 0), 0) / slice.length)
      : 0;
  }).reverse();

  const endpointCounts = requests.reduce((acc, r) => {
    acc[r.path] = (acc[r.path] ?? 0) + 1;
    return acc;
  }, {});
  const topEndpoints = Object.entries(endpointCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxEpCount = topEndpoints[0]?.[1] ?? 1;

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "requests.json";
    a.click();
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
              <button
                type="button"
                className="flex items-center gap-1.5 text-[11px] text-[#6ab0ff] border border-[#1e3260] rounded px-2.5 py-1 hover:border-[#2a4a7a] transition-colors cursor-pointer"
              >
                <span className="text-[10px]">▶</span> REQUEST LOGS{" "}
                <span className="text-[#3a5a8a]">▾</span>
              </button>
              <Dropdown value={statusF} onChange={setStatusF} options={STATUS_OPTS} />
              <Dropdown value={methodF} onChange={setMethodF} options={METHOD_OPTS} />
              <Dropdown value={requestF} onChange={setRequestF} options={REQUEST_OPTS} />
              <div className="relative flex-1 min-w-[140px]">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3a5a8a]">
                  <FiSearch className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Search path, IP, user…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-7 pl-8 pr-3 text-[11px] rounded border border-[#1e3260] bg-[#0b1527] text-[#a0bce0] placeholder:text-[#2a4a7a] focus:outline-none focus:border-[#3d7aba] transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="flex items-center gap-1 h-7 px-2.5 text-[11px] rounded border border-[#1e3260] text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#a0bce0] transition-colors cursor-pointer"
              >
                <FiRefreshCw size={12} /> Refresh
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1 h-7 px-2.5 text-[11px] rounded border border-[#1e3260] text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#a0bce0] transition-colors cursor-pointer"
              >
                <FiDownload size={12} /> Download
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction({ type: "all" })}
                className="flex items-center gap-1 h-7 px-2.5 text-[11px] rounded border border-[#1e3260] text-[#6b8cba] hover:border-red-500/50 hover:text-red-400 transition-colors cursor-pointer"
              >
                <FiTrash2 size={12} /> Clear
              </button>
            </div>
            <div className="mt-1.5 text-[10px] text-[#3a5a8a]">
              Showing <span className="text-[#6ab0ff]">{filtered.length}</span> of{" "}
              <span className="text-[#6ab0ff]">{total}</span> requests
            </div>
          </div>

          {/* Request list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {loading ? (
              <p className="text-center text-[#2a4a7a] text-sm py-16">LOADING…</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-[#2a4a7a] text-sm py-16">NO MATCHING REQUESTS</p>
            ) : (
              filtered.map((req) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  onDelete={(id) => setConfirmAction({ type: "single", id })}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT — stats (20%) */}
        <StatsSidebar
          total={total}
          success={success}
          failed={failed}
          avgMs={avgMs}
          chartData={chartData}
          topEndpoints={topEndpoints}
          maxEpCount={maxEpCount}
          now={now}
          serverStartTime={serverStartTime}
        />
      </div>

      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.type === "all" ? "Clear all logs?" : "Delete this request?"}
          message={
            confirmAction.type === "all"
              ? "All request logs will be permanently removed. This cannot be undone."
              : "This request log will be permanently removed. This cannot be undone."
          }
          onConfirm={handleConfirm}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
