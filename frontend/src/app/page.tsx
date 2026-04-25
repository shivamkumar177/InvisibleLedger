"use client";
import { useEffect, useState } from "react";
import DesktopDashboard from "./components/DesktopDashboard";
import MobileDashboard from "./components/MobileDashboard";
import Login from "./components/Login";

export default function Home() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check for existing token
    const savedToken = localStorage.getItem('ledger_token');
    if (savedToken) {
      setToken(savedToken);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isMounted) return null;

  if (!token) {
    return <Login onLogin={setToken} />;
  }

  return (
    <>
      {isMobile ? <MobileDashboard token={token} onLogout={() => { localStorage.removeItem('ledger_token'); setToken(null); }} /> : <DesktopDashboard token={token} onLogout={() => { localStorage.removeItem('ledger_token'); setToken(null); }} />}
    </>
  );
}
