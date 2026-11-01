// Constants and utility functions for Control Panel

export const SEND_TYPES = ["Someone tried to sign in", "New login detected"];

export const delay = (ms = 1500) => new Promise((r) => setTimeout(r, ms));

export const uid = () => Math.random().toString(36).slice(2, 9);

export const fmt = (iso) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
};

export const mkLogs = (items) =>
  items.map(([type, iso, emailStatus, status = "sent"]) => ({ id: uid(), type, sentAt: iso, emailStatus, status }));

export const defaultNotify = () => ({ type: SEND_TYPES[0], schedule: false, scheduledAt: "", pendingId: null });

export const DEFAULT_DEVICE = "Redmi Note 12";
export const DEFAULT_ADDRESS = "Kanpur, UP, India";

export const blank = (adv) => ({
  _k: uid(),
  username: "",
  email: "",
  avatar: "",
  deviceName: adv ? DEFAULT_DEVICE : "",
  address: adv ? DEFAULT_ADDRESS : "",
});

// Seed data
export const SEED = [
  {
    id: "1",
    type: "advance",
    username: "aarav_k",
    email: "aarav.kumar@example.com",
    deviceName: "Redmi Note 12",
    address: "Bengaluru, India",
    avatar: "",
    notify: defaultNotify(),
    logs: mkLogs([
      [SEND_TYPES[0], "2026-10-24T09:12:00", "success", "opened"],
      [SEND_TYPES[1], "2026-10-22T18:40:00", "failed", "sent"],
    ]),
  },
  {
    id: "2",
    type: "simple",
    username: "",
    email: "support-team@example-company.com",
    avatar: "",
    notify: defaultNotify(),
    logs: mkLogs([[SEND_TYPES[1], "2026-10-25T07:05:00", "success", "password changed"]]),
  },
  {
    id: "3",
    type: "simple",
    username: "meera.s",
    email: "meera@example.com",
    avatar: "",
    notify: { type: SEND_TYPES[1], schedule: false, scheduledAt: "", pendingId: null },
    logs: [],
  },
];
