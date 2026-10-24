import { FaInstagram, FaFacebook } from "react-icons/fa";
import { FiGrid, FiLogIn, FiLock, FiHelpCircle } from "react-icons/fi";

export const SERVICES = [
  { value: "all", label: "All", icon: FiGrid },
  { value: "instagram", label: "Instagram", icon: FaInstagram },
  { value: "facebook", label: "Facebook", icon: FaFacebook },
];

export const TYPES = [
  { value: "login", label: "Login", icon: FiLogIn },
  { value: "change_password", label: "Change Password", icon: FiLock },
  { value: "forgot_password", label: "Forgot Password", icon: FiHelpCircle },
];

export const COLUMNS = {
  login: [{ key: "password", label: "Password" }],
  change_password: [
    { key: "oldPassword", label: "Old Password" },
    { key: "newPassword", label: "New Password" },
  ],
  forgot_password: [{ key: "verified", label: "Status" }],
};

export const typeMeta = (v) => TYPES.find((t) => t.value === v) ?? TYPES[0];

export const formatClock = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const formatRelative = (iso) => {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso)) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} day ago`;
};
