import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { fetchProfileByUser, getDashboardRouteForRole } from "../lib/profileHelpers";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState("user");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    if (!email) { setError("Please enter your email address."); return; }
    if (!password) { setError("Please enter your password."); return; }
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError(authError.message); return; }
      const { profile } = await fetchProfileByUser(authData.user);
      const role = profile?.role || "user";
      localStorage.setItem("userRole", role);
      localStorage.setItem("user", JSON.stringify({ ...authData.user, name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(), role }));
      window.location.href = getDashboardRouteForRole(role);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const F = (e) => { e.target.style.borderColor = "#f97316"; e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)"; };
  const B = (e) => { e.target.style.borderColor = "rgba(249,115,22,0.15)"; e.target.style.boxShadow = ""; };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: "20px", position: "relative", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Bebas+Neue&display=swap" rel="stylesheet" />

      {/* Grid Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px", maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)" }} />

      {/* Orange Glow */}
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%, -60%)", pointerEvents: "none" }} />

      {/* Card */}
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 480, background: "rgba(12,10,8,0.9)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 20, padding: "40px 36px", backdropFilter: "blur(20px)", boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(249,115,22,0.05)" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #f97316, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 0 24px rgba(249,115,22,0.4)" }}>🅿</div>
          <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: "2px", color: "#e8e4dc" }}>ParkEase</span>
        </div>

        <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 38, letterSpacing: "1px", color: "#e8e4dc", textAlign: "center", marginBottom: 4 }}>Welcome Back</h1>
        <p style={{ fontSize: 13, color: "#666", textAlign: "center", marginBottom: 28 }}>Sign in to continue to your dashboard</p>

        {/* Role Toggle */}
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#555", letterSpacing: "1.5px", textTransform: "uppercase", display: "block", marginBottom: 10 }}>I am a</span>
          <div style={{ display: "flex", gap: 10 }}>
            {[{ key: "user", icon: "👤", label: "Driver", sub: "Find & book parking" }, { key: "landowner", icon: "🏢", label: "Land Owner", sub: "Manage properties" }].map(r => (
              <button key={r.key} onClick={() => setUserType(r.key)}
                style={{ flex: 1, padding: "14px 12px", borderRadius: 12, border: userType === r.key ? "1px solid rgba(249,115,22,0.5)" : "1px solid rgba(255,255,255,0.06)", background: userType === r.key ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.02)", cursor: "pointer", textAlign: "center", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 24 }}>{r.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: userType === r.key ? "#f97316" : "#777" }}>{r.label}</span>
                <span style={{ fontSize: 10, color: userType === r.key ? "rgba(249,115,22,0.7)" : "#444" }}>{r.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: "#555", letterSpacing: "1.5px", textTransform: "uppercase", display: "block", marginBottom: 7 }}>Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder={userType === "landowner" ? "owner@parkease.com" : "user@example.com"}
            style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 10, padding: "12px 14px", color: "#e8e4dc", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "all 0.2s", boxSizing: "border-box" }}
            onFocus={F} onBlur={B} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 20, position: "relative" }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: "#555", letterSpacing: "1.5px", textTransform: "uppercase", display: "block", marginBottom: 7 }}>Password</label>
          <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 10, padding: "12px 44px 12px 14px", color: "#e8e4dc", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "all 0.2s", boxSizing: "border-box" }}
            onFocus={F} onBlur={B} onKeyDown={e => e.key === "Enter" && handleLogin()} />
          <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, bottom: 10, background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#555" }}>
            {showPass ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            ⚠ {error}
          </div>
        )}

        {/* Submit */}
        <button onClick={handleLogin} disabled={loading}
          style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: loading ? "rgba(249,115,22,0.2)" : "linear-gradient(135deg, #f97316, #ea580c)", color: loading ? "#555" : "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 4px 20px rgba(249,115,22,0.35)", transition: "all 0.2s", letterSpacing: "0.5px", fontFamily: "'DM Sans', sans-serif" }}>
          {loading ? "Signing in..." : "Continue →"}
        </button>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, fontSize: 13 }}>
          <button style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Forgot password?</button>
          <button onClick={() => navigate("/auth/signup")} style={{ background: "none", border: "none", color: "#f97316", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Sign up →</button>
        </div>
      </div>
    </div>
  );
}
