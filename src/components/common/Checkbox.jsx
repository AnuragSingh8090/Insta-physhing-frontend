import { useEffect, useRef } from "react";
import { FiCheck, FiMinus } from "react-icons/fi";

export default function Checkbox({ checked, indeterminate = false, onChange, label }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const filled = checked || indeterminate;

  return (
    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        className={`flex h-5 w-5 items-center justify-center rounded border-2 text-white transition-colors
        peer-focus-visible:ring-2 peer-focus-visible:ring-[#3d7aba] peer-focus-visible:ring-offset-1
        ${filled ? "border-[#3d7aba] bg-[#3d7aba]" : "border-[#1e3260] bg-[#0b1527]"}`}
      >
        {indeterminate ? <FiMinus size={12} /> : checked ? <FiCheck size={12} /> : null}
      </span>
    </label>
  );
}
