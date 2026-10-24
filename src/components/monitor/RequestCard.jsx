import { useState } from "react";
import { FiTrash2, FiServer, FiChevronDown } from "react-icons/fi";
import CopyButton from "../common/CopyButton";
import { JsonBlock, HeadersBlock } from "./JsonBlock";

const METHOD_COLOR = {
  GET: "bg-[#2ecc71] text-[#0a0f1a]",
  POST: "bg-[#3498db] text-[#0a0f1a]",
  PUT: "bg-[#f39c12] text-[#0a0f1a]",
  DELETE: "bg-[#e74c3c] text-white",
  PATCH: "bg-[#9b59b6] text-white",
};

const statusMeta = (s) => {
  if (s >= 500) return { dot: "bg-red-500", badge: "bg-red-500/15 text-red-400 border-red-500/30" };
  if (s >= 400) return { dot: "bg-red-400", badge: "bg-red-500/15 text-red-400 border-red-500/30" };
  if (s >= 300) return { dot: "bg-yellow-400", badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" };
  return { dot: "bg-[#2ecc71]", badge: "bg-[#2ecc71]/10 text-[#2ecc71] border-[#2ecc71]/30" };
};

const respColor = (ms) => (ms > 300 ? "text-red-400" : ms > 150 ? "text-yellow-400" : "text-[#2ecc71]");

const fmtTs = (d) =>
  d
    .toLocaleString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(",", "") + " IST";

const CardSection = ({ icon, title, copyText, children }) => (
  <div className="mt-3">
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-[#3d7aba]">
        <span>{icon}</span>
        {title}
      </div>
      {copyText && <CopyButton text={copyText} />}
    </div>
    <div className="rounded border border-[#1a2d50] bg-[#070d1a] px-3 py-2.5">{children}</div>
  </div>
);

export default function RequestCard({ req, onDelete }) {
  const [open, setOpen] = useState(false);
  const sm = statusMeta(req.status);

  return (
    <div className={`rounded border ${open ? "border-[#1e3260]" : "border-[#131e35]"} bg-[#0b1527] overflow-hidden`}>
      {/* Summary row */}
      <div className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#0f1e38] transition-colors">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
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

          <FiChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 text-[#3a5a8a] ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Per-request delete button */}
        <button
          type="button"
          onClick={() => onDelete(req.id)}
          title="Delete this request"
          aria-label="Delete this request"
          className="shrink-0 p-1 rounded text-[#3a5a8a] hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
        >
          <FiTrash2 size={13} />
        </button>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="px-3 pb-3 border-t border-[#131e35]">
          <CardSection icon={<FiServer className="w-3.5 h-3.5" />} title="Request Info">
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
              null,
              2
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
}
