import { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";

export default function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border border-[#2a3a5c] text-[#6b8cba] hover:border-[#3d5a8a] hover:text-[#a0bce0] transition-colors cursor-pointer"
      title={label}
      aria-label={label}
    >
      {copied ? <FiCheck size={11} className="text-[#2ecc71]" /> : <FiCopy size={11} />}
      {copied ? "Copied" : label}
    </button>
  );
}
