import { useState, useMemo, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import InstagramEndpoints from "../../services/api-endpoints";
import { Icons } from "../../components/controlpanel/Icons";
import FilterDropdown from "../../components/controlpanel/FilterDropdown";
import CheckboxCP from "../../components/controlpanel/CheckboxCP";
import Avatar from "../../components/controlpanel/Avatar";
import Button from "../../components/controlpanel/Button";
import Logs from "../../components/controlpanel/Logs";
import RecordModal from "../../components/controlpanel/RecordModal";
import ConfirmCancelModal from "../../components/controlpanel/ConfirmCancelModal";
import BulkSentModal from "../../components/controlpanel/BulkSentModal";
import SentModal from "../../components/controlpanel/SentModal";
import { fmt, SEND_TYPES } from "../../components/controlpanel/constants";

// Send dropdown menu with schedule
const useClickOutside = (ref, cb) => {
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && cb();
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb]);
};

// Custom DateTimePicker
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
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d7aba] ${
          disabled ? "cursor-not-allowed border-[#131e35] bg-[#0a1525] text-[#6b8cba]" : "border-[#1e3260] bg-[#060d1c] text-[#a0bce0] hover:border-[#3d7aba]"
        }`}
      >
        <span className="flex items-center gap-2"><Icons.Clock className="w-4 h-4" /> {label}</span>
        <Icons.Chevron className={`w-4 h-4 transition-transform ${open && !disabled ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && (
        <div className="mt-2 rounded-lg border border-[#1e3260] bg-[#0a1525] p-3">
          <div className="mb-2 flex items-center justify-between">
            <button onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} aria-label="Previous month" className="rounded p-1 text-[#6b8cba] hover:bg-[#131e35]">
              <Icons.Chevron className="w-4 h-4 rotate-90" />
            </button>
            <span className="text-sm font-medium text-[#a0bce0]">{MONTHS[view.getMonth()]} {view.getFullYear()}</span>
            <button onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} aria-label="Next month" className="rounded p-1 text-[#6b8cba] hover:bg-[#131e35]">
              <Icons.Chevron className="w-4 h-4 -rotate-90" />
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
                  className={`h-8 rounded-md text-sm ${
                    active ? "bg-[#3d7aba] text-white font-medium" : past ? "text-[#1e3260] cursor-not-allowed" : "text-[#a0bce0] hover:bg-[#131e35]"
                  } ${!active && d.getTime() === today.getTime() ? "ring-1 ring-[#3d7aba]" : ""}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-[#131e35] pt-3">
            <Icons.Clock className="w-4 h-4 text-[#6b8cba]" />
            <select className="rounded-md border border-[#1e3260] bg-[#060d1c] text-[#a0bce0] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d7aba]" value={hour} onChange={(e) => commit(sel || today, +e.target.value)} aria-label="Hour">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => <option key={h} value={h}>{pad(h)}</option>)}
            </select>
            <span className="text-[#6b8cba]">:</span>
            <select className="rounded-md border border-[#1e3260] bg-[#060d1c] text-[#a0bce0] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d7aba]" value={minute} onChange={(e) => commit(sel || today, hour, +e.target.value)} aria-label="Minute">
              {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => <option key={m} value={m}>{pad(m)}</option>)}
            </select>
            <select className="rounded-md border border-[#1e3260] bg-[#060d1c] text-[#a0bce0] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d7aba]" value={pm ? "PM" : "AM"} onChange={(e) => commit(sel || today, hour, minute, e.target.value === "PM")} aria-label="AM or PM">
              <option>AM</option><option>PM</option>
            </select>
            <button onClick={() => setOpen(false)} className="ml-auto rounded-md bg-[#3d7aba] px-3 py-1 text-sm font-medium text-white hover:bg-[#2d6aa0]">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Send Menu dropdown
function SendMenu({ notify: n, onChange }) {
  const name = useRef(`send-${Math.random()}`).current;
  const [err, setErr] = useState("");
  const pending = !!n.pendingId && !!n.scheduledAt && new Date(n.scheduledAt).getTime() > Date.now();

  const changeTime = (v) => {
    if (new Date(v).getTime() <= Date.now()) return setErr("Pick a time in the future.");
    setErr("");
    onChange({ ...n, scheduledAt: v });
  };

  return (
    <div className="absolute right-0 top-full mt-1.5 w-80 rounded-xl border border-[#1e3260] bg-[#0a1525] p-3 shadow-xl z-30">
      <p className="text-xs font-medium text-[#6b8cba] mb-2">Send notification for</p>
      {SEND_TYPES.map((t) => (
        <label
          key={t}
          className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm ${pending ? "cursor-not-allowed text-[#6b8cba]" : "cursor-pointer text-[#a0bce0] hover:bg-[#131e35]"}`}
        >
          <input
            type="radio"
            name={name}
            checked={n.type === t}
            disabled={pending}
            onChange={() => onChange({ ...n, type: t })}
            className="h-4 w-4 shrink-0 accent-[#3d7aba] disabled:cursor-not-allowed disabled:opacity-50"
          />
          {t}
        </label>
      ))}
      <div className="mt-2 rounded-lg border border-[#131e35] bg-[#060d1c]/60 py-1">
        {pending ? (
          <p className="px-4 py-1.5 text-sm font-medium text-amber-400">Scheduled for</p>
        ) : (
          <label className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium cursor-pointer text-[#a0bce0]">
            <CheckboxCP checked={n.schedule} onChange={(v) => onChange({ ...n, schedule: v, scheduledAt: v ? n.scheduledAt : "" })} />
            Schedule
          </label>
        )}
        {(pending || n.schedule) && <DateTimePicker value={n.scheduledAt} onChange={changeTime} disabled={pending} />}
        {err && <p className="px-4 pb-1 text-xs text-red-400">{err}</p>}
        {!err && pending && <p className="px-4 pb-1 text-xs text-[#6b8cba]">Change the date or time to reschedule.</p>}
        {!err && !pending && n.schedule && !n.scheduledAt && <p className="px-4 pb-1 text-xs text-[#6b8cba]">Pick a date and time to enable Send.</p>}
      </div>
    </div>
  );
}

export default function ControlPanel() {
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // { mode: 'simple'|'advance', record: null|record }
  const [bulkResult, setBulkResult] = useState(null);

  // Load records from API
  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filter === "all" 
        ? `${InstagramEndpoints.backendBaseUrl}/api/notification-records`
        : `${InstagramEndpoints.backendBaseUrl}/api/notification-records?type=${filter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === "SUCCESS") {
        setRecords(data.data.records || []);
      } else {
        setError(data.message || "Failed to load records");
      }
    } catch (err) {
      console.error("Error loading records:", err);
      setError("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  // Load records on mount and filter change
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
        return [record, ...prev];
      });
    });

    socket.on("notificationRecordUpdated", (record) => {
      setRecords((prev) => prev.map((r) => (r.id === record.id ? record : r)));
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

    socket.on("notificationRecordsCleared", () => {
      setRecords([]);
      setSelected([]);
    });

    return () => socket.disconnect();
  }, []);

  // Filter records
  const visible = useMemo(
    () => records.filter((r) => filter === "all" || r.type === filter),
    [records, filter]
  );

  // Selection logic
  const selectedVisible = visible.filter((r) => selected.includes(r.id));
  const allChecked = visible.length > 0 && selectedVisible.length === visible.length;
  const someChecked = selectedVisible.length > 0 && !allChecked;

  const toggleAll = () => {
    if (allChecked) {
      setSelected(selected.filter((id) => !visible.some((r) => r.id === id)));
    } else {
      setSelected([...new Set([...selected, ...visible.map((r) => r.id)])]);
    }
  };

  const toggleOne = (id) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  // Delete operations
  const deleteOne = async (id) => {
    if (!confirm("Delete this record?")) return;
    
    setDeletingIds((d) => [...d, id]);
    try {
      const response = await fetch(`${InstagramEndpoints.backendBaseUrl}/api/notification-records/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      
      if (data.status !== "SUCCESS") {
        alert(data.message || "Failed to delete record");
      }
    } catch (err) {
      console.error("Error deleting record:", err);
      alert("Failed to delete record");
    } finally {
      setDeletingIds((d) => d.filter((x) => x !== id));
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedVisible.length} selected record(s)?`)) return;
    
    setBulkDeleting(true);
    try {
      const ids = selectedVisible.map((r) => r.id);
      const response = await fetch(`${InstagramEndpoints.backendBaseUrl}/api/notification-records/bulk/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await response.json();
      
      if (data.status !== "SUCCESS") {
        alert(data.message || "Failed to delete records");
      }
    } catch (err) {
      console.error("Error deleting records:", err);
      alert("Failed to delete records");
    } finally {
      setBulkDeleting(false);
    }
  };

  // Save records (create or update)
  const handleSaveRecords = async (entries) => {
    try {
      if (modal.record) {
        // Update existing record
        const entry = entries[0];
        const response = await fetch(
          `${InstagramEndpoints.backendBaseUrl}/api/notification-records/${modal.record.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: modal.mode,
              username: entry.username,
              email: entry.email,
              avatar: entry.avatar,
              deviceName: entry.deviceName,
              address: entry.address,
            }),
          }
        );
        const data = await response.json();
        if (data.status !== "SUCCESS") {
          alert(data.message || "Failed to update record");
        }
      } else {
        // Create new records
        const recordsToCreate = entries.map((e) => ({
          type: modal.mode,
          username: e.username,
          email: e.email,
          avatar: e.avatar,
          deviceName: e.deviceName,
          address: e.address,
        }));

        if (recordsToCreate.length === 1) {
          const response = await fetch(
            `${InstagramEndpoints.backendBaseUrl}/api/notification-records`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(recordsToCreate[0]),
            }
          );
          const data = await response.json();
          if (data.status !== "SUCCESS") {
            alert(data.message || "Failed to create record");
          }
        } else {
          const response = await fetch(
            `${InstagramEndpoints.backendBaseUrl}/api/notification-records/bulk`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ records: recordsToCreate }),
            }
          );
          const data = await response.json();
          if (data.status !== "SUCCESS") {
            alert(data.message || "Failed to create records");
          }
        }
      }
    } catch (err) {
      console.error("Error saving records:", err);
      alert("Failed to save records");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-[#131e35] bg-[#060d1c]/95 backdrop-blur px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-[#a0bce0] tracking-wider uppercase">Control Panel</h1>
            <p className="text-xs text-[#6b8cba] mt-0.5">Manage notification records and send alerts</p>
          </div>

          <div className="flex items-center gap-3">
            <FilterDropdown value={filter} onChange={setFilter} />

            <Button
              onClick={loadRecords}
              disabled={loading}
              className="border border-[#1e3260] bg-[#0b1527] text-[#6ab0ff] hover:bg-[#0f1e38]"
            >
              <Icons.Refresh /> Refresh
            </Button>

            {selectedVisible.length > 0 && (
              <>
                <Button
                  onClick={bulkDelete}
                  loading={bulkDeleting}
                  className="border border-red-500/60 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                >
                  <Icons.Trash /> Delete ({selectedVisible.length})
                </Button>

                <Button
                  onClick={async () => {
                    setBulkSending(true);
                    
                    // Simulate sending all
                    const targets = selectedVisible.filter(r => {
                      const n = r.notify || { schedule: false, scheduledAt: "" };
                      const pending = !!n.pendingId && !!n.scheduledAt && new Date(n.scheduledAt).getTime() > Date.now();
                      const cantSend = n.schedule && (!n.scheduledAt || new Date(n.scheduledAt).getTime() <= Date.now());
                      return !pending && !cantSend;
                    });
                    
                    const skipped = selectedVisible.length - targets.length;
                    
                    if (targets.length > 0) {
                      // Send notifications for all targets
                      const scheduled = targets.filter(r => r.notify?.schedule).length;
                      setBulkResult({ 
                        sent: targets.length - scheduled, 
                        scheduled, 
                        skipped 
                      });
                    } else {
                      setBulkResult({ sent: 0, scheduled: 0, skipped });
                    }
                    
                    setBulkSending(false);
                  }}
                  loading={bulkSending}
                  className="border border-[#3d7aba] bg-[#3d7aba]/10 text-[#6ab0ff] hover:bg-[#3d7aba]/20"
                >
                  <Icons.Send /> Send All
                </Button>
              </>
            )}

            <Button
              onClick={() => setModal({ mode: "simple", record: null })}
              className="border border-[#3d7aba] bg-[#3d7aba]/10 text-[#6ab0ff] hover:bg-[#3d7aba]/20"
            >
              <Icons.Plus /> Add Simple
            </Button>

            <Button
              onClick={() => setModal({ mode: "advance", record: null })}
              className="border border-[#e8c97a]/60 bg-[#e8c97a]/10 text-[#e8c97a] hover:bg-[#e8c97a]/20"
            >
              <Icons.Crown className="w-4 h-4" /> Add Advance
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="rounded-xl border border-[#131e35] bg-[#0b1527]/50 backdrop-blur overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center gap-4 px-4 py-3 border-b border-[#131e35] bg-[#060d1c]/50">
            <CheckboxCP
              checked={allChecked}
              indeterminate={someChecked}
              onChange={toggleAll}
              disabled={visible.length === 0 || loading}
            />
            <div className="flex-1 text-xs font-bold uppercase tracking-widest text-[#3a5a8a]">
              {loading ? "Loading..." : `${visible.length} record${visible.length !== 1 ? "s" : ""}`}
              {selectedVisible.length > 0 && ` · ${selectedVisible.length} selected`}
            </div>
          </div>

          {/* Table Body */}
          {loading ? (
            <div className="text-center py-12">
              <Icons.Spinner className="w-8 h-8 mx-auto mb-3 text-[#3d7aba]" />
              <p className="text-sm text-[#6b8cba]">Loading records...</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-12">
              <Icons.Filter className="w-12 h-12 mx-auto mb-3 text-[#1e3260]" />
              <p className="text-sm text-[#6b8cba]">No records found. Try changing the filter.</p>
            </div>
          ) : (
            <div>
              {visible.map((record) => (
                <RecordRow
                  key={record.id}
                  record={record}
                  selected={selected.includes(record.id)}
                  onToggle={() => toggleOne(record.id)}
                  onDelete={() => deleteOne(record.id)}
                  deleting={deletingIds.includes(record.id)}
                  onEdit={() => setModal({ mode: record.type, record })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <RecordModal
          mode={modal.mode}
          record={modal.record}
          onClose={() => setModal(null)}
          onSave={handleSaveRecords}
        />
      )}

      {/* Bulk Sent Result Modal */}
      {bulkResult && (
        <BulkSentModal
          info={bulkResult}
          onClose={() => setBulkResult(null)}
        />
      )}
    </div>
  );
}

// Record Row Component with Send functionality
function RecordRow({ record, selected, onToggle, onDelete, deleting, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentModal, setSentModal] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const sendBox = useRef(null);
  useClickOutside(sendBox, () => setMenu(false));
  
  const premium = record.type === "advance";
  const latestLog = record.logs.length > 0 ? record.logs[0] : null;
  const dateInfo = latestLog ? fmt(latestLog.sentAt) : null;

  // Initialize notify state if not present
  const [notify, setNotify] = useState(
    record.notify || { type: SEND_TYPES[0], schedule: false, scheduledAt: "", pendingId: null }
  );

  const pending = !!notify.pendingId && !!notify.scheduledAt && new Date(notify.scheduledAt).getTime() > Date.now();
  const cantSend = notify.schedule && (!notify.scheduledAt || new Date(notify.scheduledAt).getTime() <= Date.now());

  const handleSend = async () => {
    const info = { type: notify.type, email: record.email, scheduled: notify.schedule ? notify.scheduledAt : null };
    setSending(true);
    
    try {
      const response = await fetch(
        `${InstagramEndpoints.backendBaseUrl}/api/notification-records/${record.id}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notify }),
        }
      );
      const data = await response.json();
      
      if (data.status === "SUCCESS") {
        setSentModal(info);
        setMenu(false);
      } else {
        alert(data.message || "Failed to send notification");
      }
    } catch (err) {
      console.error("Error sending notification:", err);
      alert("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async () => {
    try {
      const response = await fetch(
        `${InstagramEndpoints.backendBaseUrl}/api/notification-records/${record.id}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cancel: true }),
        }
      );
      const data = await response.json();
      
      if (data.status === "SUCCESS") {
        setNotify({ ...notify, schedule: false, scheduledAt: "", pendingId: null });
      } else {
        alert(data.message || "Failed to cancel schedule");
      }
    } catch (err) {
      console.error("Error cancelling schedule:", err);
      alert("Failed to cancel schedule");
    }
  };

  return (
    <>
      <div className="border-b border-[#131e35] last:border-0">
        <div
          className={`flex items-center gap-4 px-4 py-3 ${
            premium ? "bg-gradient-to-r from-[#e8c97a]/5 to-transparent" : "hover:bg-[#0f1e38]/50"
          }`}
        >
          <CheckboxCP checked={selected} onChange={onToggle} disabled={deleting} />

          <div className="flex-1 flex flex-wrap items-center gap-4">
            {/* User Info */}
            <div className="flex items-center gap-3 min-w-[200px] flex-1">
              <Avatar src={premium ? record.avatar : ""} premium={premium} size="w-10 h-10" />
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate flex items-center gap-2 ${record.username ? "text-[#a0bce0]" : "text-[#3a5a8a]"}`}>
                  <Icons.User className="w-3.5 h-3.5 shrink-0" />
                  {record.username || "-"}
                </p>
                <p className="text-xs text-[#6b8cba] truncate flex items-center gap-2">
                  <Icons.Mail className="w-3.5 h-3.5 shrink-0" />
                  {record.email}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={onEdit}
                disabled={deleting}
                className="border border-[#1e3260] bg-[#0b1527] text-[#6ab0ff] hover:bg-[#0f1e38] !px-2.5 !py-1.5 text-xs"
              >
                <Icons.Edit className="w-3.5 h-3.5" />
                <span className="ml-1">Edit</span>
              </Button>

              <Button
                onClick={onDelete}
                loading={deleting}
                className="border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 !px-2.5 !py-1.5 text-xs"
              >
                {!deleting && <Icons.Trash className="w-3.5 h-3.5" />}
                {!deleting && <span className="ml-1">Delete</span>}
              </Button>

              {/* Send button with dropdown */}
              <div ref={sendBox} className="relative inline-flex items-stretch overflow-visible rounded-lg">
                {pending ? (
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    title={`Scheduled for ${fmt(notify.scheduledAt).date}, ${fmt(notify.scheduledAt).time}`}
                    className="inline-flex items-center gap-1.5 rounded-l-lg border border-r-0 border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    <Icons.Close /> Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || cantSend}
                    title={cantSend ? "Pick a future date and time for the schedule" : "Send notification"}
                    className="inline-flex items-center gap-1.5 rounded-l-lg bg-[#3d7aba] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2d6aa0] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3d7aba]"
                  >
                    {sending ? <Icons.Spinner /> : <Icons.Send />} {sending ? "Sending" : "Send"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMenu(!menu)}
                  disabled={sending}
                  aria-label="Send options"
                  title="Send options"
                  className={`inline-flex items-center rounded-r-lg border px-1.5 text-[#6b8cba] hover:bg-[#0f1e38] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3d7aba] disabled:opacity-60 ${
                    pending ? "border-red-500/40 bg-red-500/10" : "border-[#1e3260] bg-[#0b1527]"
                  }`}
                >
                  <Icons.Chevron className={`w-4 h-4 transition-transform ${menu ? "rotate-180" : ""}`} />
                </button>
                {menu && <SendMenu notify={notify} onChange={setNotify} />}
              </div>

              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 rounded hover:bg-[#0f1e38] text-[#3a5a8a] hover:text-[#6ab0ff] transition-colors cursor-pointer"
                aria-label="Toggle logs"
                title="View logs"
              >
                <Icons.Chevron className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Logs */}
        {expanded && (
          <div className="bg-[#060d1c]/30 px-4 py-3 sm:pl-[72px] border-t border-[#131e35]/50">
            <p className="text-xs font-medium text-[#3a5a8a] mb-2 uppercase tracking-wider">
              Sent Notifications ({record.logs.length})
            </p>
            <Logs logs={record.logs} />
          </div>
        )}
      </div>

      {sentModal && <SentModal info={sentModal} onClose={() => setSentModal(null)} />}
      {confirmCancel && (
        <ConfirmCancelModal
          onConfirm={handleCancel}
          onClose={() => setConfirmCancel(false)}
        />
      )}
    </>
  );
}
