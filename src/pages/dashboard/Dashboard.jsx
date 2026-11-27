import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";

export default function Dashboard() {
  const [uptime, setUptime] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [emailService, setEmailService] = useState('gmail');      // default: gmail
  const [linksEnabled, setLinksEnabled] = useState(false);        // default: no links
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("adminAccess") !== "true") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const t = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="dashboard-root h-screen flex flex-col overflow-hidden bg-[#060d1c] text-[#a0bce0] font-mono">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[#060d1c]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,60,120,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(30,60,120,0.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <Navbar
        uptime={uptime}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh((v) => !v)}
        emailService={emailService}
        onToggleEmail={() => setEmailService(s => s === 'gmail' ? 'hostinger' : 'gmail')}
        linksEnabled={linksEnabled}
        onToggleLinks={() => setLinksEnabled(v => !v)}
      />

      {/* Pass email settings down to all dashboard pages via outlet context */}
      <Outlet context={{ autoRefresh, emailService, linksEnabled }} />
    </div>
  );
}
