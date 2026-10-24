import { useEffect } from "react";

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#060d1c]/80 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded border border-[#1e3260] bg-[#0b1527] p-6 shadow-[0_24px_48px_-12px_rgba(0,0,20,0.8)]"
      >
        {children}
      </div>
    </div>
  );
}
