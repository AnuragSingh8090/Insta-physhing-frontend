import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiCheck } from "react-icons/fi";

export default function Dropdown({
  label,
  options = [],
  value,
  onChange,
  className = "",
  minWidth = "min-w-[9rem]",
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);

  const selected = options.find((o) => o.value === value);
  const SelectedIcon = selected?.icon;

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const openMenu = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const choose = (opt) => {
    if (opt) onChange(opt.value);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") return setOpen(false);
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      return openMenu();
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(options[active]);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label || selected?.label}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`flex h-7 ${minWidth} items-center gap-2 rounded border border-[#1e3260] bg-[#0b1527] px-2.5 text-left text-[11px] text-[#6b8cba] outline-none transition-colors hover:border-[#3d7aba] hover:text-[#a0bce0] focus-visible:ring-1 focus-visible:ring-[#3d7aba]/50 cursor-pointer`}
      >
        {SelectedIcon && <SelectedIcon className="shrink-0 text-[#3d7aba]" size={12} />}
        <span className="flex-1 truncate">{selected?.label}</span>
        <FiChevronDown
          size={11}
          className={`shrink-0 text-[#3a5a8a] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-30 mt-1 w-full min-w-[10rem] overflow-hidden rounded border border-[#1e3260] bg-[#0b1527] p-1 shadow-[0_12px_28px_-8px_rgba(0,0,0,0.7)]"
        >
          {options.map((opt, i) => {
            const Icon = opt.icon;
            const isSel = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSel}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(opt)}
                className={`flex cursor-pointer items-center gap-2 rounded px-2.5 py-1.5 text-[11px] transition-colors ${
                  i === active ? "bg-[#1e3260] text-[#a0bce0]" : "text-[#6b8cba]"
                }`}
              >
                {Icon && <Icon size={12} className="shrink-0 text-[#3d7aba]" />}
                <span className="flex-1">{opt.label}</span>
                {isSel && <FiCheck size={11} className="text-[#3d7aba]" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
