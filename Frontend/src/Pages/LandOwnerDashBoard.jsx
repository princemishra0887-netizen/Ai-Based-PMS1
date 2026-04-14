import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { fetchProfileByUser, getDashboardRouteForRole } from "../lib/profileHelpers";

/* ── Fonts ── */
const fl = document.createElement("link");
fl.rel = "stylesheet";
fl.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Bebas+Neue&display=swap";
document.head.appendChild(fl);

const css = document.createElement("style");
css.textContent = `
  *{box-sizing:border-box;margin:0;padding:0}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:#080808}
  ::-webkit-scrollbar-thumb{background:rgba(249,115,22,0.2);border-radius:4px}
  @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .nav-link{transition:all 0.18s ease;cursor:pointer}
  .nav-link:hover{background:rgba(249,115,22,0.06) !important;color:#f97316 !important}
  .nav-link.active{background:rgba(249,115,22,0.1) !important;color:#f97316 !important;box-shadow:inset 0 0 0 1px rgba(249,115,22,0.2) !important}
  .card-hover{transition:transform 0.22s ease,box-shadow 0.22s ease}
  .card-hover:hover{transform:translateY(-3px);box-shadow:0 20px 60px rgba(0,0,0,0.6) !important}
  .row-hover:hover{background:rgba(249,115,22,0.03) !important}
  .btn-ghost:hover{background:rgba(249,115,22,0.06) !important}
  .toggle-day{transition:all 0.15s ease;cursor:pointer}
  .toggle-day:hover{opacity:0.85}
  input:focus,select:focus,textarea:focus{outline:none;border-color:#f97316 !important;box-shadow:0 0 0 3px rgba(249,115,22,0.15) !important}
  input[type="date"]::-webkit-calendar-picker-indicator,input[type="time"]::-webkit-calendar-picker-indicator{filter:invert(1) opacity(0.4)}
`;
document.head.appendChild(css);

/* ── Data (demo spots/bookings – owner comes from Supabase) ──  */


const EARN_MONTHLY = [
  {month:"Oct",earn:4200},{month:"Nov",earn:6800},{month:"Dec",earn:8100},
  {month:"Jan",earn:7400},{month:"Feb",earn:9600},{month:"Mar",earn:9200},
];

const DAYS=["mon","tue","wed","thu","fri","sat","sun"];
const DAY_L=["Mo","Tu","We","Th","Fr","Sa","Su"];
const TYPE_META={"Open Air":{color:"#f97316",bg:"rgba(249,115,22,0.08)",icon:"☀️"},"Covered":{color:"#c084fc",bg:"rgba(192,132,252,0.08)",icon:"🏗"},"Basement":{color:"#f7c948",bg:"rgba(247,201,72,0.08)",icon:"⬇️"}};
const STATUS_META={active:{color:"#4ade80",bg:"rgba(74,222,128,0.08)",dot:"#4ade80"},pending:{color:"#f97316",bg:"rgba(249,115,22,0.1)",dot:"#f97316"},inactive:{color:"#555",bg:"rgba(255,255,255,0.05)",dot:"#444"},completed:{color:"#f97316",bg:"rgba(249,115,22,0.1)",dot:"#f97316"},cancelled:{color:"#f87171",bg:"rgba(248,113,113,0.1)",dot:"#f87171"}};

const fmt = n=>`₹${Number(n).toLocaleString("en-IN")}`;
function Badge({s}){ const m=STATUS_META[s]||{color:"#555",bg:"rgba(255,255,255,0.05)",dot:"#444"}; return <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:m.bg,color:m.color}}><span style={{width:6,height:6,borderRadius:"50%",background:m.dot,display:"inline-block"}}/>{s.charAt(0).toUpperCase()+s.slice(1)}</span>; }

/* ── Mini Earnings Chart ── */
function EarnChart({data}){
  const max=Math.max(...data.map(d=>d.earn));
  return(
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:80}}>
      {data.map((d,i)=>(
        <div key={d.month} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{width:"100%",borderRadius:"4px 4px 0 0",
            background:i===data.length-1?"linear-gradient(to top,#f97316,#ea580c)":"rgba(255,255,255,0.06)",
            height:`${Math.max(6,(d.earn/max)*70)}px`,transition:"height 0.8s ease"}}/>
          <div style={{fontSize:9,color:"#555",fontWeight:600}}>{d.month}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Input Style ── */
const inp = (ex={})=>({width:"100%",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:10,padding:"11px 14px",color:"#e8e4dc",fontSize:14,fontFamily:"'DM Sans',sans-serif",transition:"border-color 0.2s,box-shadow 0.2s",...ex});

const BLANK_SPOT={name:"",type:"Open Air",address:"",priceHour:"",priceDay:"",timeFrom:"08:00",timeTo:"20:00",status:"active",availability:{mon:true,tue:true,wed:true,thu:true,fri:true,sat:false,sun:false},amenities:[],slots:1};
const AMENITY_OPTS=["CCTV","Lighting","Covered Roof","Security Guard","EV Charging","Wide Gate","24/7 Access","Wheelchair Access"];

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
export default function LandOwnerDashBoard(){
    // Approve/Reject handlers for pending requests
    async function handleApproveRequest(bookingId) {
      const { error } = await supabase.from('bookings').update({ status: 'active' }).eq('id', bookingId);
      if (!error) {
        setBookings(bookings => bookings.map(b => b.id === bookingId ? { ...b, status: 'active' } : b));
      } else {
        alert('Failed to approve request.');
      }
    }

    async function handleRejectRequest(bookingId) {
      const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
      if (!error) {
        setBookings(bookings => bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
      } else {
        alert('Failed to reject request.');
      }
    }
  const navigate = useNavigate();
  const [page,setPage]=useState("overview");
  const [spots,setSpots]=useState([]);
  const [bookings, setBookings]=useState([]);
  const [sideOpen,setSideOpen]=useState(true);
  const [showAddSpot,setShowAddSpot]=useState(false);
  const [editSpot,setEditSpot]=useState(null);
  const [form,setForm]=useState(BLANK_SPOT);
  const [saved,setSaved]=useState(false);
  const [detailSpot,setDetailSpot]=useState(null);
  const [time,setTime]=useState(new Date());
  const [notifOpen,setNotifOpen]=useState(false);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);

  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t);},[]);

  // Fetch profile, spots, and bookings from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) { navigate("/auth/login"); return; }
        
        const { profile: prof } = await fetchProfileByUser(user);
        if (prof) {
          setOwnerProfile(prof);
        }

        // 2. Fetch Owner's Spots
        const { data: sp } = await supabase
          .from('spots')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });
        setSpots(sp || []);

        // 3. Fetch Bookings for Owner's Spots
        const { data: bk } = await supabase
          .from('bookings')
          .select('*, spots!inner(*)')
          .eq('spots.owner_id', user.id)
          .order('created_at', { ascending: false });
        setBookings(bk || []);

      } catch (err) { console.warn("Owner data fetch error:", err.message); }
      finally { setDashLoading(false); }
    }
    fetchData();
  }, [navigate]);

  // Build OWNER from Supabase profile
  const OWNER = ownerProfile ? {
    name: `${ownerProfile.first_name || ''} ${ownerProfile.last_name || ''}`.trim() || 'Owner',
    area: ownerProfile.city && ownerProfile.state ? `${ownerProfile.city}, ${ownerProfile.state}` : '',
    phone: ownerProfile.phone || '', email: ownerProfile.email || '',
    joined: ownerProfile.created_at ? new Date(ownerProfile.created_at).toLocaleDateString('en-IN',{month:'short',year:'numeric'}) : '',
    verified: true,
    avatar: `${(ownerProfile.first_name?.[0]||'O')}${(ownerProfile.last_name?.[0]||'')}`,
  } : { name:"Owner", area:"", phone:"", email:"", joined:"", verified:false, avatar:"O" };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user"); localStorage.removeItem("userRole");
    navigate("/auth/login");
  };

  if (dashLoading) return (
    <div style={{display:"flex",minHeight:"100vh",background:"#080808",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:48,height:48,borderRadius:"50%",border:"3px solid rgba(249,115,22,0.2)",borderTopColor:"#f97316",animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}}/>
        <div style={{color:"#555",fontSize:14}}>Loading dashboard...</div>
      </div>
    </div>
  );

  async function saveSpot(){
    if(!form.name||!form.priceHour) return;
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return;

    const spotData = {
      owner_id: user.id,
      name: form.name,
      type: form.type,
      address: form.address,
      price_hour: Number(form.priceHour),
      price_day: Number(form.priceDay),
      status: form.status,
      availability: form.availability,
      time_from: form.timeFrom,
      time_to: form.timeTo,
      amenities: form.amenities,
      total_slots: Number(form.slots),
      available_slots: Number(form.slots)
    };

    let error;
    if(editSpot) {
      const { error: err } = await supabase.from('spots').update(spotData).eq('id', editSpot);
      error = err;
    } else {
      const { error: err } = await supabase.from('spots').insert([spotData]);
      error = err;
    }

    if(!error) {
      setSaved(true); 
      setTimeout(()=>{
        setSaved(false);
        setShowAddSpot(false);
        setEditSpot(null);
        window.location.reload(); 
      },1400);
    } else {
      alert("Error saving spot: " + error.message);
    }
  }

  const totalRev = spots.reduce((a, s) => a + (s.revenue || 0), 0);
  const totalBookings = spots.reduce((a, s) => a + (s.bookings || 0), 0);
  const activeBookings = bookings.filter(b => b.status === "active").length;

  function openAdd(){ setForm(BLANK_SPOT); setEditSpot(null); setShowAddSpot(true); }
  function openEdit(spot){ 
    setForm({
      ...spot,
      priceHour: spot.price_hour,
      priceDay: spot.price_day,
      timeFrom: spot.time_from,
      timeTo: spot.time_to,
      slots: spot.total_slots
    }); 
    setEditSpot(spot.id); 
    setShowAddSpot(true); 
  }

  async function toggleSpotStatus(id, currentStatus){
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const { error } = await supabase.from('spots').update({ status: newStatus }).eq('id', id);
    if(!error) {
      setSpots(spots.map(s => s.id === id ? { ...s, status: newStatus } : s));
    }
  }

  async function removeSpot(id){
    if(!window.confirm("Delete this spot permanently?")) return;
    const { error } = await supabase.from('spots').delete().eq('id', id);
    if(!error) {
      setSpots(spots.filter(s => s.id !== id));
      setDetailSpot(null);
    }
  }
  function toggleAmenity(a){setForm(f=>({...f,amenities:f.amenities.includes(a)?f.amenities.filter(x=>x!==a):[...f.amenities,a]}));}

  const NAV=[
    {key:"overview",icon:"⊞",label:"Overview"},
    {key:"spots",icon:"⊟",label:"My Spots"},
    {key:"bookings",icon:"📅",label:"Bookings"},
    {key:"earnings",icon:"💰",label:"Earnings"},
    {key:"profile",icon:"👤",label:"Profile"},
  ];

  const SW=sideOpen?230:68;

  return(
    <div style={{display:"flex",minHeight:"100vh",background:"#080808",fontFamily:"'DM Sans',sans-serif",color:"#e8e4dc"}}>

      {/* ══ SIDEBAR ══ */}
      <aside style={{width:SW,minHeight:"100vh",background:"rgba(0,0,0,0.6)",borderRight:"1px solid rgba(249,115,22,0.1)",display:"flex",flexDirection:"column",transition:"width 0.25s ease",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto",overflowX:"hidden"}}>
        {/* Logo */}
        <div style={{padding:"22px 16px 18px",borderBottom:"1px solid rgba(249,115,22,0.1)",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setSideOpen(!sideOpen)}>
          <div style={{width:38,height:38,borderRadius:11,flexShrink:0,background:"linear-gradient(135deg,#f97316,#ea580c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 4px 16px rgba(249,115,22,0.4)"}}>🅿</div>
          {sideOpen&&<div><div style={{fontFamily:"'Bebas Neue',cursive",fontWeight:400,fontSize:20,letterSpacing:"1.5px",color:"#e8e4dc",lineHeight:1.1}}>ParkEase</div><div style={{fontSize:10,color:"#555",letterSpacing:"1.5px",textTransform:"uppercase",marginTop:2}}>Owner Portal</div></div>}
        </div>

        {/* Owner pill */}
        {sideOpen&&<div style={{margin:"16px 14px 8px",background:"rgba(249,115,22,0.05)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#f97316,#ea580c)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:"#fff",flexShrink:0}}>{OWNER.avatar}</div>
          <div style={{minWidth:0}}>
            <div style={{fontWeight:700,fontSize:12,color:"#e8e4dc",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{OWNER.name}</div>
            <div style={{fontSize:10,color:"#666",marginTop:1}}>{OWNER.area}</div>
          </div>
          {OWNER.verified&&<span style={{fontSize:14,marginLeft:"auto",flexShrink:0}}>✅</span>}
        </div>}

        {/* Nav */}
        <nav style={{flex:1,padding:"8px 10px",display:"flex",flexDirection:"column",gap:2}}>
          {NAV.map(n=>(
            <button key={n.key} className={`nav-link${page===n.key?" active":""}`}
              onClick={()=>{setPage(n.key); setShowAddSpot(false); setDetailSpot(null);}}
              style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:sideOpen?"11px 14px":"11px 0",justifyContent:sideOpen?"flex-start":"center",borderRadius:11,border:"none",cursor:"pointer",textAlign:"left",background:"transparent",color:page===n.key?"#f97316":"#555",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,whiteSpace:"nowrap"}}>
              <span style={{fontSize:17,flexShrink:0}}>{n.icon}</span>
              {sideOpen&&<span>{n.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        {sideOpen&&<div style={{padding:"14px 16px",borderTop:"1px solid rgba(249,115,22,0.1)",display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={handleLogout} style={{width:"100%",padding:"10px",borderRadius:11,border:"1px solid rgba(239,68,68,0.2)",background:"rgba(239,68,68,0.05)",color:"#f87171",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>🚪 Logout</button>
          <div style={{background:"rgba(249,115,22,0.05)",borderRadius:12,padding:"12px 14px",border:"1px solid rgba(249,115,22,0.15)"}}>
            <div style={{fontSize:11,color:"#f97316",fontWeight:700,marginBottom:4}}>Need Help?</div>
            <div style={{fontSize:11,color:"#555",lineHeight:1.6}}>Contact support at help@parkease.in</div>
          </div>
        </div>}
      </aside>

      {/* ══ MAIN AREA ══ */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"auto"}}>

        {/* ── Top Bar ── */}
        <header style={{background:"rgba(8,8,8,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(249,115,22,0.1)",padding:"0 28px",height:62,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
          <div>
            <span style={{fontFamily:"'Bebas Neue',cursive",fontWeight:400,fontSize:20,letterSpacing:"1px",color:"#e8e4dc",textTransform:"capitalize"}}>{showAddSpot?(editSpot?"Edit Spot":"Add New Spot"):detailSpot?"Spot Details":page}</span>
            {!showAddSpot&&!detailSpot&&<span style={{color:"#555",fontSize:13,marginLeft:8,fontFamily:"'DM Sans',sans-serif"}}>/ {OWNER.name}</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{fontSize:12,color:"#555",fontWeight:500}}>{time.toLocaleTimeString("en-IN")}</div>
            {activeBookings>0&&<div style={{position:"relative",cursor:"pointer"}} onClick={()=>setNotifOpen(!notifOpen)}>
              <div style={{width:36,height:36,borderRadius:11,background:"rgba(249,115,22,0.1)",border:"1px solid rgba(249,115,22,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🔔</div>
              <div style={{position:"absolute",top:-3,right:-3,width:16,height:16,borderRadius:"50%",background:"#f97316",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff"}}>{activeBookings}</div>
              {notifOpen&&<div style={{position:"absolute",top:44,right:0,width:260,background:"rgba(12,10,8,0.98)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:14,boxShadow:"0 12px 36px rgba(0,0,0,0.7)",zIndex:300,overflow:"hidden",backdropFilter:"blur(12px)"}}>
                <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(249,115,22,0.1)",fontWeight:700,fontSize:13,color:"#e8e4dc"}}>Active Bookings</div>
                {bookings.filter(b=>b.status==="active").map(b=>(
                  <div key={b.id} style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                    <div style={{fontWeight:600,fontSize:12,color:"#e8e4dc"}}>{b.user} · {b.spot}</div>
                    <div style={{fontSize:11,color:"#555",marginTop:3}}>{b.date} · {b.time}</div>
                  </div>
                ))}
              </div>}
            </div>}
            {page==="spots"&&!showAddSpot&&!detailSpot&&spots.length<3&&(
              <button onClick={openAdd} style={{background:"linear-gradient(135deg,#f97316,#ea580c)",color:"#fff",border:"none",borderRadius:11,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 4px 14px rgba(249,115,22,0.35)"}}>+ Add Spot</button>
            )}
          </div>
        </header>

        <main style={{flex:1,padding:"28px",animation:"slideUp 0.35s ease"}}>

          {/* ══ PENDING PARKING REQUESTS SECTION ══ */}
          {page === "bookings" && bookings.filter(b => b.status === "pending").length > 0 && (
            <div style={{marginBottom:32}}>
              <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,fontWeight:800,color:"#ea580c",marginBottom:14}}>Pending Parking Requests</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:18}}>
                {bookings.filter(b => b.status === "pending").map(b => (
                  <div key={b.id} style={{background:"rgba(249,115,22,0.08)",border:"1px solid rgba(249,115,22,0.2)",borderRadius:14,padding:18,minWidth:260,boxShadow:"0 2px 8px rgba(160,120,64,0.07)"}}>
                    <div style={{fontWeight:700,fontSize:15,color:"#f97316",marginBottom:6}}>{b.user_name || "User"}</div>
                    <div style={{fontSize:13,color:"#777",marginBottom:4}}><b>Vehicle:</b> {b.vehicle_number || "-"}</div>
                    <div style={{fontSize:13,color:"#777",marginBottom:4}}><b>Vehicle Type:</b> {b.vehicle_type || "-"}</div>
                    <div style={{fontSize:13,color:"#777",marginBottom:4}}><b>Spot ID:</b> {b.spot_id?.slice(0,8) || "-"}</div>
                    <div style={{fontSize:12,color:"#ea580c",marginTop:8}}><b>Date:</b> {b.booking_date} <b>Time:</b> {b.start_time?.slice(0,5) || "-"}</div>
                    <div style={{display:"flex",gap:10,marginTop:14}}>
                      <button onClick={()=>handleApproveRequest(b.id)} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",background:"linear-gradient(135deg,#1a6e42,#4ade80)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>Approve</button>
                      <button onClick={()=>handleRejectRequest(b.id)} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",background:"linear-gradient(135deg,#b91c1c,#f87171)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ OVERVIEW ══ */}
          {page==="overview"&&!showAddSpot&&!detailSpot&&(
            <div style={{display:"flex",flexDirection:"column",gap:24}}>
              {/* Welcome */}
              <div style={{background:"linear-gradient(135deg,rgba(12,10,8,0.9),rgba(249,115,22,0.05))",borderRadius:22,padding:"32px 36px",display:"flex",justifyContent:"space-between",alignItems:"center",overflow:"hidden",position:"relative"}}>
                <div style={{position:"absolute",right:-40,top:-40,width:200,height:200,borderRadius:"50%",background:"rgba(249,115,22,0.08)"}}/>
                <div style={{position:"absolute",right:80,bottom:-60,width:160,height:160,borderRadius:"50%",background:"rgba(249,115,22,0.05)"}}/>
                <div>
                  <div style={{fontSize:12,color:"#f97316",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:10}}>Welcome Back</div>
                  <h1 style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,fontWeight:900,color:"#e8e4dc",margin:"0 0 8px",letterSpacing:"-0.5px"}}>{OWNER.name}</h1>
                  <div style={{fontSize:13,color:"#777"}}>📍 {OWNER.area} · Member since {OWNER.joined}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,color:"#777",marginBottom:4}}>Total Earnings</div>
                  <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:38,fontWeight:900,color:"#f97316",lineHeight:1}}>{fmt(totalRev)}</div>
                  <div style={{fontSize:12,color:"#6a5030",marginTop:6}}>{totalBookings} total bookings</div>
                </div>
              </div>

              {/* KPI cards */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
                {[
                  {label:"Total Spots",value:spots.length,sub:`${spots.filter(s=>s.status==="active").length} active`,icon:"🗺",color:"#f97316",bg:"#fdf6e8"},
                  {label:"This Month",value:fmt(EARN_MONTHLY[EARN_MONTHLY.length-1].earn),sub:"March 2025",icon:"📈",color:"#1a6e42",bg:"#e8f8ee"},
                  {label:"Live Bookings",value:activeBookings,sub:"Right now",icon:"⚡",color:"#1a5a8a",bg:"#e8f2fb"},
                  {label:"Avg. Rating",value:spots.length?((spots.reduce((a,s)=>a+s.rating,0)/spots.length).toFixed(1)):"—",sub:"Across all spots",icon:"⭐",color:"#8a4a00",bg:"#fff4e0"},
                ].map((k,i)=>(
                  <div key={k.label} className="card-hover" style={{background:"rgba(12,10,8,0.9)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:18,padding:"22px 22px 18px",animationDelay:`${i*0.07}s`,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                    <div style={{width:40,height:40,borderRadius:12,background:k.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:14}}>{k.icon}</div>
                    <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:26,fontWeight:700,color:k.color,lineHeight:1}}>{k.value}</div>
                    <div style={{fontSize:12,color:"#666",margin:"6px 0 0"}}>{k.label}</div>
                    <div style={{fontSize:11,color:"#777",marginTop:3}}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Spots + Earnings row */}
              <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:20}}>
                {/* Spot cards */}
                <div style={{background:"rgba(12,10,8,0.9)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:20,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                    <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:16,fontWeight:700,color:"#e8e4dc"}}>My Spots</div>
                    <button onClick={()=>setPage("spots")} style={{background:"transparent",border:"none",color:"#ea580c",fontSize:12,fontWeight:700,cursor:"pointer"}}>Manage All →</button>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    {spots.map(spot=>(
                      <div key={spot.id} className="card-hover" style={{display:"flex",gap:14,alignItems:"center",padding:"14px",background:"rgba(255,255,255,0.02)",borderRadius:14,border:"1px solid rgba(249,115,22,0.15)",cursor:"pointer"}} onClick={()=>{setDetailSpot(spot);setPage("spots");}}>
                        <div style={{width:52,height:52,borderRadius:12,overflow:"hidden",flexShrink:0,background:"rgba(255,255,255,0.04)"}}>
                          {spot.photo?<img src={spot.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🅿</div>}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:13,color:"#e8e4dc",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{spot.name}</div>
                          <div style={{fontSize:11,color:"#666",marginTop:2}}>{spot.type} · ₹{spot.priceHour}/hr</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:15,fontWeight:700,color:"#f97316"}}>{fmt(spot.revenue)}</div>
                          <div style={{fontSize:10,color:"#777",marginTop:2}}>{spot.bookings} bookings</div>
                        </div>
                        <Badge s={spot.status}/>
                      </div>
                    ))}
                    {spots.length<3&&<div onClick={()=>{setPage("spots");openAdd();}} style={{border:"2px dashed rgba(249,115,22,0.3)",borderRadius:14,padding:"18px",textAlign:"center",cursor:"pointer",color:"#777",fontSize:13,fontWeight:600,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#a07840";e.currentTarget.style.color="#a07840"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(249,115,22,0.3)";e.currentTarget.style.color="#c8b89a"}}>
                      + Add New Spot ({3-spots.length} slot{3-spots.length!==1?"s":""} left)
                    </div>}
                  </div>
                </div>

                {/* Earnings chart + recent */}
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  <div style={{background:"rgba(12,10,8,0.9)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:20,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.04)",flex:1}}>
                    <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:15,fontWeight:700,color:"#e8e4dc",marginBottom:4}}>Earnings Trend</div>
                    <div style={{fontSize:11,color:"#777",marginBottom:18}}>Last 6 months</div>
                    <EarnChart data={EARN_MONTHLY}/>
                  </div>
                  <div style={{background:"linear-gradient(135deg,#f0e8d8,#fdf6e8)",border:"1px solid #e0d0b0",borderRadius:20,padding:22,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                    <div style={{fontSize:11,color:"#ea580c",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Commission Info</div>
                    <div style={{fontSize:13,color:"#5a3c18",lineHeight:1.7}}>ParkEase takes a <strong>10% platform fee</strong>. You keep 90% of every booking.</div>
                    <div style={{display:"flex",gap:16,marginTop:14}}>
                      <div><div style={{fontFamily:"'Bebas Neue',cursive",fontSize:20,fontWeight:700,color:"#f97316"}}>{fmt(totalRev*0.9)}</div><div style={{fontSize:11,color:"#666"}}>Your share</div></div>
                      <div><div style={{fontFamily:"'Bebas Neue',cursive",fontSize:20,fontWeight:700,color:"#f97316"}}>{fmt(totalRev*0.1)}</div><div style={{fontSize:11,color:"#666"}}>Platform fee</div></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent bookings */}
              <div style={{background:"rgba(12,10,8,0.9)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:20,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:18,alignItems:"center"}}>
                  <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:16,fontWeight:700,color:"#e8e4dc"}}>Recent Bookings</div>
                  <button onClick={()=>setPage("bookings")} style={{background:"transparent",border:"none",color:"#ea580c",fontSize:12,fontWeight:700,cursor:"pointer"}}>View All →</button>
                </div>
                <BookingsTable bookings={bookings.slice(0,4)}/>
              </div>
            </div>
          )}

          {/* ══ SPOTS ══ */}
          {page==="spots"&&!showAddSpot&&!detailSpot&&(
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:20}}>
                {spots.map((spot,i)=>(
                  <div key={spot.id} className="card-hover" style={{background:"rgba(12,10,8,0.9)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:20,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.05)",animation:`slideUp 0.35s ease ${i*0.07}s both`}}>
                    <div style={{height:170,position:"relative",overflow:"hidden",cursor:"pointer"}} onClick={()=>setDetailSpot(spot)}>
                      {spot.photo?<img src={spot.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{height:"100%",background:"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,color:"#444"}}>🅿</div>}
                      <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(28,20,10,0.6),transparent 50%)"}}/>
                      <div style={{position:"absolute",top:12,left:12,background:TYPE_META[spot.type]?.bg||"#fff",color:TYPE_META[spot.type]?.color||"#888",padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:700}}>{spot.type}</div>
                      <div style={{position:"absolute",top:12,right:12}}><Badge s={spot.status}/></div>
                      <div style={{position:"absolute",bottom:12,left:14,right:14}}>
                        <div style={{fontWeight:800,fontSize:16,color:"#fff",letterSpacing:"-0.2px"}}>{spot.name}</div>
                        <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginTop:2}}>📍 {spot.address}</div>
                      </div>
                    </div>
                    <div style={{padding:"18px 18px 14px"}}>
                      <div style={{display:"flex",gap:20,marginBottom:14}}>
                        <div><div style={{fontFamily:"'Bebas Neue',cursive",fontSize:22,fontWeight:700,color:"#f97316"}}>₹{spot.priceHour}<span style={{fontSize:11,color:"#777",fontFamily:"'DM Sans',sans-serif",fontWeight:400}}>/hr</span></div></div>
                        <div><div style={{fontFamily:"'Bebas Neue',cursive",fontSize:22,fontWeight:700,color:"#1a6e42"}}>{fmt(spot.revenue)}</div><div style={{fontSize:10,color:"#777"}}>earned</div></div>
                        <div><div style={{fontFamily:"'Bebas Neue',cursive",fontSize:22,fontWeight:700,color:"#1a5a8a"}}>{spot.bookings}</div><div style={{fontSize:10,color:"#777"}}>bookings</div></div>
                      </div>
                      <div style={{display:"flex",gap:4,marginBottom:14}}>
                        {DAYS.map((d,i)=>(
                          <div key={d} style={{flex:1,height:22,borderRadius:5,background:spot.availability[d]?"#f0e8d8":"#f7f5f0",border:`1px solid ${spot.availability[d]?"#c8a060":"#ede5d8"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:spot.availability[d]?"#7a5c30":"#d4c4b0"}}>{DAY_L[i]}</div>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>setDetailSpot(spot)} style={{flex:1,padding:"9px",borderRadius:9,border:"1px solid #e0d0b0",background:"transparent",color:"#f97316",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>View</button>
                        <button onClick={()=>openEdit(spot)} style={{flex:1,padding:"9px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#f97316,#ea580c)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Edit</button>
                        <button onClick={()=>toggleSpotStatus(spot.id, spot.status)} style={{flex:1,padding:"9px",borderRadius:9,border:`1px solid ${spot.status==="active"?"#f8a0a0":"#90d0a8"}`,background:"transparent",color:spot.status==="active"?"#c04040":"#1a6e42",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{spot.status==="active"?"Pause":"Activate"}</button>
                      </div>
                    </div>
                  </div>
                ))}
                {spots.length<3&&<div onClick={openAdd} style={{border:"2px dashed rgba(249,115,22,0.3)",borderRadius:20,minHeight:240,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#777",gap:10,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#a07840";e.currentTarget.style.color="#a07840"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(249,115,22,0.3)";e.currentTarget.style.color="#c8b89a"}}>
                  <div style={{fontSize:36}}>＋</div>
                  <div style={{fontWeight:700,fontSize:14}}>Add New Spot</div>
                  <div style={{fontSize:12}}>{3-spots.length} slot{3-spots.length!==1?"s":""} remaining</div>
                </div>}
              </div>
            </div>
          )}

          {/* ── SPOT DETAIL ── */}
          {page==="spots"&&detailSpot&&!showAddSpot&&(()=>{
            const spot=spots.find(s=>s.id===detailSpot.id)||detailSpot;
            const spotBookings=bookings.filter(b=>b.spotId===spot.id);
            return(
              <div style={{animation:"slideUp 0.3s ease"}}>
                <button onClick={()=>setDetailSpot(null)} style={{background:"transparent",border:"none",color:"#666",cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:22,display:"flex",alignItems:"center",gap:6,padding:0}}>← Back to Spots</button>
                <div style={{display:"grid",gridTemplateColumns:"1.1fr 1fr",gap:24}}>
                  <div style={{display:"flex",flexDirection:"column",gap:18}}>
                    <div style={{borderRadius:20,overflow:"hidden",height:260,background:"rgba(255,255,255,0.04)"}}>
                      {spot.photo?<img src={spot.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:60,color:"#444"}}>🅿</div>}
                    </div>
                    <div style={{background:"rgba(12,10,8,0.9)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:18,padding:22}}>
                      <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,fontWeight:700,marginBottom:4}}>{spot.name}</div>
                      <div style={{fontSize:12,color:"#666",marginBottom:16}}>📍 {spot.address}</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                        {(spot.amenities||[]).map(a=><span key={a} style={{background:"rgba(255,255,255,0.04)",color:"#f97316",padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:600}}>✓ {a}</span>)}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10}}>
                      <button onClick={()=>openEdit(spot)} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#f97316,#ea580c)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>✏️ Edit Spot</button>
                      <button onClick={()=>toggleSpotStatus(spot.id, spot.status)} style={{flex:1,padding:"12px",borderRadius:12,border:`1px solid ${spot.status==="active"?"#f0a090":"#90d0a8"}`,background:"transparent",color:spot.status==="active"?"#c04040":"#1a6e42",fontWeight:700,fontSize:13,cursor:"pointer"}}>{spot.status==="active"?"⏸ Pause":"▶ Activate"}</button>
                      <button onClick={()=>removeSpot(spot.id)} style={{padding:"12px 16px",borderRadius:12,border:"1px solid #f0a090",background:"transparent",color:"#c04040",fontSize:13,cursor:"pointer"}}>🗑</button>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:16}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      {[{label:"Revenue",value:fmt(spot.revenue),color:"#f97316"},{label:"Bookings",value:spot.bookings,color:"#1a5a8a"},{label:"Rating",value:`⭐ ${spot.rating}`,color:"#8a4a00"},{label:"Reviews",value:spot.reviews,color:"#1a6e42"}].map(s=>(
                        <div key={s.label} style={{background:"rgba(12,10,8,0.9)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:14,padding:"16px 18px"}}>
                          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:22,fontWeight:700,color:s.color}}>{s.value}</div>
                          <div style={{fontSize:11,color:"#777",marginTop:4}}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{background:"rgba(12,10,8,0.9)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:18,padding:20}}>
                      <div style={{fontSize:11,color:"#666",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:12}}>Schedule</div>
                      <div style={{display:"flex",gap:5,marginBottom:12}}>
                        {DAYS.map((d,i)=><div key={d} style={{flex:1,height:32,borderRadius:8,background:spot.availability[d]?"#f0e8d8":"#f7f5f0",border:`1px solid ${spot.availability[d]?"#c8a060":"#ede5d8"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:spot.availability[d]?"#7a5c30":"#d4c4b0"}}>{DAY_L[i]}</div>)}
                      </div>
                      <div style={{fontSize:13,color:"#8a7060"}}>⏰ {spot.timeFrom} — {spot.timeTo}</div>
                    </div>
                    <div style={{background:"rgba(12,10,8,0.9)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:18,padding:20}}>
                      <div style={{fontSize:11,color:"#666",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:14}}>Bookings for this Spot</div>
                      {spotBookings.length===0?<div style={{fontSize:13,color:"#777"}}>No bookings yet</div>:<BookingsTable bookings={spotBookings.slice(0,3)}/>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── ADD/EDIT SPOT FORM ── */}
          {showAddSpot&&(
            <div style={{maxWidth:640,animation:"slideUp 0.3s ease"}}>
              <button onClick={()=>setShowAddSpot(false)} style={{background:"transparent",border:"none",color:"#666",cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:24,display:"flex",alignItems:"center",gap:6,padding:0}}>← Back</button>
              <div style={{background:"rgba(12,10,8,0.9)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:22,padding:32,boxShadow:"0 4px 24px rgba(0,0,0,0.06)"}}>
                <h2 style={{fontFamily:"'Bebas Neue',cursive",fontSize:22,fontWeight:900,margin:"0 0 6px",color:"#e8e4dc"}}>{editSpot?"Edit Spot":"Register New Spot"}</h2>
                <p style={{color:"#777",fontSize:13,margin:"0 0 28px"}}>Fill in your parking land details</p>
                <div style={{display:"grid",gap:20}}>
                  <Field label="Spot Name"><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Front Yard – Spot A" style={inp()}/></Field>
                  <Field label="Full Address"><input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="Street, City, PIN" style={inp()}/></Field>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                    <Field label="Type"><select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={inp()}>{["Open Air","Covered","Basement"].map(t=><option key={t}>{t}</option>)}</select></Field>
                    <Field label="₹ / Hour"><input value={form.priceHour} onChange={e=>setForm(f=>({...f,priceHour:e.target.value}))} placeholder="30" type="number" style={inp()}/></Field>
                    <Field label="₹ / Day"><input value={form.priceDay} onChange={e=>setForm(f=>({...f,priceDay:e.target.value}))} placeholder="200" type="number" style={inp()}/></Field>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                    <Field label="Slots"><input value={form.slots} onChange={e=>setForm(f=>({...f,slots:e.target.value}))} placeholder="2" type="number" min={1} max={10} style={inp()}/></Field>
                    <Field label="Open From"><input value={form.timeFrom} onChange={e=>setForm(f=>({...f,timeFrom:e.target.value}))} type="time" style={inp()}/></Field>
                    <Field label="Close At"><input value={form.timeTo} onChange={e=>setForm(f=>({...f,timeTo:e.target.value}))} type="time" style={inp()}/></Field>
                  </div>
                  <Field label="Available Days">
                    <div style={{display:"flex",gap:8}}>
                      {DAYS.map((d,i)=><button key={d} type="button" className="toggle-day" onClick={()=>setForm(f=>({...f,availability:{...f.availability,[d]:!f.availability[d]}}))} style={{flex:1,height:44,borderRadius:10,border:`1px solid ${form.availability[d]?"#c8a060":"#e0d8cc"}`,background:form.availability[d]?"#f0e8d8":"transparent",color:form.availability[d]?"#7a5c30":"#c8b89a",fontWeight:700,fontSize:11}}>{DAY_L[i]}</button>)}
                    </div>
                  </Field>
                  <Field label="Amenities">
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {AMENITY_OPTS.map(a=><button key={a} type="button" onClick={()=>toggleAmenity(a)} style={{padding:"7px 14px",borderRadius:20,border:`1px solid ${form.amenities.includes(a)?"#c8a060":"#e0d8cc"}`,background:form.amenities.includes(a)?"#f0e8d8":"transparent",color:form.amenities.includes(a)?"#7a5c30":"#c8b89a",fontSize:12,fontWeight:600,cursor:"pointer"}}>{a}</button>)}
                    </div>
                  </Field>
                  <div style={{display:"flex",gap:12,paddingTop:8}}>
                    <button onClick={saveSpot} style={{flex:1,padding:"14px",borderRadius:13,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:14,background:saved?"#e8f8ee":"linear-gradient(135deg,#7a5c30,#c8964a)",color:saved?"#1a6e42":"#fff",boxShadow:saved?"none":"0 6px 22px rgba(122,92,48,0.35)",transition:"all 0.3s"}}>{saved?"✓ Spot Saved!":editSpot?"Update Spot":"List My Spot"}</button>
                    <button onClick={()=>setShowAddSpot(false)} style={{padding:"14px 20px",borderRadius:13,border:"1px solid #e0d8cc",background:"transparent",color:"#666",cursor:"pointer",fontWeight:600}}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ BOOKINGS ══ */}
          {page==="bookings"&&(
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
                {[{label:"Active",count:bookings.filter(b=>b.status==="active").length,color:"#1a6e42",bg:"#e8f8ee"},{label:"Completed",count:bookings.filter(b=>b.status==="completed").length,color:"#1a5a8a",bg:"#e8f2fb"},{label:"Cancelled",count:bookings.filter(b=>b.status==="cancelled").length,color:"#9a2020",bg:"#fdeaea"}].map(s=>(
                  <div key={s.label} className="card-hover" style={{background:"rgba(12,10,8,0.9)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:16,padding:"20px 22px",boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                    <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:32,fontWeight:700,color:s.color}}>{s.count}</div>
                    <div style={{fontSize:12,color:"#666",marginTop:6}}>{s.label} Bookings</div>
                  </div>
                ))}
              </div>
              <div style={{background:"rgba(12,10,8,0.9)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:20,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:16,fontWeight:700,color:"#e8e4dc",marginBottom:18}}>All Bookings</div>
                <BookingsTable bookings={bookings}/>
              </div>
            </div>
          )}

          {/* ══ EARNINGS ══ */}
          {page==="earnings"&&(
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                {[{label:"Gross Earnings",value:fmt(totalRev),color:"#f97316",note:"Before commission"},{label:"Your Share (90%)",value:fmt(totalRev*0.9),color:"#1a6e42",note:"After 10% platform fee"},{label:"Platform Fee (10%)",value:fmt(totalRev*0.1),color:"#8a4a00",note:"ParkEase commission"}].map(c=>(
                  <div key={c.label} className="card-hover" style={{background:"rgba(12,10,8,0.9)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:18,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                    <div style={{fontSize:11,color:"#777",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.8px"}}>{c.label}</div>
                    <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,fontWeight:700,color:c.color}}>{c.value}</div>
                    <div style={{fontSize:11,color:"#777",marginTop:8}}>{c.note}</div>
                  </div>
                ))}
              </div>
              <div style={{background:"rgba(12,10,8,0.9)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:20,padding:28,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:24}}>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:17,fontWeight:700,color:"#e8e4dc",marginBottom:4}}>Monthly Earnings</div>
                    <div style={{fontSize:12,color:"#777"}}>Last 6 months performance</div>
                  </div>
                  <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,fontWeight:700,color:"#f97316"}}>{fmt(totalRev)}</div>
                </div>
                <EarnChart data={EARN_MONTHLY}/>
              </div>
              <div style={{background:"rgba(12,10,8,0.9)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:20,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                <div style={{padding:"20px 24px",borderBottom:"1px solid rgba(255,255,255,0.06)",fontFamily:"'Bebas Neue',cursive",fontSize:15,fontWeight:700,color:"#e8e4dc"}}>Earnings by Spot</div>
                <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:14}}>
                  {[...spots].sort((a,b)=>b.revenue-a.revenue).map(s=>{
                    const max=Math.max(...spots.map(x=>x.revenue));
                    return(
                      <div key={s.id} style={{display:"flex",alignItems:"center",gap:14}}>
                        <div style={{width:52,height:52,borderRadius:12,overflow:"hidden",flexShrink:0,background:"rgba(255,255,255,0.04)"}}>
                          {s.photo?<img src={s.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:22,display:"flex",alignItems:"center",justifyContent:"center",height:"100%"}}>🅿</span>}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:13,color:"#e8e4dc",marginBottom:6}}>{s.name}</div>
                          <div style={{height:8,background:"#f0ebe0",borderRadius:8,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${max>0?(s.revenue/max*100):0}%`,background:"linear-gradient(to right,#7a5c30,#c8964a)",borderRadius:8,transition:"width 1s ease"}}/>
                          </div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:16,fontWeight:700,color:"#f97316"}}>{fmt(s.revenue)}</div>
                          <div style={{fontSize:11,color:"#777"}}>{s.bookings} bookings</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══ PROFILE ══ */}
          {page==="profile"&&(
            <div style={{maxWidth:580,display:"flex",flexDirection:"column",gap:20}}>
              <div style={{background:"linear-gradient(135deg,#1c140a,#3a2810)",borderRadius:22,padding:"32px 36px",display:"flex",gap:22,alignItems:"center"}}>
                <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#e8a84a,#7a5c30)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',cursive",fontWeight:900,fontSize:26,color:"#e8e4dc",flexShrink:0}}>{OWNER.avatar}</div>
                <div>
                  <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:22,fontWeight:900,color:"#e8e4dc",marginBottom:4}}>{OWNER.name}</div>
                  <div style={{fontSize:13,color:"#777",marginBottom:8}}>{OWNER.area} · Joined {OWNER.joined}</div>
                  {OWNER.verified&&<span style={{background:"#1a3a10",color:"#4ade80",padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700}}>✓ Verified Owner</span>}
                </div>
              </div>
              <div style={{background:"rgba(12,10,8,0.9)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:20,padding:28,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:16,fontWeight:700,color:"#e8e4dc",marginBottom:22}}>Account Details</div>
                <div style={{display:"grid",gap:16}}>
                  <Field label="Full Name"><input defaultValue={OWNER.name} style={inp()}/></Field>
                  <Field label="Email Address"><input defaultValue={OWNER.email} style={inp()}/></Field>
                  <Field label="Phone Number"><input defaultValue={OWNER.phone} style={inp()}/></Field>
                  <Field label="Area / Location"><input defaultValue={OWNER.area} style={inp()}/></Field>
                  <button style={{padding:"13px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#f97316,#ea580c)",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 4px 16px rgba(122,92,48,0.3)"}}>Save Changes</button>
                </div>
              </div>
              <div style={{background:"rgba(12,10,8,0.9)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:20,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:15,fontWeight:700,color:"#e8e4dc",marginBottom:16}}>Platform Summary</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[{l:"Total Spots Listed",v:spots.length},{l:"Total Bookings",v:totalBookings},{l:"Total Earnings",v:fmt(totalRev)},{l:"Avg. Rating",v:`⭐ ${spots.length?((spots.reduce((a,s)=>a+s.rating,0)/spots.length).toFixed(1)):"—"}`}].map(r=>(
                    <div key={r.l} style={{background:"rgba(255,255,255,0.02)",borderRadius:12,padding:"14px 16px",border:"1px solid rgba(255,255,255,0.06)"}}>
                      <div style={{fontSize:11,color:"#777",marginBottom:6}}>{r.l}</div>
                      <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,fontWeight:700,color:"#f97316"}}>{r.v}</div>
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

/* ── Bookings Table ── */
function BookingsTable({bookings}){
  return(
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            {["ID","Customer","Vehicle","Spot","Date","Amount","Status"].map(h=>(
              <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:"#777",letterSpacing:"0.8px",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map(b=>(
            <tr key={b.id} className="row-hover" style={{borderBottom:"1px solid rgba(255,255,255,0.03)",transition:"background 0.15s"}}>
              <td style={{padding:"12px 14px"}}><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:"#ea580c",background:"rgba(255,255,255,0.04)",padding:"3px 8px",borderRadius:6}}>{b.id?.slice(0,8)}</span></td>
              <td style={{padding:"12px 14px"}}><div style={{fontWeight:600,fontSize:13,color:"#e8e4dc"}}>{b.user_name || "User"}</div><div style={{fontSize:11,color:"#777"}}>{b.user_phone || "-"}</div></td>
              <td style={{padding:"12px 14px",fontSize:12,color:"#8a7060",fontWeight:500}}>{b.vehicle_number || "-"}</td>
              <td style={{padding:"12px 14px",fontSize:12,color:"#6a5040",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.vehicle_type || "-"}</td>
              <td style={{padding:"12px 14px"}}><div style={{fontSize:12,color:"#e8e4dc"}}>{b.booking_date}</div><div style={{fontSize:10,color:"#777"}}>{b.start_time?.slice(0,5) || "-"}</div></td>
              <td style={{padding:"12px 14px",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,color:"#1a6e42"}}>{`₹${b.amount || 0}`}</td>
              <td style={{padding:"12px 14px"}}><Badge s={b.status}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Field wrapper ── */
function Field({label,children}){
  return(
    <div>
      <label style={{fontSize:11,fontWeight:700,color:"#666",letterSpacing:"0.8px",textTransform:"uppercase",display:"block",marginBottom:8}}>{label}</label>
      {children}
    </div>
  );
}
