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
  const [spotTime, setSpotTime] = useState("");
  const [spotType, setSpotType] = useState("");

  // Booking modal state
  const [bookingModal, setBookingModal] = useState(null); // holds the spot
  const [bkDate, setBkDate] = useState("");
  const [bkStart, setBkStart] = useState("10:00");
  const [bkEnd, setBkEnd] = useState("12:00");
  const [bkType, setBkType] = useState("hourly"); // hourly | daily
  const [bkVehicleId, setBkVehicleId] = useState("");
  const [bkFeatures, setBkFeatures] = useState([]);
  const [bkSaving, setBkSaving] = useState(false);
  const [bkError, setBkError] = useState("");

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

  // Extract unique cities from spot addresses dynamically
  const spotCities = [...new Set(spots.map(s => {
    const addr = s.address || "";
    // Try to extract city: take the second-to-last comma-separated part, or first part
    const parts = addr.split(",").map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) return parts[parts.length - 2];
    if (parts.length === 1) return parts[0];
    return "";
  }).filter(Boolean))].sort();

  // Extract unique parking types
  const spotTypes = [...new Set(spots.map(s => s.type).filter(Boolean))].sort();

  // Filter spots for browse page
  const filteredSpots = spots.filter(s => {
    const q = spotSearch.toLowerCase();
    const matchesSearch = !q || s.name?.toLowerCase().includes(q) || s.address?.toLowerCase().includes(q);
    
    // Location: check if address contains the location string
    const matchesLocation = !spotLocation || (s.address || "").toLowerCase().includes(spotLocation.toLowerCase());
    
    // Type filter
    const matchesType = !spotType || s.type === spotType;
    
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
    
    // Check time availability
    let matchesTime = true;
    if (spotTime) {
      const userTime = spotTime.replace(":", "");
      const openTime = (s.time_from || "00:00").replace(":", "");
      const closeTime = (s.time_to || "23:59").replace(":", "");
      matchesTime = userTime >= openTime && userTime <= closeTime;
    }
    
    return matchesSearch && matchesLocation && matchesType && matchesDate && matchesTime;
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

  // Open the booking modal (replaces direct handleBooking)
  const handleBooking = (spot) => {
    const today = new Date().toISOString().split('T')[0];
    setBkDate(today);
    setBkStart(spot.time_from?.slice(0,5) || "10:00");
    setBkEnd("");
    setBkType("hourly");
    setBkFeatures([]);
    setBkError("");
    // Pre-select primary vehicle if available
    const primary = vehicles.find(v => v.is_default) || vehicles[0];
    setBkVehicleId(primary?.id || "");
    setBookingModal(spot);
  };

  // Calculate duration in hours between two HH:MM strings
  const calcDurationHours = (start, end) => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return Math.max(0, diff / 60);
  };

  // Calculate booking amount
  const calcAmount = (spot) => {
    if (!spot) return 0;
    if (bkType === "daily") return spot.price_day || 0;
    const hrs = calcDurationHours(bkStart, bkEnd);
    return Math.ceil(hrs * (spot.price_hour || 0));
  };

  const handleSubmitBooking = async () => {
    if (!bookingModal || !userId) return;
    if (!bkDate) { setBkError("Please select a date."); return; }
    if (bkType === "hourly" && (!bkStart || !bkEnd)) { setBkError("Please select start and end time."); return; }
    if (bkType === "hourly" && calcDurationHours(bkStart, bkEnd) <= 0) { setBkError("End time must be after start time."); return; }
    if (!bkVehicleId && vehicles.length > 0) { setBkError("Please select a vehicle."); return; }

    const selectedVehicle = vehicles.find(v => v.id === bkVehicleId);
    const duration = bkType === "daily" ? 24 : calcDurationHours(bkStart, bkEnd);
    const amount = calcAmount(bookingModal);

    setBkSaving(true);
    setBkError("");
    try {
      // 1. Double Booking Check Loop
      const { data: overlapping } = await supabase.from('bookings')
        .select('start_time, end_time, booking_type')
        .eq('spot_id', bookingModal.id)
        .eq('booking_date', bkDate)
        .in('status', ['pending', 'active']);

      let hasOverlap = false;
      if (overlapping && overlapping.length > 0) {
        if (bkType === "daily") {
          hasOverlap = true; // Spot takes whole day, any booking conflicts
        } else {
          const newStart = `${bkStart}:00`;
          const newEnd = `${bkEnd}:00`;
          hasOverlap = overlapping.some(b => {
             if (b.booking_type === "daily") return true; 
             return (newStart < b.end_time && b.start_time < newEnd);
          });
        }
      }

      if (hasOverlap) {
        setBkError("This parking spot is already booked for the selected time.");
        setBkSaving(false);
        return;
      }

      // 2. Perform the Insert
      const { error } = await supabase.from('bookings').insert([{
        user_id: userId,
        spot_id: bookingModal.id,
        owner_id: bookingModal.owner_id,
        vehicle_number: selectedVehicle?.vehicle_number || "",
        vehicle_type: selectedVehicle?.vehicle_type || "",
        vehicle_brand: selectedVehicle?.vehicle_brand || "",
        vehicle_color: selectedVehicle?.vehicle_color || "",
        user_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : "",
        user_phone: profile?.phone || "",
        booking_date: bkDate,
        start_time: bkType === "daily" ? "00:00:00" : `${bkStart}:00`,
        end_time: bkType === "daily" ? "23:59:00" : `${bkEnd}:00`,
        duration_hours: duration,
        amount,
        booking_type: bkType,
        requested_features: bkFeatures,
        status: "pending",
        payment_status: "pending"
      }]);
      if (error) throw error;
      setBookingModal(null);
      
      // Refresh bookings
      const { data: bk } = await supabase.from('bookings').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      setBookings(bk || []);
      
      // Change UI Context mapping and provide visual success
      setPage("bookings");
      alert("✅ Booking Confirmed! Your parking spot is officially reserved.");
    } catch (err) {
      setBkError(err.message || "Booking failed. Please try again.");
    } finally {
      setBkSaving(false);
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
    setShowVehicleForm(false);
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
    const replacementVehicle = vehicle.is_default ? remainingVehicles[0] : null;

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
          .update({ is_default: true })
          .eq("id", replacementVehicle.id)
          .eq("user_id", userId);

        if (replacementError) throw replacementError;
      }

      const nextVehicles = replacementVehicle
        ? remainingVehicles.map(item => item.id === replacementVehicle.id ? { ...item, is_default: true } : item)
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
      <div style={{ display: "flex", minHeight: "100vh", background: "#080808", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid rgba(249,115,22,0.15)", borderTopColor: "#f97316", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ color: "#555", fontSize: 14 }}>Loading dashboard...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080808", fontFamily: "'DM Sans',sans-serif", color: "#e8e4dc" }}>

      {/* ══ BOOKING MODAL ══ */}
      {bookingModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,6,12,0.92)", backdropFilter: "blur(14px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={e => { if (e.target === e.currentTarget) setBookingModal(null); }}>
          <div style={{ background: "linear-gradient(160deg, rgba(12,10,8,0.9) 0%, #080a14 100%)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 24, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(249,115,22,0.06)" }}>

            {/* Modal Header */}
            <div style={{ padding: "24px 28px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#f97316", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>Book Parking</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#e8e4dc", lineHeight: 1.2 }}>{bookingModal.name}</div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>📍 {bookingModal.address}</div>
              </div>
              <button onClick={() => setBookingModal(null)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#555", fontSize: 16, flexShrink: 0, marginTop: 4 }}>✕</button>
            </div>

            <div style={{ padding: "20px 28px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Booking Type Toggle */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: "1.2px", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Booking Type</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {[{ key: "hourly", label: "⏱ Hourly", sub: `₹${bookingModal.price_hour}/hr` }, { key: "daily", label: "📅 Full Day", sub: `₹${bookingModal.price_day}/day` }].map(t => (
                    <button key={t.key} onClick={() => setBkType(t.key)}
                      style={{ flex: 1, padding: "14px 16px", borderRadius: 14, border: bkType === t.key ? "2px solid #f97316" : "1px solid rgba(249,115,22,0.15)", background: bkType === t.key ? "rgba(249,115,22,0.08)" : "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.2s" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: bkType === t.key ? "#f97316" : "#555" }}>{t.label}</span>
                      <span style={{ fontSize: 12, color: bkType === t.key ? "#f97316" : "#555", fontWeight: 600 }}>{t.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time Row */}
              <div style={{ display: "grid", gridTemplateColumns: bkType === "hourly" ? "1fr 1fr 1fr" : "1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: "1.2px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>📅 Date</label>
                  <input type="date" value={bkDate} onChange={e => setBkDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    style={{ width: "100%", background: "#111318", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 10, padding: "11px 14px", color: "#e8e4dc", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box" }} />
                </div>
                {bkType === "hourly" && <>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: "1.2px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>🕐 Start Time</label>
                    <input type="time" value={bkStart} onChange={e => setBkStart(e.target.value)}
                      min={bookingModal.time_from || "00:00"} max={bookingModal.time_to || "23:59"}
                      style={{ width: "100%", background: "#111318", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 10, padding: "11px 14px", color: "#e8e4dc", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: "1.2px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>🕔 End Time</label>
                    <input type="time" value={bkEnd} onChange={e => setBkEnd(e.target.value)}
                      min={bkStart || bookingModal.time_from || "00:00"} max={bookingModal.time_to || "23:59"}
                      style={{ width: "100%", background: "#111318", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 10, padding: "11px 14px", color: "#e8e4dc", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box" }} />
                  </div>
                </>}
              </div>

              {/* Spot timing hint */}
              <div style={{ fontSize: 11, color: "#555", display: "flex", alignItems: "center", gap: 6, marginTop: -10 }}>
                <span>⏰</span>
                <span>Spot open: <strong style={{ color: "#666" }}>{bookingModal.time_from || "08:00"} – {bookingModal.time_to || "20:00"}</strong></span>
                {bkType === "hourly" && bkStart && bkEnd && calcDurationHours(bkStart, bkEnd) > 0 && (
                  <span style={{ marginLeft: 8, color: "#f97316", fontWeight: 600 }}>· {calcDurationHours(bkStart, bkEnd).toFixed(1)} hrs</span>
                )}
              </div>

              {/* Vehicle Selection */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: "1.2px", textTransform: "uppercase", display: "block", marginBottom: 10 }}>🚗 Select Vehicle</label>
                {vehicles.length === 0 ? (
                  <div style={{ padding: "14px 16px", borderRadius: 12, border: "1px dashed rgba(249,115,22,0.15)", textAlign: "center", fontSize: 12, color: "#555" }}>
                    No vehicles added. <button onClick={() => { setBookingModal(null); setPage("vehicles"); }} style={{ background: "none", border: "none", color: "#f97316", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Add Vehicle →</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {vehicles.map(v => {
                      const vis = getVehicleVisual(v.vehicle_type);
                      return (
                        <button key={v.id} onClick={() => setBkVehicleId(v.id)}
                          style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12, border: bkVehicleId === v.id ? "2px solid #f97316" : "1px solid rgba(249,115,22,0.15)", background: bkVehicleId === v.id ? "rgba(249,115,22,0.06)" : "transparent", cursor: "pointer", textAlign: "left", transition: "all 0.15s", width: "100%" }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: vis.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{vis.icon}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: bkVehicleId === v.id ? "#f97316" : "#e8e4dc" }}>{v.vehicle_number}</div>
                            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{[v.vehicle_brand, v.vehicle_color, v.vehicle_type].filter(Boolean).join(" · ")}</div>
                          </div>
                          {v.is_default && <span style={{ fontSize: 10, background: "rgba(255,107,0,0.15)", color: "#ff6b00", padding: "3px 10px", borderRadius: 20, fontWeight: 700, border: "1px solid rgba(255,107,0,0.25)" }}>PRIMARY</span>}
                          {bkVehicleId === v.id && <span style={{ color: "#f97316", fontSize: 18 }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Amenities / Features */}
              {(bookingModal.amenities || []).length > 0 && (
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: "1.2px", textTransform: "uppercase", display: "block", marginBottom: 10 }}>✨ Select Features You Need</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {bookingModal.amenities.map(a => (
                      <button key={a} onClick={() => setBkFeatures(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])}
                        style={{ padding: "8px 16px", borderRadius: 20, border: bkFeatures.includes(a) ? "1px solid rgba(249,115,22,0.4)" : "1px solid rgba(249,115,22,0.15)", background: bkFeatures.includes(a) ? "rgba(249,115,22,0.1)" : "transparent", color: bkFeatures.includes(a) ? "#f97316" : "#555", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                        {bkFeatures.includes(a) ? "✓ " : ""}{a}
                      </button>
                    ))}
                  </div>
                  {bkFeatures.length > 0 && <div style={{ fontSize: 11, color: "#555", marginTop: 8 }}>Selected: {bkFeatures.join(", ")}</div>}
                </div>
              )}

              {/* Cost Summary */}
              <div style={{ background: "linear-gradient(135deg, #0a1520, #080e1a)", border: "1px solid rgba(249,115,22,0.12)", borderRadius: 14, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#666", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Estimated Cost</div>
                  <div style={{ fontSize: 11, color: "#555" }}>
                    {bkType === "daily" ? "Full day rate" : bkStart && bkEnd && calcDurationHours(bkStart, bkEnd) > 0 ? `${calcDurationHours(bkStart, bkEnd).toFixed(1)} hrs × ₹${bookingModal.price_hour}/hr` : "Select time to calculate"}
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#f97316" }}>
                  ₹{calcAmount(bookingModal)}
                </div>
              </div>

              {/* Error */}
              {bkError && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: 13, fontWeight: 600 }}>
                  ⚠ {bkError}
                </div>
              )}

              {/* Submit */}
              <button onClick={handleSubmitBooking} disabled={bkSaving}
                style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: bkSaving ? "rgba(249,115,22,0.15)" : "linear-gradient(135deg,#f97316,#ea580c)", color: bkSaving ? "#555" : "#080808", fontWeight: 900, fontSize: 16, cursor: bkSaving ? "not-allowed" : "pointer", boxShadow: bkSaving ? "none" : "0 8px 28px rgba(249,115,22,0.3)", transition: "all 0.2s", letterSpacing: "0.3px" }}>
                {bkSaving ? "⏳ Submitting..." : "⚡ Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ SIDEBAR ══ */}
      <aside style={{ width: SW, minHeight: "100vh", background: "rgba(0,0,0,0.6)", borderRight: "1px solid rgba(249,115,22,0.1)", display: "flex", flexDirection: "column", transition: "width 0.25s ease", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto", overflowX: "hidden" }}>
        <div style={{ padding: "22px 16px 18px", borderBottom: "1px solid rgba(249,115,22,0.1)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setSideOpen(!sideOpen)}>
          <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: "linear-gradient(135deg,#f97316,#ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 16px rgba(249,115,22,0.3)" }}>🅿</div>
          {sideOpen && <div><div style={{ fontWeight: 900, fontSize: 17, color: "#e8e4dc", lineHeight: 1.1 }}>ParkEase</div><div style={{ fontSize: 10, color: "#666", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: 2 }}>User Dashboard</div></div>}
        </div>

        {sideOpen && <div style={{ margin: "16px 14px 8px", background: "rgba(12,10,8,0.9)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: "#080808", flexShrink: 0 }}>{userAvatar}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#e8e4dc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
            <div style={{ fontSize: 10, color: "#666", marginTop: 1 }}>{profile?.city || "Parking User"}</div>
          </div>
        </div>}

        <nav style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(n => (
            <button key={n.key}
              onClick={() => { setPage(n.key); setChosenSpot(null); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: sideOpen ? "11px 14px" : "11px 0", justifyContent: sideOpen ? "flex-start" : "center", borderRadius: 11, border: "none", cursor: "pointer", textAlign: "left", background: page === n.key ? "linear-gradient(135deg,#f97316,#ea580c)" : "transparent", color: page === n.key ? "#080808" : "#555", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", transition: "all 0.18s ease" }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{n.icon}</span>
              {sideOpen && <span>{n.label}</span>}
            </button>
          ))}
        </nav>

        {sideOpen && <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(249,115,22,0.1)" }}>
          <button onClick={handleLogout} style={{ width: "100%", padding: "10px", borderRadius: 11, border: "1px solid rgba(249,115,22,0.15)", background: "transparent", color: "#f87171", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>🚪 Logout</button>
        </div>}
      </aside>

      {/* ══ MAIN ══ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>

        <header style={{ background: "rgba(8,10,15,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(249,115,22,0.1)", padding: "0 28px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: 16, color: "#e8e4dc", textTransform: "capitalize" }}>{page === "overview" ? `Welcome, ${(profile?.first_name || "User")}` : page === "browse" && chosenSpot ? "Spot Details" : page.replace("_", " ")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>{time.toLocaleTimeString("en-IN")}</div>
            {activeBookings > 0 && <div style={{ background: "#0a1e2a", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: "#f97316" }}>🔔 {activeBookings} Active</div>}
          </div>
        </header>

        <main style={{ flex: 1, padding: 28 }}>

          {/* ══ OVERVIEW ══ */}
          {page === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Welcome Banner */}
              <div style={{ background: "linear-gradient(135deg,#0a1e2a 0%,#0d1428 50%,#1a0d28 100%)", borderRadius: 22, padding: "32px 36px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(249,115,22,0.06)" }} />
                <div style={{ position: "absolute", right: 80, bottom: -60, width: 160, height: 160, borderRadius: "50%", background: "rgba(249,115,22,0.03)" }} />
                <div style={{ fontSize: 12, color: "#f97316", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>Welcome Back</div>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: "#e8e4dc", margin: "0 0 8px", letterSpacing: "-0.5px" }}>{userName} 👋</h1>
                <div style={{ fontSize: 13, color: "#666" }}>
                  {profile?.city && profile?.state ? `📍 ${profile.city}, ${profile.state}` : "Find and book parking near you."}
                </div>
              </div>

              {/* KPI Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                {[
                  { label: "Active Bookings", value: activeBookings, sub: "Right now", icon: "⚡", color: "#f97316", bg: "rgba(249,115,22,0.08)" },
                  { label: "Total Bookings", value: bookings.length, sub: "All time", icon: "📅", color: "#c084fc", bg: "rgba(192,132,252,0.08)" },
                  { label: "Total Spent", value: `₹${totalSpent.toLocaleString("en-IN")}`, sub: "On parking", icon: "💰", color: "#4ade80", bg: "rgba(74,222,128,0.08)" },
                  { label: "My Vehicles", value: vehicles.length, sub: "Registered", icon: "🚗", color: "#f7c948", bg: "rgba(247,201,72,0.08)" },
                ].map(k => (
                  <div key={k.label} style={{ background: "rgba(12,10,8,0.9)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 18, padding: "22px 22px 18px", transition: "transform 0.2s, box-shadow 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.3)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>{k.icon}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
                    <div style={{ fontSize: 12, color: "#7a8090", margin: "6px 0 0" }}>{k.label}</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 3 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Quick Actions + Recent */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 20 }}>
                <div style={{ background: "rgba(12,10,8,0.9)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 20, padding: 24 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#e8e4dc", marginBottom: 20 }}>Quick Actions</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <button onClick={() => setPage("browse")} style={{ padding: "16px 18px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#f97316,#ea580c)", color: "#080808", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 20px rgba(249,115,22,0.25)" }}>
                      🔍 Find Parking Near Me
                    </button>
                    <button onClick={() => setPage("bookings")} style={{ padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(249,115,22,0.15)", background: "transparent", color: "#7a8090", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 10 }}>
                      📅 View My Bookings
                    </button>
                    <button onClick={() => setPage("vehicles")} style={{ padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(249,115,22,0.15)", background: "transparent", color: "#7a8090", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 10 }}>
                      🚗 Manage Vehicles
                    </button>
                  </div>
                </div>

                <div style={{ background: "rgba(12,10,8,0.9)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 20, padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, alignItems: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#e8e4dc" }}>Recent Bookings</div>
                    <button onClick={() => setPage("bookings")} style={{ background: "transparent", border: "none", color: "#f97316", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View All →</button>
                  </div>
                  {bookings.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px 0", color: "#555" }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
                      <div style={{ fontSize: 13, color: "#555" }}>No bookings yet. Find a spot!</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {bookings.slice(0, 3).map(b => (
                        <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "#111318", borderRadius: 12, border: "1px solid rgba(249,115,22,0.15)" }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: b.status === "active" ? "rgba(249,115,22,0.1)" : b.status === "completed" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                            {b.status === "active" ? "⚡" : b.status === "completed" ? "✓" : "✗"}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#e8e4dc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.spot_name || "Parking Spot"}</div>
                            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{b.date || b.created_at?.split('T')[0]} · {b.time || ""}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: "#f97316" }}>₹{b.amount || 0}</div>
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
                <div style={{ background: "rgba(12,10,8,0.9)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 20, padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, alignItems: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#e8e4dc" }}>Available Parking Spots</div>
                    <button onClick={() => setPage("browse")} style={{ background: "transparent", border: "none", color: "#f97316", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Explore All →</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                    {spots.slice(0, 3).map(spot => (
                      <div key={spot.id} onClick={() => { setChosenSpot(spot); setPage("browse"); }} style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(249,115,22,0.15)", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
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
                            <span style={{ fontWeight: 800, fontSize: 16, color: "#f97316" }}>₹{spot.price_hour || 0}<span style={{ fontSize: 11, color: "#666", fontWeight: 400 }}>/hr</span></span>
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
                    style={{ padding: "8px 18px", borderRadius: 10, border: bookingFilter === f ? "none" : "1px solid rgba(249,115,22,0.15)", background: bookingFilter === f ? "linear-gradient(135deg,#f97316,#ea580c)" : "transparent", color: bookingFilter === f ? "#080808" : "#555", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", textTransform: "capitalize" }}>
                    {f} {f !== "all" && `(${bookings.filter(b => b.status === f).length})`}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                {[
                  { label: "Active", count: bookings.filter(b => b.status === "active").length, color: "#f97316" },
                  { label: "Completed", count: bookings.filter(b => b.status === "completed").length, color: "#4ade80" },
                  { label: "Cancelled", count: bookings.filter(b => b.status === "cancelled").length, color: "#f87171" },
                ].map(s => (
                  <div key={s.label} style={{ background: "rgba(12,10,8,0.9)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 16, padding: "20px 22px" }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: 12, color: "#555", marginTop: 6 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredBookings.map(b => (
                  <div key={b.id} style={{ background: "rgba(12,10,8,0.9)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 18, transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#111318"} onMouseLeave={e => e.currentTarget.style.background = "rgba(12,10,8,0.9)"}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: b.status === "active" ? "rgba(249,115,22,0.1)" : b.status === "completed" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${b.status === "active" ? "rgba(249,115,22,0.2)" : b.status === "completed" ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                      {b.status === "active" ? "⚡" : b.status === "completed" ? "✅" : "❌"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#e8e4dc", marginBottom: 3 }}>{b.spot_name || "Parking Spot"}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>📍 Spot ID: {b.spot_id?.slice(0, 8)}</div>
                      <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>🚗 {b.vehicle_number || ""} · {b.booking_type || ""}</div>
                    </div>
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: "#7a8090", marginBottom: 2 }}>{b.date || b.created_at?.split('T')[0]}</div>
                      <div style={{ fontSize: 11, color: "#666" }}>{b.time || ""}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, minWidth: 80 }}>
                      <div style={{ fontWeight: 800, fontSize: 18, color: "#f97316", marginBottom: 4 }}>₹{b.amount || 0}</div>
                      <StatusBadge s={b.status} />
                    </div>
                    {b.booking_id && <div style={{ flexShrink: 0 }}>
                      <span style={{ background: "#111318", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: "#f97316", letterSpacing: "0.5px" }}>{b.booking_id}</span>
                    </div>}
                  </div>
                ))}
                {filteredBookings.length === 0 && (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#555" }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📅</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#555" }}>No bookings found</div>
                    <button onClick={() => setPage("browse")} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#f97316,#ea580c)", color: "#080808", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Find Parking →</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ BROWSE SPOTS ══ */}
          {page === "browse" && !chosenSpot && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ textAlign: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: "#f97316", textTransform: "uppercase", marginBottom: 8 }}>Find Parking</div>
                <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: "#e8e4dc" }}>Search Available Spots</h2>
                <p style={{ fontSize: 13, color: "#666", marginTop: 8 }}>Select your location, date & time to find the perfect parking spot</p>
              </div>

              {/* ── Main Search & Filter Panel ── */}
              <div style={{ background: "linear-gradient(135deg, rgba(12,10,8,0.9) 0%, #0a1220 100%)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 20, padding: "24px 24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Row 1: Search + Location Input */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1.5, minWidth: 220 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: "1.2px", textTransform: "uppercase", display: "block", marginBottom: 6 }}>🔍 Search</label>
                    <input value={spotSearch} onChange={e => setSpotSearch(e.target.value)}
                      placeholder="Spot name or address..."
                      style={{ width: "100%", background: "#111318", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 10, padding: "12px 14px", color: "#e8e4dc", fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans',sans-serif", outline: "none", transition: "all 0.2s", boxSizing: "border-box" }}
                      onFocus={e => { e.target.style.borderColor = "#f97316"; e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.1)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(249,115,22,0.15)"; e.target.style.boxShadow = ""; }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: "1.2px", textTransform: "uppercase", display: "block", marginBottom: 6 }}>📍 Location</label>
                    <input value={spotLocation} onChange={e => setSpotLocation(e.target.value)}
                      placeholder="Enter city or area..."
                      style={{ width: "100%", background: spotLocation ? "rgba(249,115,22,0.06)" : "#111318", border: spotLocation ? "1px solid rgba(249,115,22,0.3)" : "1px solid rgba(249,115,22,0.15)", borderRadius: 10, padding: "12px 14px", color: "#e8e4dc", fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans',sans-serif", outline: "none", transition: "all 0.2s", boxSizing: "border-box" }}
                      onFocus={e => { e.target.style.borderColor = "#f97316"; e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.1)"; }}
                      onBlur={e => { if (!spotLocation) { e.target.style.borderColor = "rgba(249,115,22,0.15)"; } e.target.style.boxShadow = ""; }} />
                  </div>
                </div>

                {/* Row 2: Date + Time + Type */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: "1.2px", textTransform: "uppercase", display: "block", marginBottom: 6 }}>📅 Date</label>
                    <input value={spotDate} onChange={e => setSpotDate(e.target.value)} type="date"
                      min={new Date().toISOString().split('T')[0]}
                      style={{ width: "100%", background: spotDate ? "rgba(249,115,22,0.06)" : "#111318", border: spotDate ? "1px solid rgba(249,115,22,0.3)" : "1px solid rgba(249,115,22,0.15)", borderRadius: 10, padding: "12px 14px", color: "#e8e4dc", fontSize: 13, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", outline: "none", transition: "all 0.2s", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: "1.2px", textTransform: "uppercase", display: "block", marginBottom: 6 }}>⏰ Arrival Time</label>
                    <input value={spotTime} onChange={e => setSpotTime(e.target.value)} type="time"
                      style={{ width: "100%", background: spotTime ? "rgba(249,115,22,0.06)" : "#111318", border: spotTime ? "1px solid rgba(249,115,22,0.3)" : "1px solid rgba(249,115,22,0.15)", borderRadius: 10, padding: "12px 14px", color: "#e8e4dc", fontSize: 13, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", outline: "none", transition: "all 0.2s", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: "1.2px", textTransform: "uppercase", display: "block", marginBottom: 6 }}>🏗 Parking Type</label>
                    <select value={spotType} onChange={e => setSpotType(e.target.value)}
                      style={{ width: "100%", background: spotType ? "rgba(249,115,22,0.06)" : "#111318", border: spotType ? "1px solid rgba(249,115,22,0.3)" : "1px solid rgba(249,115,22,0.15)", borderRadius: 10, padding: "12px 14px", color: "#e8e4dc", fontSize: 13, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", outline: "none", transition: "all 0.2s", boxSizing: "border-box" }}>
                      <option value="">All Types</option>
                      {spotTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 3: Quick City Buttons + Clear */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {spotCities.length > 0 && (
                    <>
                      <span style={{ fontSize: 10, color: "#555", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginRight: 4 }}>Quick:</span>
                      {spotCities.map(city => (
                        <button key={city} onClick={() => setSpotLocation(spotLocation === city ? "" : city)}
                          style={{ padding: "6px 14px", borderRadius: 20, border: spotLocation === city ? "none" : "1px solid rgba(249,115,22,0.15)", background: spotLocation === city ? "linear-gradient(135deg,#f97316,#ea580c)" : "rgba(249,115,22,0.04)", color: spotLocation === city ? "#080808" : "#555", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s", whiteSpace: "nowrap" }}>
                          📍 {city}
                        </button>
                      ))}
                    </>
                  )}
                  <div style={{ marginLeft: "auto" }}>
                    {(spotSearch || spotLocation || spotDate || spotTime || spotType) && (
                      <button onClick={() => { setSpotSearch(""); setSpotLocation(""); setSpotDate(""); setSpotTime(""); setSpotType(""); }}
                        style={{ padding: "6px 16px", borderRadius: 20, border: "1px solid #f87171", background: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s" }}>
                        ✕ Clear All
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Filters Status */}
              {(spotSearch || spotLocation || spotDate || spotTime || spotType) && (
                <div style={{ background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#7a8a9a", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    🔍 Active Filters:
                    {spotSearch && <span style={{ background: "rgba(249,115,22,0.15)", padding: "3px 10px", borderRadius: 6, color: "#f97316", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>"{spotSearch}"</span>}
                    {spotLocation && <span style={{ background: "rgba(249,115,22,0.15)", padding: "3px 10px", borderRadius: 6, color: "#f97316", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>📍 {spotLocation}</span>}
                    {spotDate && <span style={{ background: "rgba(192,132,252,0.15)", padding: "3px 10px", borderRadius: 6, color: "#c084fc", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>📅 {new Date(spotDate).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</span>}
                    {spotTime && <span style={{ background: "rgba(74,222,128,0.15)", padding: "3px 10px", borderRadius: 6, color: "#4ade80", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>⏰ {spotTime}</span>}
                    {spotType && <span style={{ background: "rgba(247,201,72,0.15)", padding: "3px 10px", borderRadius: 6, color: "#f7c948", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>🏗 {spotType}</span>}
                  </span>
                  <span style={{ marginLeft: "auto", color: "#555", whiteSpace: "nowrap", fontWeight: 600 }}>{filteredSpots.length} spot{filteredSpots.length !== 1 ? "s" : ""} found</span>
                </div>
              )}

              {filteredSpots.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 0", color: "#555" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "#555" }}>
                    {spots.length === 0 ? "No spots available yet" : "No spots match your filters"}
                  </div>
                  <div style={{ fontSize: 13, color: "#555", marginTop: 8, maxWidth: 400, margin: "8px auto 0" }}>
                    {spots.length === 0 ? "Check back soon — land owners are adding spots!" : "Try changing your location, date, or time to find available parking"}
                  </div>
                  {(spotSearch || spotLocation || spotDate || spotTime || spotType) ? (
                    <button onClick={() => { setSpotSearch(""); setSpotLocation(""); setSpotDate(""); setSpotTime(""); setSpotType(""); }}
                      style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#f97316,#ea580c)", color: "#080808", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                      Clear All Filters →
                    </button>
                  ) : null}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
                  {filteredSpots.map(spot => (
                    <div key={spot.id} style={{ background: "rgba(12,10,8,0.9)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 18, overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer" }}
                      onClick={() => setChosenSpot(spot)}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 20px 50px rgba(0,0,0,0.5)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                      <div style={{ height: 170, position: "relative", background: "#111318" }}>
                        {spot.photo ? <img src={spot.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, color: "#2a2d38" }}>🅿</div>}
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(8,10,15,0.7),transparent 50%)" }} />
                        <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(8,10,15,0.7)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#f97316" }}>{spot.type || "Parking"}</div>
                        {/* Time Badge */}
                        <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(8,10,15,0.7)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, color: "#4ade80" }}>⏰ {spot.time_from || "08:00"} – {spot.time_to || "20:00"}</div>
                        <div style={{ position: "absolute", bottom: 12, left: 14 }}>
                          <div style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>{spot.name}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>📍 {spot.address || ""}</div>
                        </div>
                      </div>
                      <div style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <div style={{ display: "flex", gap: 14 }}>
                            <div><span style={{ fontSize: 22, fontWeight: 800, color: "#f97316" }}>₹{spot.price_hour || 0}</span><span style={{ fontSize: 11, color: "#666" }}>/hr</span></div>
                            <div><span style={{ fontSize: 22, fontWeight: 800, color: "#f7c948" }}>₹{spot.price_day || 0}</span><span style={{ fontSize: 11, color: "#666" }}>/day</span></div>
                          </div>
                          <div style={{ fontSize: 11, color: "#f7c948" }}>⭐ {spot.rating || "New"}</div>
                        </div>
                        {/* Availability Days Mini Bar */}
                        <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
                          {DAYS.map((d, i) => (
                            <div key={d} style={{ flex: 1, height: 4, borderRadius: 2, background: (spot.availability || {})[d] !== false ? "#f97316" : "rgba(249,115,22,0.15)", transition: "background 0.2s" }} title={`${DAY_L[i]}: ${(spot.availability || {})[d] !== false ? "Open" : "Closed"}`} />
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={e => { e.stopPropagation(); setChosenSpot(spot); }} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid rgba(249,115,22,0.15)", background: "transparent", color: "#7a8090", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View Details</button>
                          <button onClick={(e) => { e.stopPropagation(); handleBooking(spot); }} style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#f97316,#ea580c)", color: "#080808", fontSize: 12, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px rgba(249,115,22,0.25)" }}>Book Now →</button>
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
              <button onClick={() => setChosenSpot(null)} style={{ background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 22, display: "flex", alignItems: "center", gap: 6, padding: 0 }}>← Back to Spots</button>
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div style={{ borderRadius: 18, overflow: "hidden", height: 260, background: "#111318" }}>
                    {chosenSpot.photo ? <img src={chosenSpot.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, color: "#2a2d38" }}>🅿</div>}
                  </div>
                  <div style={{ background: "rgba(12,10,8,0.9)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 18, padding: 22 }}>
                    <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{chosenSpot.name}</div>
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>📍 {chosenSpot.address || ""}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {(chosenSpot.amenities || []).map(a => <span key={a} style={{ background: "rgba(249,115,22,0.08)", color: "#f97316", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1px solid rgba(249,115,22,0.15)" }}>✓ {a}</span>)}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Per Hour", value: `₹${chosenSpot.price_hour || 0}`, color: "#f97316" },
                      { label: "Per Day", value: `₹${chosenSpot.price_day || 0}`, color: "#f7c948" },
                      { label: "Rating", value: `⭐ ${chosenSpot.rating || "New"}`, color: "#f7c948" },
                      { label: "Slots", value: `${chosenSpot.slots || 0} available`, color: "#4ade80" },
                    ].map(s => (
                      <div key={s.label} style={{ background: "rgba(12,10,8,0.9)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 14, padding: "16px 18px" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "rgba(12,10,8,0.9)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 18, padding: 20 }}>
                    <div style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>Schedule</div>
                    <div style={{ fontSize: 13, color: "#555" }}>⏰ {chosenSpot.time_from || "08:00"} — {chosenSpot.time_to || "20:00"}</div>
                  </div>
                  <button onClick={() => handleBooking(chosenSpot)} style={{ padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#f97316,#ea580c)", color: "#080808", fontWeight: 900, fontSize: 15, cursor: "pointer", boxShadow: "0 6px 28px rgba(249,115,22,0.3)" }}>Reserve This Spot →</button>
                </div>
              </div>
            </div>
          )}

          {/* ══ VEHICLES ══ */}
          {page === "vehicles" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: "100%" }}>
              {/* Header */}
              <div>
                <h2 style={{ margin: 0, fontWeight: 800, fontSize: 28, color: "#e8e4dc", marginBottom: 6 }}>My Vehicles</h2>
                <div style={{ fontSize: 14, color: "#7a8090" }}>{vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} registered</div>
              </div>

              {/* Vehicle List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {vehicles.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(12,10,8,0.9)", border: "2px dashed rgba(249,115,22,0.15)", borderRadius: 18 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🚗</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#555" }}>No vehicles yet</div>
                    <div style={{ fontSize: 13, color: "#555", marginTop: 6 }}>Add your first vehicle to get started</div>
                  </div>
                ) : (
                  vehicles.map(v => {
                    const visual = getVehicleVisual(v.type);
                    return (
                      <div key={v.id} style={{
                        background: "linear-gradient(135deg, rgba(12,10,8,0.9) 0%, rgba(0,0,0,0.6) 100%)",
                        border: v.is_primary ? "2px solid #ff6b00" : "1px solid rgba(249,115,22,0.15)",
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
                            <span style={{ fontWeight: 900, fontSize: 20, color: "#e8e4dc", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{v.vehicle_number}</span>
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
                          <div style={{ fontSize: 13, color: "#7a8a9a", fontFamily: "'DM Sans',sans-serif" }}>
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
                                border: "1px solid rgba(249,115,22,0.15)",
                                background: "rgba(249,115,22,0.05)",
                                color: "#7a8090",
                                fontWeight: 700,
                                fontSize: 13,
                                cursor: vehicleBusyId === v.id ? "not-allowed" : "pointer",
                                opacity: vehicleBusyId === v.id ? 0.5 : 1,
                                transition: "all 0.2s",
                                whiteSpace: "nowrap"
                              }}
                              onMouseEnter={e => { if (!vehicleBusyId) { e.target.style.background = "#f9731620"; e.target.style.borderColor = "#f97316"; e.target.style.color = "#f97316"; } }}
                              onMouseLeave={e => { e.target.style.background = "rgba(249,115,22,0.05)"; e.target.style.borderColor = "rgba(249,115,22,0.15)"; e.target.style.color = "#7a8090"; }}>
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
                <div style={{ background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 13, color: "#7a8a9a", marginBottom: 14 }}>
                    Set <span style={{ fontWeight: 700, color: "#f97316" }}>{primaryConfirmVehicle.vehicle_number}</span> as your primary vehicle?
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={handleConfirmPrimaryChange} style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#f97316,#ea580c)", color: "#080808", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      Yes, Set Primary
                    </button>
                    <button onClick={() => setPrimaryConfirmVehicle(null)} style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(249,115,22,0.15)", background: "transparent", color: "#7a8090", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Add New Vehicle Form */}
              {showVehicleForm && (
                <div style={{ background: "rgba(12,10,8,0.9)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 16, padding: 24 }}>
                  <h3 style={{ margin: "0 0 20px", fontWeight: 800, fontSize: 18, color: "#e8e4dc" }}>Add New Vehicle</h3>
                  <form onSubmit={handleAddVehicle} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Vehicle Number</label>
                        <input type="text" value={vehicleForm.number} onChange={e => handleVehicleInput("number", e.target.value)} placeholder="UP 14 AB 1234" style={{ width: "100%", background: "#111318", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 10, padding: "11px 14px", color: "#e8e4dc", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Vehicle Type</label>
                        <select value={vehicleForm.type} onChange={e => handleVehicleInput("type", e.target.value)} style={{ width: "100%", background: "#111318", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 10, padding: "11px 14px", color: "#e8e4dc", fontSize: 13, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", outline: "none" }}>
                          <option value="Car">Car</option>
                          <option value="Bike">Bike</option>
                          <option value="Scooter">Scooter</option>
                          <option value="Truck">Truck</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Brand & Model</label>
                        <input type="text" value={vehicleForm.model} onChange={e => handleVehicleInput("model", e.target.value)} placeholder="Maruti Swift" style={{ width: "100%", background: "#111318", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 10, padding: "11px 14px", color: "#e8e4dc", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Color</label>
                        <input type="text" value={vehicleForm.color} onChange={e => handleVehicleInput("color", e.target.value)} placeholder="White" style={{ width: "100%", background: "#111318", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 10, padding: "11px 14px", color: "#e8e4dc", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
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
                      <button type="button" onClick={handleVehicleCancel} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid rgba(249,115,22,0.15)", background: "transparent", color: "#7a8090", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
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
                <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg,#f97316,#ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 26, color: "#080808", flexShrink: 0 }}>
                  {profile.photo_url ? <img src={profile.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : userAvatar}
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#e8e4dc", marginBottom: 4 }}>{userName}</div>
                  <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>{profile.city && profile.state ? `${profile.city}, ${profile.state}` : "Parking User"}</div>
                  <span style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>✓ {profile.role === 'user' ? 'Verified User' : profile.role}</span>
                </div>
              </div>
              <div style={{ background: "rgba(12,10,8,0.9)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 20, padding: 28 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#e8e4dc", marginBottom: 22 }}>Account Details</div>
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
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>{f.label}</label>
                      <input defaultValue={profile[f.key] || ""} style={{ width: "100%", background: "#111318", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 10, padding: "11px 14px", color: "#e8e4dc", fontSize: 14, fontFamily: "'DM Sans',sans-serif" }} readOnly />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "rgba(12,10,8,0.9)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 20, padding: 24 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#e8e4dc", marginBottom: 16 }}>Activity Summary</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { l: "Total Bookings", v: bookings.length },
                    { l: "Total Spent", v: `₹${totalSpent.toLocaleString("en-IN")}` },
                    { l: "Vehicles", v: vehicles.length },
                    { l: "Active Now", v: activeBookings },
                  ].map(r => (
                    <div key={r.l} style={{ background: "#111318", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(249,115,22,0.15)" }}>
                      <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>{r.l}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#f97316" }}>{r.v}</div>
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
    active: { color: "#f97316", bg: "rgba(249,115,22,0.1)", dot: "#f97316" },
    completed: { color: "#4ade80", bg: "rgba(74,222,128,0.1)", dot: "#4ade80" },
    cancelled: { color: "#f87171", bg: "rgba(248,113,113,0.1)", dot: "#f87171" },
  }[s] || { color: "#888", bg: "rgba(249,115,22,0.15)", dot: "#555" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: m.bg, color: m.color }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.dot, display: "inline-block" }} />
      {(s || "").charAt(0).toUpperCase() + (s || "").slice(1)}
    </span>
  );
}
