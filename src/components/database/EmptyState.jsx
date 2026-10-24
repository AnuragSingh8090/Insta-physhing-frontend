import { SERVICES, typeMeta } from "./databaseConfig";

export default function EmptyState({ service, type, searching, onClear }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-16 text-center">
      <svg
        viewBox="0 0 80 60"
        width="80"
        height="60"
        fill="none"
        stroke="#1e3260"
        strokeWidth="1.5"
        className="mb-4"
      >
        <ellipse cx="40" cy="12" rx="30" ry="10" />
        <path d="M10 12v12c0 5.5 13.4 10 30 10s30-4.5 30-10V12" />
        <path d="M10 24v12c0 5.5 13.4 10 30 10s30-4.5 30-10V24" />
        <path d="M10 36v12c0 5.5 13.4 10 30 10s30-4.5 30-10V36" />
      </svg>
      <h2 className="text-[15px] font-bold text-[#a0bce0] tracking-wide">
        {searching ? "No matching records" : "Nothing recorded yet"}
      </h2>
      <p className="mt-2 text-[12px] text-[#3a5a8a] leading-relaxed">
        {searching
          ? "No entry matches your search. Try a different term or clear it."
          : `No ${typeMeta(type).label.toLowerCase()} entries${
              service === "all"
                ? ""
                : ` for ${SERVICES.find((s) => s.value === service)?.label}`
            }.`}
      </p>
      {searching && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded border border-[#1e3260] px-3 py-1.5 text-[12px] text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#a0bce0] transition-colors cursor-pointer"
        >
          Clear search
        </button>
      )}
    </div>
  );
}
