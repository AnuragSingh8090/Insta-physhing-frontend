import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";

export default function Dashboard() {
  const [uptime, setUptime] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Uptime clock — lives here so it persists across tab switches
  useEffect(() => {
    const t = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="dashboard-root h-screen flex flex-col overflow-hidden bg-[#060d1c] text-[#a0bce0] font-mono">
      {/* Fixed background grid */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[#060d1c]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,60,120,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(30,60,120,0.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Top Navbar */}
      <Navbar
        uptime={uptime}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh((v) => !v)}
      />

      {/* Page content */}
      <Outlet context={{ autoRefresh }} />
    </div>
  );
}
