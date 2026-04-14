import React, { useState } from "react";

const roles = [
  { key: "driver", icon: "🚗", label: "I'm a Driver", sub: "Find & book parking near my destination", badge: "🔍 Browse & Book" },
  { key: "owner", icon: "🏠", label: "I'm a Land Owner", sub: "Earn money by listing unused land", badge: "💰 List & Earn" },
];

export default function WhoAmI({ onRoleSelect, onNavigateToSignIn }) {
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const handleContinue = () => {
    if (!selected) { showToast("Please select your role to continue"); return; }
    onRoleSelect(selected);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "'DM Sans', sans-serif", color: "#e8e4dc", position: "relative", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Bebas+Neue&family=Instrument+Serif:ital@1&display=swap" rel="stylesheet" />

      {/* Grid Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px", maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)" }} />

      {/* Noise */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      {/* Navbar */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 48px", borderBottom: "1px solid rgba(249,115,22,0.1)", background: "rgba(8,8,8,0.85)", backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #f97316, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 0 20px rgba(249,115,22,0.4)" }}>🅿</div>
          <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: "2px", color: "#e8e4dc" }}>ParkEase</span>
        </div>
        {/* Step dots */}
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 28, height: 4, borderRadius: 4, background: i === 0 ? "#f97316" : "rgba(255,255,255,0.08)" }} />)}
        </div>
        <button onClick={onNavigateToSignIn} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#666", borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, transition: "all 0.2s" }}>
          Back
        </button>
      </nav>

      {/* Main Content */}
      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 20px 40px" }}>
        <div style={{ width: "100%", maxWidth: 580 }}>

          {/* Eyebrow */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 100, padding: "6px 16px", fontSize: 11, fontWeight: 600, letterSpacing: "2px", color: "#f97316", textTransform: "uppercase", marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f97316", display: "inline-block" }} />
            Step 1 of 3 — Choose Your Role
          </div>

          <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 64, letterSpacing: "1px", color: "#e8e4dc", lineHeight: 0.95, marginBottom: 14 }}>
            How Will You <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", color: "#f97316" }}>Use</span>
            <br />ParkEase?
          </h1>
          <p style={{ fontSize: 15, color: "#666", marginBottom: 32, lineHeight: 1.6 }}>
            Tell us who you are so we can personalise your experience.
          </p>

          {/* Role Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
            {roles.map(r => (
              <button key={r.key} onClick={() => setSelected(r.key)}
                style={{ padding: "24px 20px", borderRadius: 16, border: selected === r.key ? "1px solid rgba(249,115,22,0.5)" : "1px solid rgba(255,255,255,0.06)", background: selected === r.key ? "rgba(249,115,22,0.07)" : "rgba(255,255,255,0.02)", cursor: "pointer", textAlign: "left", transition: "all 0.2s", position: "relative", boxShadow: selected === r.key ? "0 8px 32px rgba(249,115,22,0.12)" : "none" }}>
                {/* Checkmark */}
                <div style={{ position: "absolute", top: 12, right: 12, width: 22, height: 22, borderRadius: "50%", background: selected === r.key ? "#f97316" : "transparent", border: selected === r.key ? "none" : "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 900, transition: "all 0.2s" }}>
                  {selected === r.key ? "✓" : ""}
                </div>
                <div style={{ fontSize: 38, marginBottom: 12 }}>{r.icon}</div>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: "1px", color: selected === r.key ? "#f97316" : "#e8e4dc", marginBottom: 6 }}>{r.label}</div>
                <p style={{ fontSize: 12, color: "#666", marginBottom: 12, lineHeight: 1.5, fontWeight: 400 }}>{r.sub}</p>
                <div style={{ display: "inline-flex", padding: "4px 12px", borderRadius: 20, background: selected === r.key ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${selected === r.key ? "rgba(249,115,22,0.3)" : "rgba(255,255,255,0.06)"}`, fontSize: 11, color: selected === r.key ? "#f97316" : "#555", fontWeight: 600 }}>
                  {r.badge}
                </div>
              </button>
            ))}
          </div>

          {/* Continue */}
          <button onClick={handleContinue}
            style={{ width: "100%", padding: "15px", borderRadius: 12, border: "none", background: selected ? "linear-gradient(135deg, #f97316, #ea580c)" : "rgba(255,255,255,0.04)", color: selected ? "#fff" : "#444", fontWeight: 700, fontSize: 16, cursor: selected ? "pointer" : "not-allowed", boxShadow: selected ? "0 4px 20px rgba(249,115,22,0.35)" : "none", transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif" }}>
            Continue →
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "#555", marginTop: 18 }}>
            Already have an account?{" "}
            <button onClick={onNavigateToSignIn} style={{ background: "none", border: "none", color: "#f97316", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
              Sign In
            </button>
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "rgba(12,10,8,0.95)", border: "1px solid rgba(249,115,22,0.3)", borderLeft: "3px solid #f97316", borderRadius: 12, padding: "14px 18px", color: "#e8e4dc", fontSize: 13, fontWeight: 600, zIndex: 1000, backdropFilter: "blur(12px)" }}>
          ⚠ {toast}
        </div>
      )}
    </div>
  );
}