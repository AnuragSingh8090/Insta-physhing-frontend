import BarChart from "./BarChart";

const fmtClock  = (d) => d.toLocaleTimeString("en-US", { hour12: false });
const fmtUptime = (start, now) => {
  const secs = Math.floor((now - start) / 1000);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default function StatsSidebar({
  total,
  success,
  failed,
  avgMs,
  chartData,
  topEndpoints,
  maxEpCount,
  now,
  serverStartTime,
}) {
  return (
    <div className="w-1/5 flex flex-col overflow-y-auto px-3 py-3 gap-3">
      {/* Total Requests Card */}
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

      {/* Average Response Time Card */}
      <div className="rounded border border-[#1e3260] bg-[#0b1527] p-3">
        <p className="text-[9px] uppercase tracking-widest text-[#3a5a8a] mb-1">Average Response Time</p>
        <p className="text-3xl font-bold text-[#a0bce0]">
          {avgMs >= 1000 ? `${(avgMs / 1000).toFixed(1)}s` : `${avgMs}ms`}
        </p>
        <p className="text-[10px] text-[#3a5a8a] mt-0.5">Across all requests</p>
      </div>

      {/* Response Time Chart Card */}
      <div className="rounded border border-[#1e3260] bg-[#0b1527] p-3">
        <p className="text-[9px] uppercase tracking-widest text-[#3a5a8a] mb-2">Response Time Chart</p>
        <BarChart data={chartData} />
      </div>

      {/* Top Endpoints Card */}
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
                <div
                  className="h-full rounded-full bg-[#3d7aba]"
                  style={{ width: `${(count / maxEpCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {topEndpoints.length === 0 && (
            <p className="text-[10px] text-[#3a5a8a]">No data yet</p>
          )}
        </div>
      </div>

      {/* Server Started Card */}
      {serverStartTime && (
        <div className="rounded border border-[#2a3a1a] bg-[#0d1a0a] p-3">
          <p className="text-[9px] uppercase tracking-widest text-[#4a7a3a] mb-1">Server Started</p>
          <p className="text-[12px] font-bold text-[#7ec850] font-mono">
            {fmtClock(serverStartTime)}
          </p>
          <p className="text-[9px] text-[#4a7a3a] mt-0.5">
            {serverStartTime.toLocaleDateString("en-IN")}
          </p>
          <div className="mt-2 pt-2 border-t border-[#2a3a1a]">
            <p className="text-[9px] uppercase tracking-widest text-[#4a7a3a] mb-0.5">Uptime</p>
            <p className="text-[13px] font-bold text-[#7ec850] font-mono tracking-wider">
              {fmtUptime(serverStartTime, now)}
            </p>
          </div>
        </div>
      )}

      {/* System Time Card */}
      <div className="rounded border border-[#1e3260] bg-[#0b1527] p-3 text-center mt-auto">
        <p className="text-[9px] uppercase tracking-widest text-[#3a5a8a] mb-0.5">System Time</p>
        <p className="text-[15px] font-bold text-[#e8c97a] tracking-widest">{fmtClock(now)}</p>
      </div>
    </div>
  );
}
