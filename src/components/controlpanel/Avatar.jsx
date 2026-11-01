import { Icons } from "./Icons";

export default function Avatar({ src, premium, size = "w-10 h-10" }) {
  const img = (
    <div className={`${size} rounded-full overflow-hidden flex items-center justify-center bg-[#0f1e38] text-[#3a5a8a]`}>
      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <Icons.User className="w-5 h-5" />}
    </div>
  );

  if (!premium) return <div className="shrink-0 rounded-full ring-1 ring-[#1e3260]">{img}</div>;

  return (
    <div className="relative shrink-0 mt-1.5">
      <span
        className="absolute text-[#e8c97a] drop-shadow z-10"
        style={{ left: "86%", top: "13%", transform: "translate(-50%, -50%) rotate(45deg)" }}
      >
        <Icons.Crown className="w-4 h-4" />
      </span>
      <div className="rounded-full bg-gradient-to-br from-[#e8c97a] via-[#f4d88d] to-[#e8c97a] p-[2.5px] shadow-md shadow-[#e8c97a]/20">
        <div className="rounded-full bg-[#060d1c] p-[2px]">{img}</div>
      </div>
    </div>
  );
}
