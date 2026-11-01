import { useRef, useEffect } from "react";

export default function CheckboxCP({ checked, onChange, indeterminate, disabled }) {
  const ref = useRef(null);
  
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="h-[18px] w-[18px] shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 rounded border-[#3a5a8a] accent-[#3d7aba] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3d7aba]"
    />
  );
}
