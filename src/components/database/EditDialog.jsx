import { useState } from "react";
import { FiUser, FiKey, FiEye, FiEyeOff } from "react-icons/fi";
import Modal from "../common/Modal";
import { COLUMNS, typeMeta } from "./databaseConfig";

export default function EditDialog({ item, onSave, onClose }) {
  const columns = COLUMNS[item.type] ?? [];
  const [draft, setDraft] = useState(() => ({
    username: item.username,
    ...Object.fromEntries(columns.map((c) => [c.key, item[c.key] ?? ""])),
  }));
  const [show, setShow] = useState(false);
  const valid = Object.values(draft).every((v) => typeof v === "string" && v.trim());

  const setField = (key) => (e) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  const submit = () => {
    if (!valid) return;
    onSave({
      ...item,
      ...Object.fromEntries(
        Object.entries(draft).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
      ),
    });
  };

  const inputCls =
    "h-9 w-full rounded border border-[#1e3260] bg-[#070d1a] pl-9 text-[13px] text-[#a0bce0] outline-none focus:border-[#3d7aba] focus-visible:ring-1 focus-visible:ring-[#3d7aba]/50 transition-colors";

  return (
    <Modal title="Edit entry" onClose={onClose}>
      <h2 className="text-lg font-bold text-[#a0bce0] tracking-wide">Edit Entry</h2>
      <p className="mt-1 text-[12px] text-[#3a5a8a]">
        Update the {typeMeta(item.type).label.toLowerCase()} record.
      </p>
      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-[#3a5a8a]">
            Username
          </span>
          <div className="relative">
            <FiUser size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d7aba]" />
            <input
              autoFocus
              value={draft.username}
              onChange={setField("username")}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className={`${inputCls} pr-3`}
            />
          </div>
        </label>
        {columns.map((c) => (
          <label key={c.key} className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-[#3a5a8a]">
              {c.label}
            </span>
            <div className="relative">
              <FiKey size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d7aba]" />
              <input
                type={show ? "text" : "password"}
                value={draft[c.key]}
                onChange={setField(c.key)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#3a5a8a] hover:text-[#a0bce0] cursor-pointer"
              >
                {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
              </button>
            </div>
          </label>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-[#1e3260] px-4 py-1.5 text-[13px] text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#a0bce0] transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!valid}
          className="rounded bg-[#1e3a6e] border border-[#3d7aba] px-4 py-1.5 text-[13px] text-[#a0bce0] hover:bg-[#2a4f8a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Save changes
        </button>
      </div>
    </Modal>
  );
}
