import { useState } from "react";
import { Icons } from "../../components/controlpanel/Icons";
import FilterDropdown from "../../components/controlpanel/FilterDropdown";
import CheckboxCP from "../../components/controlpanel/CheckboxCP";
import Avatar from "../../components/controlpanel/Avatar";
import Button from "../../components/controlpanel/Button";
import Logs from "../../components/controlpanel/Logs";
import { SEED, delay } from "../../components/controlpanel/constants";

export default function ControlPanel() {
  const [records, setRecords] = useState(SEED);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Filter records
  const filtered = records.filter((r) => filter === "all" || r.type === filter);

  // Selection logic
  const allIds = filtered.map((r) => r.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = allIds.some((id) => selected.has(id)) && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  const toggleOne = (id) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected record(s)?`)) return;
    
    setLoading(true);
    await delay();
    setRecords((prev) => prev.filter((r) => !selected.has(r.id)));
    setSelected(new Set());
    setLoading(false);
  };

  // Individual delete
  const handleDelete = async (id) => {
    if (!confirm("Delete this record?")) return;
    setLoading(true);
    await delay(500);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setLoading(false);
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
            
            {selected.size > 0 && (
              <Button
                onClick={handleBulkDelete}
                loading={loading}
                className="border border-red-500/60 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              >
                <Icons.Trash /> Delete ({selected.size})
              </Button>
            )}

            <Button
              onClick={() => alert("Add new feature coming soon!")}
              className="border border-[#3d7aba] bg-[#3d7aba]/10 text-[#6ab0ff] hover:bg-[#3d7aba]/20"
            >
              <Icons.Plus /> Add New
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="rounded-xl border border-[#131e35] bg-[#0b1527]/50 backdrop-blur overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center gap-4 px-4 py-3 border-b border-[#131e35] bg-[#060d1c]/50">
            <CheckboxCP
              checked={allSelected}
              indeterminate={someSelected}
              onChange={toggleAll}
              disabled={filtered.length === 0}
            />
            <div className="flex-1 grid grid-cols-[3fr_2fr_1fr] gap-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#3a5a8a]">User Info</span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#3a5a8a]">Type</span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#3a5a8a] text-right">Actions</span>
            </div>
          </div>

          {/* Table Body */}
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Icons.Filter className="w-12 h-12 mx-auto mb-3 text-[#1e3260]" />
              <p className="text-sm text-[#6b8cba]">No records found. Try changing the filter.</p>
            </div>
          ) : (
            <div>
              {filtered.map((record) => (
                <RecordRow
                  key={record.id}
                  record={record}
                  selected={selected.has(record.id)}
                  onToggle={() => toggleOne(record.id)}
                  onDelete={() => handleDelete(record.id)}
                  loading={loading}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Record Row Component
function RecordRow({ record, selected, onToggle, onDelete, loading }) {
  const [expanded, setExpanded] = useState(false);
  const premium = record.type === "advance";

  return (
    <div className="border-b border-[#131e35] last:border-0">
      <div className={`flex items-center gap-4 px-4 py-3 ${
        premium ? "bg-gradient-to-r from-[#e8c97a]/5 to-transparent" : "hover:bg-[#0f1e38]/50"
      }`}>
        <CheckboxCP checked={selected} onChange={onToggle} disabled={loading} />
        
        <div className="flex-1 grid grid-cols-[3fr_2fr_1fr] gap-4 items-center">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <Avatar src={premium ? record.avatar : ""} premium={premium} size="w-10 h-10" />
            <div className="min-w-0">
              <p className={`text-sm font-medium truncate ${record.username ? "text-[#a0bce0]" : "text-[#3a5a8a]"}`}>
                {record.username || "-"}
              </p>
              <p className="text-xs text-[#6b8cba] truncate">{record.email}</p>
            </div>
          </div>

          {/* Type Badge */}
          <div>
            {premium ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e8c97a]/10 border border-[#e8c97a]/20 text-xs font-medium text-[#e8c97a]">
                <Icons.Crown className="w-3 h-3" />
                Advance
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3d7aba]/10 border border-[#3d7aba]/20 text-xs font-medium text-[#6ab0ff]">
                Simple
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={() => alert("Edit feature coming soon!")}
              disabled={loading}
              className="border border-[#1e3260] bg-[#0b1527] text-[#6ab0ff] hover:bg-[#0f1e38] !px-2 !py-1 text-xs"
            >
              <Icons.Edit className="w-3 h-3" /> Edit
            </Button>
            
            <Button
              onClick={onDelete}
              loading={loading}
              className="border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 !px-2 !py-1 text-xs"
            >
              <Icons.Trash className="w-3 h-3" />
            </Button>

            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded hover:bg-[#0f1e38] text-[#3a5a8a] hover:text-[#6ab0ff] transition-colors"
              aria-label="Toggle logs"
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
  );
}
