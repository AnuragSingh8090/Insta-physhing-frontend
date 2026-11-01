import { Icons } from "./Icons";

export default function Button({ loading, children, className = "", ...p }) {
  return (
    <button
      {...p}
      disabled={loading || p.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3d7aba] ${className}`}
    >
      {loading && <Icons.Spinner />}
      {children}
    </button>
  );
}
