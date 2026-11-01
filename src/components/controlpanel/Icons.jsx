// Icon components for Control Panel
const Icon = ({ d, className = "w-4 h-4", fill = "none", children }) => (
  <svg viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children || <path d={d} />}
  </svg>
);

export const Icons = {
  User: (p) => <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></Icon>,
  Chevron: (p) => <Icon {...p} d="M6 9l6 6 6-6" />,
  Plus: (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  Close: (p) => <Icon {...p} d="M6 6l12 12M18 6L6 18" />,
  Edit: (p) => <Icon {...p}><path d="M4 20h4L19 9l-4-4L4 16v4z" /></Icon>,
  Trash: (p) => <Icon {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Icon>,
  Check: (p) => <Icon {...p} d="M5 12l5 5 9-10" />,
  Mail: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>,
  Filter: (p) => <Icon {...p} d="M4 5h16l-6 8v6l-4-2v-4L4 5z" />,
  Upload: (p) => <Icon {...p}><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></Icon>,
  Refresh: (p) => <Icon {...p}><path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" /></Icon>,
  Send: (p) => <Icon {...p} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  Crown: ({ className = "w-4 h-4" }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
      <path d="M2.5 7l4.8 4.2L12 4l4.7 7.2L21.5 7l-1.8 10.5H4.3L2.5 7z" />
      <rect x="4.5" y="18.8" width="15" height="2" rx="1" />
    </svg>
  ),
  Spinner: ({ className = "w-4 h-4" }) => (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
};
