import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { fetchProfileByUser, getDashboardRouteForRole } from "../lib/profileHelpers";

const DAYS = ["mon","tue","wed","thu","fri","sat","sun"];
const DAY_L = ["Mo","Tu","We","Th","Fr","Sa","Su"];
const INITIAL_VEHICLE_FORM = { number: "", type: "Car", model: "", color: "" };

function sortVehicles(list = []) {
  return [...list].sort((a, b) => {
    if (Boolean(a.is_default) !== Boolean(b.is_default)) {
      return Number(Boolean(b.is_default)) - Number(Boolean(a.is_default));
    }
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
}

function getVehicleVisual(type) {
  const normalized = (type || "").toLowerCase();

  if (normalized === "bike" || normalized === "scooter") {
    return {
      icon: normalized === "bike" ? "🏍️" : "🛵",
      iconBg: "linear-gradient(135deg,#e8fff0,#c7f7d6)",
      iconColor: "#16803c",
    };
  }

  if (normalized === "truck") {
    return {
      icon: "🚚",
      iconBg: "linear-gradient(135deg,#eef5ff,#d9e9ff)",
      iconColor: "#2563eb",
    };
  }

  return {
    icon: "🚗",
    iconBg: "linear-gradient(135deg,#fff1e3,#ffd9b8)",
    iconColor: "#ff6b00",
  };
}

function getVehicleSubtitle(vehicle) {
  return [vehicle.vehicle_brand, vehicle.vehicle_color, vehicle.vehicle_type].filter(Boolean).join(" · ") || "Vehicle details not added yet";
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const [page, setPage] = useState("overview");
  const [sideOpen, setSideOpen] = useState(true);
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [spots, setSpots] = useState([]);
  const [bookingFilter, setBookingFilter] = useState("all");
  const [time, setTime] = useState(new Date());
  const [chosenSpot, setChosenSpot] = useState(null);
  const [vehicleForm, setVehicleForm] = useState(INITIAL_VEHICLE_FORM);
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [vehicleBusyId, setVehicleBusyId] = useState("");
  const [vehicleNotice, setVehicleNotice] = useState(null);
  const [primaryConfirmVehicle, setPrimaryConfirmVehicle] = useState(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [spotSearch, setSpotSearch] = useState("");
  const [spotLocation, setSpotLocation] = useState("");
  const [spotDate, setSpotDate] = useState("");

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const refreshVehicles = async (ownerId = userId) => {
    if (!ownerId) return [];

    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const nextVehicles = sortVehicles(data || []);
    setVehicles(nextVehicles);
    return nextVehicles;
  };

  // Fetch all data from Supabase on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
          navigate("/auth/login");
          return;
        }

        setUserId(user.id);

        const { profile: prof } = await fetchProfileByUser(user);

        if (prof) {
          setProfile(prof);
        }

        // Fetch user's bookings
        const { data: bk } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setBookings(bk || []);

        // Fetch user's vehicles
        await refreshVehicles(user.id);

        // Fetch all available spots for browsing
        const { data: sp } = await supabase
          .from('spots')
          .select('*')
          .eq('status', 'active')
          .order('rating', { ascending: false });
        setSpots(sp || []);

      } catch (err) {
        console.warn("Dashboard fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [navigate]);

  const userName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : "User";
  const userAvatar = profile ? `${(profile.first_name?.[0] || 'U')}${(profile.last_name?.[0] || '')}` : "U";
  const activeBookings = bookings.filter(b => b.status === "active").length;
  const totalSpent = bookings.filter(b => b.status !== "cancelled").reduce((a, b) => a + (b.amount || 0), 0);

  const filteredBookings = bookingFilter === "all" ? bookings : bookings.filter(b => b.status === bookingFilter);

  // Filter spots for browse page
  const filteredSpots = spots.filter(s => {
    const q = spotSearch.toLowerCase();
    const matchesSearch = !q || s.name?.toLowerCase().includes(q) || s.address?.toLowerCase().includes(q);
    const matchesLocation = !spotLocation || s.city?.toLowerCase() === spotLocation.toLowerCase();
    
    // Check date availability
    let matchesDate = true;
    if (spotDate) {
      const selectedDate = new Date(spotDate);
      const dayIndex = selectedDate.getDay();
      const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const dayKey = days[dayIndex];
      const availability = s.availability || {};
      matchesDate = availability[dayKey] !== false;
    }
    
    return matchesSearch && matchesLocation && matchesDate;
  });

  const NAV = [
    { key: "overview", icon: "⊞", label: "Overview" },
    { key: "bookings", icon: "📅", label: "My Bookings" },
    { key: "browse", icon: "🔍", label: "Find Parking" },
    { key: "vehicles", icon: "🚗", label: "My Vehicles" },
    { key: "profile", icon: "👤", label: "Profile" },
  ];

  const SW = sideOpen ? 240 : 68;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    navigate("/auth/login");
  };

  // Save profile updates
  const handleProfileSave = async (updates) => {
    if (!profile?.id) return;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id);
    if (!error) {
      setProfile({ ...profile, ...updates });
      alert("Profile updated successfully!");
    }
  };

  const handleBooking = async (spot) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/auth/login");

    const newBooking = {
      user_id: user.id,
      spot_id: spot.id,
      owner_id: spot.owner_id,
      vehicle_number: "UP 14 AB 1234",
      vehicle_type: "Car",
      vehicle_brand: "Maruti",
      vehicle_color: "Silver",
      user_name: user.email || "User",
      user_phone: "9876543210",
      booking_date: new Date().toISOString().split('T')[0],
      start_time: "10:00:00",
      end_time: "12:00:00",
      duration_hours: 2,
      amount: spot.price_hour * 2,
      booking_type: "hourly",
      status: "pending",
      payment_status: "pending"
    };

    const { error } = await supabase.from('bookings').insert([newBooking]);
    if (!error) {
      alert("Booking successful! ⚡");
      window.location.reload();
    } else {
      alert("Booking failed: " + error.message);
    }
  };

  const handleVehicleInput = (field, value) => {
    setVehicleForm(prev => ({
      ...prev,
      [field]: field === "number" ? value.toUpperCase() : value
    }));
  };

  const handleVehicleCancel = () => {
    setVehicleForm(INITIAL_VEHICLE_FORM);
    setVehicleNotice(null);
  };

  const handleAddVehicle = async (event) => {
    event.preventDefault();

    if (!userId) return;

    const payload = {
      vehicle_number: vehicleForm.number.replace(/\s+/g, " ").trim().toUpperCase(),
      vehicle_type: vehicleForm.type.trim() || "Car",
      vehicle_brand: vehicleForm.model.trim(),
      vehicle_color: vehicleForm.color.trim(),
    };

    if (!payload.vehicle_number || !payload.vehicle_brand || !payload.vehicle_color) {
      setVehicleNotice({ type: "error", message: "Please fill vehicle number, brand & model, and color." });
      return;
    }

    setVehicleSaving(true);
    setVehicleNotice(null);

    try {
      const { data, error } = await supabase
        .from("vehicles")
        .insert([{
          user_id: userId,
          ...payload,
          is_default: vehicles.length === 0
        }])
        .select("*")
        .single();

      if (error) throw error;

      setVehicles(prev => sortVehicles([data, ...prev]));
      setVehicleForm(INITIAL_VEHICLE_FORM);
      setVehicleNotice({ type: "success", message: `${payload.number} added to your vehicles.` });
    } catch (error) {
      setVehicleNotice({ type: "error", message: error.message || "Failed to add vehicle." });
    } finally {
      setVehicleSaving(false);
    }
  };

  const handleAskPrimaryChange = (vehicle) => {
    if (!vehicle || vehicle.is_primary || vehicleBusyId) return;
    setPrimaryConfirmVehicle(vehicle);
  };

  const handleConfirmPrimaryChange = async () => {
    if (!primaryConfirmVehicle || !userId) return;

    const targetVehicle = primaryConfirmVehicle;
    const currentPrimary = vehicles.find(vehicle => vehicle.is_default);

    setVehicleBusyId(targetVehicle.id);
    setPrimaryConfirmVehicle(null);
    setVehicleNotice(null);

    try {
      if (currentPrimary && currentPrimary.id !== targetVehicle.id) {
        const { error: unsetError } = await supabase
          .from("vehicles")
          .update({ is_default: false })
          .eq("id", currentPrimary.id)
          .eq("user_id", userId);

        if (unsetError) throw unsetError;
      }

      const { error: setError } = await supabase
        .from("vehicles")
        .update({ is_default: true })
        .eq("id", targetVehicle.id)
        .eq("user_id", userId);

      if (setError) {
        if (currentPrimary && currentPrimary.id !== targetVehicle.id) {
          await supabase
            .from("vehicles")
            .update({ is_default: true })
            .eq("id", currentPrimary.id)
            .eq("user_id", userId);
        }
        throw setError;
      }

      await refreshVehicles(userId);
      setVehicleNotice({ type: "success", message: `${targetVehicle.number} is now your primary vehicle.` });
    } catch (error) {
      try {
        await refreshVehicles(userId);
      } catch {
        // Keep the current UI state if a refresh also fails.
      }
      setVehicleNotice({ type: "error", message: error.message || "Failed to change the primary vehicle." });
    } finally {
      setVehicleBusyId("");
    }
  };

  const handleRemoveVehicle = async (vehicle) => {
    if (!vehicle || !userId) return;
    if (!window.confirm(`Remove ${vehicle.number}?`)) return;

    const remainingVehicles = vehicles.filter(item => item.id !== vehicle.id);
    const replacementVehicle = vehicle.is_primary ? remainingVehicles[0] : null;

    setVehicleBusyId(vehicle.id);
    setVehicleNotice(null);

    try {
      const { error: deleteError } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", vehicle.id)
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      if (replacementVehicle) {
        const { error: replacementError } = await supabase
          .from("vehicles")
          .update({ is_primary: true })
          .eq("id", replacementVehicle.id)
          .eq("user_id", userId);

        if (replacementError) throw replacementError;
      }

      const nextVehicles = replacementVehicle
        ? remainingVehicles.map(item => item.id === replacementVehicle.id ? { ...item, is_primary: true } : item)
        : remainingVehicles;

      setVehicles(sortVehicles(nextVehicles));
      setVehicleNotice({ type: "success", message: `${vehicle.number} removed from your vehicles.` });
    } catch (error) {
      try {
        await refreshVehicles(userId);
      } catch {
        // Keep the current UI state if a refresh also fails.
      }
      setVehicleNotice({ type: "error", message: error.message || "Failed to remove vehicle." });
    } finally {
      setVehicleBusyId("");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#080a0f", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit',sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid #1e2230", borderTopColor: "#63d2ff", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ color: "#5a6080", fontSize: 14 }}>Loading dashboard...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080a0f", fontFamily: "'Outfit',sans-serif", color: "#e0e0e0" }}>

      {/* ══ SIDEBAR ══ */}
      <aside style={{ width: SW, minHeight: "100vh", background: "#0a0c12", borderRight: "1px solid #13161f", display: "flex", flexDirection: "column", transition: "width 0.25s ease", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto", overflowX: "hidden" }}>
        <div style={{ padding: "22px 16px 18px", borderBottom: "1px solid #13161f", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setSideOpen(!sideOpen)}>
          <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: "linear-gradient(135deg,#63d2ff,#3a8fff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 16px rgba(99,210,255,0.3)" }}>🅿</div>
          {sideOpen && <div><div style={{ fontWeight: 900, fontSize: 17, color: "#f0f0f0", lineHeight: 1.1 }}>ParkEase</div><div style={{ fontSize: 10, color: "#4a5070", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: 2 }}>User Dashboard</div></div>}
        </div>

        {sideOpen && <div style={{ margin: "16px 14px 8px", background: "#0d0f16", border: "1px solid #1a1d28", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#63d2ff,#3a8fff)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: "#080a0f", flexShrink: 0 }}>{userAvatar}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#e0e0e0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
            <div style={{ fontSize: 10, color: "#4a5070", marginTop: 1 }}>{profile?.city || "Parking User"}</div>
          </div>
        </div>}

        <nav style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(n => (
            <button key={n.key}
              onClick={() => { setPage(n.key); setChosenSpot(null); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: sideOpen ? "11px 14px" : "11px 0", justifyContent: sideOpen ? "flex-start" : "center", borderRadius: 11, border: "none", cursor: "pointer", textAlign: "left", background: page === n.key ? "linear-gradient(135deg,#63d2ff,#3a8fff)" : "transparent", color: page === n.key ? "#080a0f" : "#5a6080", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", transition: "all 0.18s ease" }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{n.icon}</span>
              {sideOpen && <span>{n.label}</span>}
            </button>
          ))}
        </nav>

        {sideOpen && <div style={{ padding: "14px 16px", borderTop: "1px solid #13161f" }}>
          <button onClick={handleLogout} style={{ width: "100%", padding: "10px", borderRadius: 11, border: "1px solid #1e2230", background: "transparent", color: "#f87171", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>🚪 Logout</button>
        </div>}
      </aside>

      {/* ══ MAIN ══ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>

        <header style={{ background: "rgba(8,10,15,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #13161f", padding: "0 28px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: 16, color: "#f0f0f0", textTransform: "capitalize" }}>{page === "overview" ? `Welcome, ${(profile?.first_name || "User")}` : page === "browse" && chosenSpot ? "Spot Details" : page.replace("_", " ")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 12, color: "#4a5070", fontWeight: 500 }}>{time.toLocaleTimeString("en-IN")}</div>
            {activeBookings > 0 && <div style={{ background: "#0a1e2a", border: "1px solid rgba(99,210,255,0.2)", borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: "#63d2ff" }}>🔔 {activeBookings} Active</div>}
          </div>
        </header>

        <main style={{ flex: 1, padding: 28 }}>

          {/* ══ OVERVIEW ══ */}
          {page === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Welcome Banner */}
              <div style={{ background: "linear-gradient(135deg,#0a1e2a 0%,#0d1428 50%,#1a0d28 100%)", borderRadius: 22, padding: "32px 36px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(99,210,255,0.06)" }} />
                <div style={{ position: "absolute", right: 80, bottom: -60, width: 160, height: 160, borderRadius: "50%", background: "rgba(99,210,255,0.03)" }} />
                <div style={{ fontSize: 12, color: "#63d2ff", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>Welcome Back</div>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: "#f0f0f0", margin: "0 0 8px", letterSpacing: "-0.5px" }}>{userName} 👋</h1>
                <div style={{ fontSize: 13, color: "#4a5070" }}>
                  {profile?.city && profile?.state ? `📍 ${profile.city}, ${profile.state}` : "Find and book parking near you."}
                </div>
              </div>

              {/* KPI Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                {[
                  { label: "Active Bookings", value: activeBookings, sub: "Right now", icon: "⚡", color: "#63d2ff", bg: "rgba(99,210,255,0.08)" },
                  { label: "Total Bookings", value: bookings.length, sub: "All time", icon: "📅", color: "#c084fc", bg: "rgba(192,132,252,0.08)" },
                  { label: "Total Spent", value: `₹${totalSpent.toLocaleString("en-IN")}`, sub: "On parking", icon: "💰", color: "#4ade80", bg: "rgba(74,222,128,0.08)" },
                  { label: "My Vehicles", value: vehicles.length, sub: "Registered", icon: "🚗", color: "#f7c948", bg: "rgba(247,201,72,0.08)" },
                ].map(k => (
                  <div key={k.label} style={{ background: "#0d0f14", border: "1px solid #1a1d28", borderRadius: 18, padding: "22px 22px 18px", transition: "transform 0.2s, box-shadow 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.3)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>{k.icon}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
                    <div style={{ fontSize: 12, color: "#7a8090", margin: "6px 0 0" }}>{k.label}</div>
                    <div style={{ fontSize: 11, color: "#3a4060", marginTop: 3 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Quick Actions + Recent */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 20 }}>
                <div style={{ background: "#0d0f14", border: "1px solid #1a1d28", borderRadius: 20, padding: 24 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#f0f0f0", marginBottom: 20 }}>Quick Actions</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <button onClick={() => setPage("browse")} style={{ padding: "16px 18px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#63d2ff,#3a8fff)", color: "#080a0f", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 20px rgba(99,210,255,0.25)" }}>
                      🔍 Find Parking Near Me
                    </button>
                    <button onClick={() => setPage("bookings")} style={{ padding: "14px 18px", borderRadius: 14, border: "1px solid #1e2230", background: "transparent", color: "#7a8090", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 10 }}>
                      📅 View My Bookings
                    </button>
                    <button onClick={() => setPage("vehicles")} style={{ padding: "14px 18px", borderRadius: 14, border: "1px solid #1e2230", background: "transparent", color: "#7a8090", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 10 }}>
                      🚗 Manage Vehicles
                    </button>
                  </div>
                </div>

                <div style={{ background: "#0d0f14", border: "1px solid #1a1d28", borderRadius: 20, padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, alignItems: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#f0f0f0" }}>Recent Bookings</div>
                    <button onClick={() => setPage("bookings")} style={{ background: "transparent", border: "none", color: "#63d2ff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View All →</button>
                  </div>
                  {bookings.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px 0", color: "#3a4060" }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
                      <div style={{ fontSize: 13, color: "#5a6080" }}>No bookings yet. Find a spot!</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {bookings.slice(0, 3).map(b => (
                        <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "#111318", borderRadius: 12, border: "1px solid #1a1d28" }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: b.status === "active" ? "rgba(99,210,255,0.1)" : b.status === "completed" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                            {b.status === "active" ? "⚡" : b.status === "completed" ? "✓" : "✗"}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.spot_name || "Parking Spot"}</div>
                            <div style={{ fontSize: 11, color: "#4a5070", marginTop: 2 }}>{b.date || b.created_at?.split('T')[0]} · {b.time || ""}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: "#63d2ff" }}>₹{b.amount || 0}</div>
                            <StatusBadge s={b.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Nearby Spots */}
              {spots.length > 0 && (
                <div style={{ background: "#0d0f14", border: "1px solid #1a1d28", borderRadius: 20, padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, alignItems: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#f0f0f0" }}>Available Parking Spots</div>
                    <button onClick={() => setPage("browse")} style={{ background: "transparent", border: "none", color: "#63d2ff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Explore All →</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                    {spots.slice(0, 3).map(spot => (
                      <div key={spot.id} onClick={() => { setChosenSpot(spot); setPage("browse"); }} style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #1a1d28", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,0.4)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                        <div style={{ height: 120, position: "relative", background: "#111318" }}>
                          {spot.photo ? <img src={spot.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "#2a2d38" }}>🅿</div>}
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(8,10,15,0.8),transparent 60%)" }} />
                          <div style={{ position: "absolute", bottom: 10, left: 10 }}>
                            <div style={{ fontWeight: 800, fontSize: 13, color: "#fff" }}>{spot.name}</div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{spot.type || "Parking"}</div>
                          </div>
                        </div>
                        <div style={{ padding: "12px 14px", background: "#111318" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 800, fontSize: 16, color: "#63d2ff" }}>₹{spot.price_hour || 0}<span style={{ fontSize: 11, color: "#4a5070", fontWeight: 400 }}>/hr</span></span>
                            <span style={{ fontSize: 11, color: "#f7c948" }}>⭐ {spot.rating || "New"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ MY BOOKINGS ══ */}
          {page === "bookings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {["all", "active", "completed", "cancelled"].map(f => (
                  <button key={f} onClick={() => setBookingFilter(f)}
                    style={{ padding: "8px 18px", borderRadius: 10, border: bookingFilter === f ? "none" : "1px solid #1e2230", background: bookingFilter === f ? "linear-gradient(135deg,#63d2ff,#3a8fff)" : "transparent", color: bookingFilter === f ? "#080a0f" : "#5a6080", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textTransform: "capitalize" }}>
                    {f} {f !== "all" && `(${bookings.filter(b => b.status === f).length})`}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                {[
                  { label: "Active", count: bookings.filter(b => b.status === "active").length, color: "#63d2ff" },
                  { label: "Completed", count: bookings.filter(b => b.status === "completed").length, color: "#4ade80" },
                  { label: "Cancelled", count: bookings.filter(b => b.status === "cancelled").length, color: "#f87171" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#0d0f14", border: "1px solid #1a1d28", borderRadius: 16, padding: "20px 22px" }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: 12, color: "#5a6080", marginTop: 6 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredBookings.map(b => (
                  <div key={b.id} style={{ background: "#0d0f14", border: "1px solid #1a1d28", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 18, transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#111318"} onMouseLeave={e => e.currentTarget.style.background = "#0d0f14"}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: b.status === "active" ? "rgba(99,210,255,0.1)" : b.status === "completed" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${b.status === "active" ? "rgba(99,210,255,0.2)" : b.status === "completed" ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                      {b.status === "active" ? "⚡" : b.status === "completed" ? "✅" : "❌"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#e0e0e0", marginBottom: 3 }}>{b.spot_name || "Parking Spot"}</div>
                      <div style={{ fontSize: 12, color: "#4a5070" }}>📍 Spot ID: {b.spot_id?.slice(0, 8)}</div>
                      <div style={{ fontSize: 11, color: "#3a4060", marginTop: 4 }}>🚗 {b.vehicle_number || ""} · {b.booking_type || ""}</div>
                    </div>
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: "#7a8090", marginBottom: 2 }}>{b.date || b.created_at?.split('T')[0]}</div>
                      <div style={{ fontSize: 11, color: "#4a5070" }}>{b.time || ""}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, minWidth: 80 }}>
                      <div style={{ fontWeight: 800, fontSize: 18, color: "#63d2ff", marginBottom: 4 }}>₹{b.amount || 0}</div>
                      <StatusBadge s={b.status} />
                    </div>
                    {b.booking_id && <div style={{ flexShrink: 0 }}>
                      <span style={{ background: "#111318", border: "1px solid #1e2230", borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: "#63d2ff", letterSpacing: "0.5px" }}>{b.booking_id}</span>
                    </div>}
                  </div>
                ))}
                {filteredBookings.length === 0 && (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#3a4060" }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📅</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#5a6080" }}>No bookings found</div>
                    <button onClick={() => setPage("browse")} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#63d2ff,#3a8fff)", color: "#080a0f", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Find Parking →</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ BROWSE SPOTS ══ */}
          {page === "browse" && !chosenSpot && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ textAlign: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: "#63d2ff", textTransform: "uppercase", marginBottom: 8 }}>Find Parking</div>
                <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: "#f0f0f0" }}>Search Available Spots</h2>
              </div>

              {/* Search & Filter Bar */}
              <div style={{ background: "#0d0f14", border: "1px solid #1a1d28", borderRadius: 16, padding: "16px 20px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <input value={spotSearch} onChange={e => setSpotSearch(e.target.value)}
                    placeholder="🔍 Search spot name or address..."
                    style={{ width: "100%", background: "#111318", border: "1px solid #1e2230", borderRadius: 10, padding: "12px 14px", color: "#e0e0e0", fontSize: 13, fontWeight: 500, fontFamily: "'Outfit',sans-serif", outline: "none", transition: "all 0.2s" }}
                    onFocus={e => { e.target.style.borderColor = "#63d2ff"; e.target.style.boxShadow = "0 0 0 3px rgba(99,210,255,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor = "#1e2230"; e.target.style.boxShadow = ""; }} />
                </div>
                
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {/* Location Filter */}
                  <div style={{ display: "flex", gap: 6 }}>
                    {["Ghaziabad", "Mathura"].map(city => (
                      <button key={city} onClick={() => setSpotLocation(spotLocation === city ? "" : city)}
                        style={{ padding: "10px 16px", borderRadius: 10, border: spotLocation === city ? "none" : "1px solid #1e2230", background: spotLocation === city ? "linear-gradient(135deg,#63d2ff,#3a8fff)" : "transparent", color: spotLocation === city ? "#080a0f" : "#5a6080", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.2s", whiteSpace: "nowrap" }}>
                        📍 {city}
                      </button>
                    ))}
                  </div>

                  {/* Date Filter - Improved */}
                  <div style={{ position: "relative" }}>
                    <input value={spotDate} onChange={e => setSpotDate(e.target.value)} type="date"
                      style={{ background: spotDate ? "rgba(99,210,255,0.1)" : "#111318", border: spotDate ? "1px solid #63d2ff" : "1px solid #1e2230", borderRadius: 10, padding: "10px 12px", color: "#e0e0e0", fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer", outline: "none", transition: "all 0.2s", minWidth: 140 }} />
                    {spotDate && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#63d2ff", pointerEvents: "none" }}>✓</span>}
                  </div>
                </div>

                {/* Clear Filters */}
                {(spotSearch || spotLocation || spotDate) && (
                  <button onClick={() => { setSpotSearch(""); setSpotLocation(""); setSpotDate(""); }}
                    style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #f87171", background: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.2s" }}>
                    ✕ Clear
                  </button>
                )}
              </div>

              {/* Active Filters Status */}
              {(spotSearch || spotLocation || spotDate) && (
                <div style={{ background: "rgba(99,210,255,0.05)", border: "1px solid rgba(99,210,255,0.15)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#7a8a9a", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                    🔍 Searching: {" "}
                    {spotSearch && <span style={{ background: "rgba(99,210,255,0.2)", padding: "2px 8px", borderRadius: 4, color: "#63d2ff", whiteSpace: "nowrap" }}>"{spotSearch}"</span>}
                    {spotLocation && <span style={{ background: "rgba(99,210,255,0.2)", padding: "2px 8px", borderRadius: 4, color: "#63d2ff", whiteSpace: "nowrap" }}>{spotLocation}</span>}
                    {spotDate && <span style={{ background: "rgba(99,210,255,0.2)", padding: "2px 8px", borderRadius: 4, color: "#63d2ff", whiteSpace: "nowrap" }}>📅 {new Date(spotDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>}
                  </span>
                  <span style={{ marginLeft: "auto", color: "#5a6080", whiteSpace: "nowrap" }}>Found {filteredSpots.length} spot{filteredSpots.length !== 1 ? "s" : ""}</span>
                </div>
              )}

              {filteredSpots.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 0", color: "#3a4060" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "#5a6080" }}>
                    {spots.length === 0 ? "No spots available yet" : "No spots match your search"}
                  </div>
                  <div style={{ fontSize: 13, color: "#3a4060", marginTop: 8 }}>
                    {spots.length === 0 ? "Check back soon — land owners are adding spots!" : "Try changing your search or filters"}
                  </div>
                  {spotSearch || spotLocation || spotDate ? (
                    <button onClick={() => { setSpotSearch(""); setSpotLocation(""); setSpotDate(""); }}
                      style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#63d2ff,#3a8fff)", color: "#080a0f", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                      Clear Filters →
                    </button>
                  ) : null}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
                  {filteredSpots.map(spot => (
                    <div key={spot.id} style={{ background: "#0d0f14", border: "1px solid #1a1d28", borderRadius: 18, overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer" }}
                      onClick={() => setChosenSpot(spot)}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 20px 50px rgba(0,0,0,0.5)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                      <div style={{ height: 170, position: "relative", background: "#111318" }}>
                        {spot.photo ? <img src={spot.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, color: "#2a2d38" }}>🅿</div>}
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(8,10,15,0.7),transparent 50%)" }} />
                        <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(8,10,15,0.7)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#63d2ff" }}>{spot.type || "Parking"}</div>
                        <div style={{ position: "absolute", bottom: 12, left: 14 }}>
                          <div style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>{spot.name}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{spot.address || ""}</div>
                        </div>
                      </div>
                      <div style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <div style={{ display: "flex", gap: 14 }}>
                            <div><span style={{ fontSize: 22, fontWeight: 800, color: "#63d2ff" }}>₹{spot.price_hour || 0}</span><span style={{ fontSize: 11, color: "#4a5070" }}>/hr</span></div>
                            <div><span style={{ fontSize: 22, fontWeight: 800, color: "#f7c948" }}>₹{spot.price_day || 0}</span><span style={{ fontSize: 11, color: "#4a5070" }}>/day</span></div>
                          </div>
                          <div style={{ fontSize: 11, color: "#f7c948" }}>⭐ {spot.rating || "New"}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={e => { e.stopPropagation(); setChosenSpot(spot); }} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #1e2230", background: "transparent", color: "#7a8090", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View Details</button>
                          <button onClick={(e) => { e.stopPropagation(); handleBooking(spot); }} style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#63d2ff,#3a8fff)", color: "#080a0f", fontSize: 12, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px rgba(99,210,255,0.25)" }}>Book Now →</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Spot Detail */}
          {page === "browse" && chosenSpot && (
            <div>
              <button onClick={() => setChosenSpot(null)} style={{ background: "transparent", border: "none", color: "#5a6080", cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 22, display: "flex", alignItems: "center", gap: 6, padding: 0 }}>← Back to Spots</button>
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div style={{ borderRadius: 18, overflow: "hidden", height: 260, background: "#111318" }}>
                    {chosenSpot.photo ? <img src={chosenSpot.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, color: "#2a2d38" }}>🅿</div>}
                  </div>
                  <div style={{ background: "#0d0f14", border: "1px solid #1a1d28", borderRadius: 18, padding: 22 }}>
                    <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{chosenSpot.name}</div>
                    <div style={{ fontSize: 12, color: "#4a5070", marginBottom: 16 }}>📍 {chosenSpot.address || ""}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {(chosenSpot.amenities || []).map(a => <span key={a} style={{ background: "rgba(99,210,255,0.08)", color: "#63d2ff", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1px solid rgba(99,210,255,0.15)" }}>✓ {a}</span>)}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Per Hour", value: `₹${chosenSpot.price_hour || 0}`, color: "#63d2ff" },
                      { label: "Per Day", value: `₹${chosenSpot.price_day || 0}`, color: "#f7c948" },
                      { label: "Rating", value: `⭐ ${chosenSpot.rating || "New"}`, color: "#f7c948" },
                      { label: "Slots", value: `${chosenSpot.slots || 0} available`, color: "#4ade80" },
                    ].map(s => (
                      <div key={s.label} style={{ background: "#0d0f14", border: "1px solid #1a1d28", borderRadius: 14, padding: "16px 18px" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: "#4a5070", marginTop: 4 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#0d0f14", border: "1px solid #1a1d28", borderRadius: 18, padding: 20 }}>
                    <div style={{ fontSize: 11, color: "#5a6080", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>Schedule</div>
                    <div style={{ fontSize: 13, color: "#5a6080" }}>⏰ {chosenSpot.time_from || "08:00"} — {chosenSpot.time_to || "20:00"}</div>
                  </div>
                  <button onClick={() => handleBooking(chosenSpot)} style={{ padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#63d2ff,#3a8fff)", color: "#080a0f", fontWeight: 900, fontSize: 15, cursor: "pointer", boxShadow: "0 6px 28px rgba(99,210,255,0.3)" }}>Reserve This Spot →</button>
                </div>
              </div>
            </div>
          )}

          {/* ══ VEHICLES ══ */}
          {page === "vehicles" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: "100%" }}>
              {/* Header */}
              <div>
                <h2 style={{ margin: 0, fontWeight: 800, fontSize: 28, color: "#f0f0f0", marginBottom: 6 }}>My Vehicles</h2>
                <div style={{ fontSize: 14, color: "#7a8090" }}>{vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} registered</div>
              </div>

              {/* Vehicle List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {vehicles.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", background: "#0d0f14", border: "2px dashed #1e2230", borderRadius: 18 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🚗</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#5a6080" }}>No vehicles yet</div>
                    <div style={{ fontSize: 13, color: "#3a4060", marginTop: 6 }}>Add your first vehicle to get started</div>
                  </div>
                ) : (
                  vehicles.map(v => {
                    const visual = getVehicleVisual(v.type);
                    return (
                      <div key={v.id} style={{
                        background: "linear-gradient(135deg, #0d0f14 0%, #0a0c12 100%)",
                        border: v.is_primary ? "2px solid #ff6b00" : "1px solid #1a1d28",
                        borderRadius: 16,
                        padding: "20px 24px",
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                        transition: "all 0.3s",
                        boxShadow: v.is_primary ? "0 0 20px rgba(255,107,0,0.1)" : "none"
                      }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = v.is_primary ? "0 0 20px rgba(255,107,0,0.1)" : "none"; e.currentTarget.style.transform = "translateY(0)"; }}>

                        {/* Vehicle Icon */}
                        <div style={{ width: 70, height: 70, borderRadius: 14, background: visual.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0, border: `2px solid ${visual.iconColor}30` }}>
                          {visual.icon}
                        </div>

                        {/* Vehicle Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                            <span style={{ fontWeight: 900, fontSize: 20, color: "#f0f0f0", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{v.vehicle_number}</span>
                            {v.is_default && (
                              <span style={{ 
                                background: "rgba(255,107,0,0.15)", 
                                color: "#ff6b00", 
                                padding: "5px 14px", 
                                borderRadius: 20, 
                                fontSize: 11, 
                                fontWeight: 800, 
                                border: "1px solid rgba(255,107,0,0.3)",
                                textTransform: "uppercase",
                                letterSpacing: "0.6px"
                              }}>
                                PRIMARY
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 13, color: "#7a8a9a", fontFamily: "'Outfit',sans-serif" }}>
                            {getVehicleSubtitle(v)}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: 10, flexShrink: 0, alignItems: "center" }}>
                          {!v.is_default && vehicles.length >= 2 && (
                            <button
                              onClick={() => handleAskPrimaryChange(v)}
                              disabled={vehicleBusyId === v.id}
                              style={{
                                padding: "10px 20px",
                                borderRadius: 10,
                                border: "1px solid #1e2230",
                                background: "rgba(99,210,255,0.05)",
                                color: "#7a8090",
                                fontWeight: 700,
                                fontSize: 13,
                                cursor: vehicleBusyId === v.id ? "not-allowed" : "pointer",
                                opacity: vehicleBusyId === v.id ? 0.5 : 1,
                                transition: "all 0.2s",
                                whiteSpace: "nowrap"
                              }}
                              onMouseEnter={e => { if (!vehicleBusyId) { e.target.style.background = "#63d2ff20"; e.target.style.borderColor = "#63d2ff"; e.target.style.color = "#63d2ff"; } }}
                              onMouseLeave={e => { e.target.style.background = "rgba(99,210,255,0.05)"; e.target.style.borderColor = "#1e2230"; e.target.style.color = "#7a8090"; }}>
                              Set Primary
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveVehicle(v)}
                            disabled={vehicleBusyId === v.id}
                            style={{
                              padding: "10px 20px",
                              borderRadius: 10,
                              border: "1px solid #f873731a",
                              background: "rgba(248,113,113,0.08)",
                              color: "#f87171",
                              fontWeight: 700,
                              fontSize: 13,
                              cursor: vehicleBusyId === v.id ? "not-allowed" : "pointer",
                              opacity: vehicleBusyId === v.id ? 0.5 : 1,
                              transition: "all 0.2s",
                              whiteSpace: "nowrap"
                            }}
                            onMouseEnter={e => { if (!vehicleBusyId) { e.target.style.background = "rgba(248,113,113,0.15)"; e.target.style.borderColor = "#f87171"; } }}
                            onMouseLeave={e => { e.target.style.background = "rgba(248,113,113,0.08)"; e.target.style.borderColor = "#f873731a"; }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Primary Confirm Dialog */}
              {primaryConfirmVehicle && (
                <div style={{ background: "rgba(99,210,255,0.05)", border: "1px solid rgba(99,210,255,0.15)", borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 13, color: "#7a8a9a", marginBottom: 14 }}>
                    Set <span style={{ fontWeight: 700, color: "#63d2ff" }}>{primaryConfirmVehicle.vehicle_number}</span> as your primary vehicle?
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={handleConfirmPrimaryChange} style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#63d2ff,#3a8fff)", color: "#080a0f", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      Yes, Set Primary
                    </button>
                    <button onClick={() => setPrimaryConfirmVehicle(null)} style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "1px solid #1e2230", background: "transparent", color: "#7a8090", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Add New Vehicle Form */}
              {showVehicleForm && (
                <div style={{ background: "#0d0f14", border: "1px solid #1a1d28", borderRadius: 16, padding: 24 }}>
                  <h3 style={{ margin: "0 0 20px", fontWeight: 800, fontSize: 18, color: "#f0f0f0" }}>Add New Vehicle</h3>
                  <form onSubmit={handleAddVehicle} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#4a5070", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Vehicle Number</label>
                        <input type="text" value={vehicleForm.number} onChange={e => handleVehicleInput("number", e.target.value)} placeholder="UP 14 AB 1234" style={{ width: "100%", background: "#111318", border: "1px solid #1e2230", borderRadius: 10, padding: "11px 14px", color: "#e0e0e0", fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#4a5070", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Vehicle Type</label>
                        <select value={vehicleForm.type} onChange={e => handleVehicleInput("type", e.target.value)} style={{ width: "100%", background: "#111318", border: "1px solid #1e2230", borderRadius: 10, padding: "11px 14px", color: "#e0e0e0", fontSize: 13, fontFamily: "'Outfit',sans-serif", cursor: "pointer", outline: "none" }}>
                          <option value="Car">Car</option>
                          <option value="Bike">Bike</option>
                          <option value="Scooter">Scooter</option>
                          <option value="Truck">Truck</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#4a5070", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Brand & Model</label>
                        <input type="text" value={vehicleForm.model} onChange={e => handleVehicleInput("model", e.target.value)} placeholder="Maruti Swift" style={{ width: "100%", background: "#111318", border: "1px solid #1e2230", borderRadius: 10, padding: "11px 14px", color: "#e0e0e0", fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#4a5070", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Color</label>
                        <input type="text" value={vehicleForm.color} onChange={e => handleVehicleInput("color", e.target.value)} placeholder="White" style={{ width: "100%", background: "#111318", border: "1px solid #1e2230", borderRadius: 10, padding: "11px 14px", color: "#e0e0e0", fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                      </div>
                    </div>
                    {vehicleNotice && (
                      <div style={{ padding: "12px 14px", borderRadius: 10, background: vehicleNotice.type === "error" ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.1)", border: `1px solid ${vehicleNotice.type === "error" ? "rgba(248,113,113,0.2)" : "rgba(74,222,128,0.2)"}`, color: vehicleNotice.type === "error" ? "#f87171" : "#4ade80", fontSize: 13, fontWeight: 600 }}>
                        {vehicleNotice.message}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 12 }}>
                      <button type="submit" disabled={vehicleSaving} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#ff6b00,#ff8c33)", color: "#fff", fontWeight: 800, fontSize: 14, cursor: vehicleSaving ? "not-allowed" : "pointer", opacity: vehicleSaving ? 0.6 : 1 }}>
                        {vehicleSaving ? "Adding..." : "✓ Add Vehicle"}
                      </button>
                      <button type="button" onClick={handleVehicleCancel} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #1e2230", background: "transparent", color: "#7a8090", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Add New Vehicle Button - Always At Bottom */}
              {!showVehicleForm && (
                <button onClick={() => setShowVehicleForm(true)} style={{
                  padding: "20px 24px",
                  borderRadius: 14,
                  border: "2px dashed #ff6b00",
                  background: "transparent",
                  color: "#ff6b00",
                  fontWeight: 800,
                  fontSize: 16,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textAlign: "center",
                  marginTop: vehicles.length > 0 ? 8 : 0
                }}
                  onMouseEnter={e => { e.target.style.background = "rgba(255,107,0,0.05)"; e.target.style.borderColor = "#ff8c33"; }}
                  onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.borderColor = "#ff6b00"; }}>
                  + Add New Vehicle
                </button>
              )}
            </div>
          )}

          {/* ══ PROFILE ══ */}
          {page === "profile" && profile && (
            <div style={{ maxWidth: 580, display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: "linear-gradient(135deg,#0a1e2a,#0d1428)", borderRadius: 22, padding: "32px 36px", display: "flex", gap: 22, alignItems: "center" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg,#63d2ff,#3a8fff)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 26, color: "#080a0f", flexShrink: 0 }}>
                  {profile.photo_url ? <img src={profile.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : userAvatar}
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#f0f0f0", marginBottom: 4 }}>{userName}</div>
                  <div style={{ fontSize: 13, color: "#4a5070", marginBottom: 8 }}>{profile.city && profile.state ? `${profile.city}, ${profile.state}` : "Parking User"}</div>
                  <span style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>✓ {profile.role === 'user' ? 'Verified User' : profile.role}</span>
                </div>
              </div>
              <div style={{ background: "#0d0f14", border: "1px solid #1a1d28", borderRadius: 20, padding: 28 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#f0f0f0", marginBottom: 22 }}>Account Details</div>
                <div style={{ display: "grid", gap: 16 }}>
                  {[
                    { label: "First Name", key: "first_name" },
                    { label: "Last Name", key: "last_name" },
                    { label: "Email", key: "email" },
                    { label: "Phone", key: "phone" },
                    { label: "City", key: "city" },
                    { label: "State", key: "state" },
                    { label: "Pincode", key: "pincode" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#4a5070", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>{f.label}</label>
                      <input defaultValue={profile[f.key] || ""} style={{ width: "100%", background: "#111318", border: "1px solid #1e2230", borderRadius: 10, padding: "11px 14px", color: "#e0e0e0", fontSize: 14, fontFamily: "'Outfit',sans-serif" }} readOnly />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "#0d0f14", border: "1px solid #1a1d28", borderRadius: 20, padding: 24 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#f0f0f0", marginBottom: 16 }}>Activity Summary</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { l: "Total Bookings", v: bookings.length },
                    { l: "Total Spent", v: `₹${totalSpent.toLocaleString("en-IN")}` },
                    { l: "Vehicles", v: vehicles.length },
                    { l: "Active Now", v: activeBookings },
                  ].map(r => (
                    <div key={r.l} style={{ background: "#111318", borderRadius: 12, padding: "14px 16px", border: "1px solid #1a1d28" }}>
                      <div style={{ fontSize: 11, color: "#4a5070", marginBottom: 6 }}>{r.l}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#63d2ff" }}>{r.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

function StatusBadge({ s }) {
  const m = {
    active: { color: "#63d2ff", bg: "rgba(99,210,255,0.1)", dot: "#63d2ff" },
    completed: { color: "#4ade80", bg: "rgba(74,222,128,0.1)", dot: "#4ade80" },
    cancelled: { color: "#f87171", bg: "rgba(248,113,113,0.1)", dot: "#f87171" },
  }[s] || { color: "#888", bg: "#1a1d28", dot: "#555" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: m.bg, color: m.color }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.dot, display: "inline-block" }} />
      {(s || "").charAt(0).toUpperCase() + (s || "").slice(1)}
    </span>
  );
}
