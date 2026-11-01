import { useState, useRef } from "react";
import { Icons } from "./Icons";
import { useClickOutside } from "./hooks";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "simple", label: "Simple Record" },
  { value: "advance", label: "Advance Record" },
];

export default function FilterDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));
  const current = FILTERS.find((f) => f.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex w-60 items-center justify-between gap-2 rounded-lg border border-[#1e3260] bg-[#0b1527] px-3.5 py-2 text-sm font-medium text-[#a0bce0] hover:border-[#3d7aba] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3d7aba]"
      >
        <span className="flex items-center gap-2">
          <Icons.Filter className="w-4 h-4 text-[#3a5a8a]" />
          {current.label}
        </span>
        <Icons.Chevron className={`w-4 h-4 text-[#3a5a8a] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="absolute left-0 top-full mt-1.5 w-60 rounded-lg border border-[#1e3260] bg-[#0b1527] p-1 shadow-lg z-30">
          {FILTERS.map((f) => (
            <li key={f.value}>
              <button
                onClick={() => { onChange(f.value); setOpen(false); }}
                className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm text-left hover:bg-[#0f1e38] ${
                  f.value === value ? "text-[#6ab0ff] font-medium" : "text-[#6b8cba]"
                }`}
              >
                {f.label}
                {f.value === value && <Icons.Check className="w-4 h-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
