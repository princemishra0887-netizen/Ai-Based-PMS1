import { useState, useEffect } from "react";

/* ── Fonts ── */
const fl = document.createElement("link");
fl.rel = "stylesheet";
fl.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap";
document.head.appendChild(fl);

const css = document.createElement("style");
css.textContent = `
  *{box-sizing:border-box;margin:0;padding:0}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:#f7f5f0}
  ::-webkit-scrollbar-thumb{background:#d4c9b8;border-radius:4px}
  @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes countUp{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}
  @keyframes shimmerPulse{0%,100%{opacity:0.6}50%{opacity:1}}
  .nav-link{transition:all 0.18s ease;cursor:pointer}
  .nav-link:hover{background:rgba(180,140,90,0.12) !important;color:#7a5c30 !important}
  .nav-link.active{background:linear-gradient(135deg,#7a5c30,#a07840) !important;color:#fff !important;box-shadow:0 4px 16px rgba(122,92,48,0.35) !important}
  .card-hover{transition:transform 0.22s ease,box-shadow 0.22s ease}
  .card-hover:hover{transform:translateY(-3px);box-shadow:0 16px 48px rgba(0,0,0,0.1) !important}
  .row-hover:hover{background:#faf8f4 !important}
  .btn-ghost:hover{background:#f0ebe0 !important}
  .toggle-day{transition:all 0.15s ease;cursor:pointer}
  .toggle-day:hover{opacity:0.85}
  input:focus,select:focus,textarea:focus{outline:none;border-color:#a07840 !important;box-shadow:0 0 0 3px rgba(160,120,64,0.15) !important}
`;
document.head.appendChild(css);

/* ── Data ── */
const OWNER = { name:"Rajesh Kumar", area:"Ghaziabad, UP", phone:"9876543210", email:"rajesh.kumar@mail.com", joined:"Nov 2024", verified:true, avatar:"RK" };

const INIT_SPOTS = [
  { id:1, name:"Front Yard – Spot A", type:"Open Air", address:"12, MG Road, Ghaziabad", priceHour:30, priceDay:200, status:"active", bookings:38, revenue:9200, rating:4.7, reviews:38, photo:"https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=500&q=80", availability:{mon:true,tue:true,wed:true,thu:true,fri:true,sat:false,sun:false}, timeFrom:"08:00", timeTo:"20:00", amenities:["CCTV","Lighting","Wide Gate"], slots:2 },
  { id:2, name:"Side Lane – Spot B", type:"Covered", address:"12, MG Road, Ghaziabad", priceHour:50, priceDay:320, status:"active", bookings:61, revenue:18600, rating:4.9, reviews:61, photo:"https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=500&q=80", availability:{mon:true,tue:true,wed:true,thu:true,fri:true,sat:true,sun:true}, timeFrom:"00:00", timeTo:"23:59", amenities:["CCTV","Covered Roof","Security Guard","EV Charging"], slots:1 },
];

const BOOKINGS = [
  { id:"PK7A2B", user:"Aditya Sharma", vehicle:"UP 14 AB 1234", spot:"Front Yard – Spot A", spotId:1, date:"2025-03-15", time:"09:00–13:00", amount:120, type:"hourly", status:"active", phone:"9876001234" },
  { id:"PK9C4D", user:"Neha Patel",    vehicle:"DL 3C ZB 0012",  spot:"Side Lane – Spot B", spotId:2, date:"2025-03-15", time:"Full Day",   amount:320, type:"daily",  status:"active", phone:"9812009900" },
  { id:"PK1E5F", user:"Rohit Das",     vehicle:"UP 16 CD 5678",  spot:"Front Yard – Spot A", spotId:1, date:"2025-03-14", time:"10:00–18:00",amount:320, type:"hourly", status:"completed", phone:"9834001100" },
  { id:"PK3G6H", user:"Kavya Nair",    vehicle:"MH 02 AB 9900",  spot:"Side Lane – Spot B", spotId:2, date:"2025-03-14", time:"08:00–10:00",amount:100, type:"hourly", status:"cancelled", phone:"9823004455" },
  { id:"PK5I7J", user:"Suresh Rao",    vehicle:"KA 01 MN 1122",  spot:"Front Yard – Spot A", spotId:1, date:"2025-03-13", time:"Full Day",   amount:200, type:"daily",  status:"completed", phone:"9900112233" },
  { id:"PK2K8L", user:"Ankita Joshi",  vehicle:"UP 14 XY 3344",  spot:"Side Lane – Spot B", spotId:2, date:"2025-03-12", time:"11:00–15:00",amount:200, type:"hourly", status:"completed", phone:"9811223344" },
];

const EARN_MONTHLY = [
  {month:"Oct",earn:4200},{month:"Nov",earn:6800},{month:"Dec",earn:8100},
  {month:"Jan",earn:7400},{month:"Feb",earn:9600},{month:"Mar",earn:9200},
];

const DAYS=["mon","tue","wed","thu","fri","sat","sun"];
const DAY_L=["Mo","Tu","We","Th","Fr","Sa","Su"];
const TYPE_META={"Open Air":{color:"#b8860b",bg:"#fdf6e3",icon:"☀️"},"Covered":{color:"#2e7d9a",bg:"#e8f4f8",icon:"🏗"},"Basement":{color:"#6a4c9c",bg:"#f0ebfb",icon:"⬇️"}};
const STATUS_META={active:{color:"#2d7a47",bg:"#e6f4ec",dot:"#4ade80"},pending:{color:"#8a6200",bg:"#fdf6e3",dot:"#f7c948"},inactive:{color:"#666",bg:"#f0f0f0",dot:"#aaa"},completed:{color:"#2e5fa3",bg:"#e8eef8",dot:"#60a5fa"},cancelled:{color:"#9a2a2a",bg:"#fdeaea",dot:"#f87171"}};

const fmt = n=>`₹${Number(n).toLocaleString("en-IN")}`;
function Badge({s}){ const m=STATUS_META[s]||{color:"#888",bg:"#eee",dot:"#ccc"}; return <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:m.bg,color:m.color}}><span style={{width:6,height:6,borderRadius:"50%",background:m.dot,display:"inline-block"}}/>{s.charAt(0).toUpperCase()+s.slice(1)}</span>; }

/* ── Mini Earnings Chart ── */
function EarnChart({data}){
  const max=Math.max(...data.map(d=>d.earn));
  return(
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:80}}>
      {data.map((d,i)=>(
        <div key={d.month} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{width:"100%",borderRadius:"4px 4px 0 0",
            background:i===data.length-1?"linear-gradient(to top,#7a5c30,#c8964a)":"#e8dfd0",
            height:`${Math.max(6,(d.earn/max)*70)}px`,transition:"height 0.8s ease"}}/>
          <div style={{fontSize:9,color:"#b0a090",fontWeight:600}}>{d.month}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Input Style ── */
const inp = (ex={})=>({width:"100%",background:"#faf8f5",border:"1px solid #e0d8cc",borderRadius:10,padding:"11px 14px",color:"#2a1f0f",fontSize:14,fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"border-color 0.2s,box-shadow 0.2s",...ex});

const BLANK_SPOT={name:"",type:"Open Air",address:"",priceHour:"",priceDay:"",timeFrom:"08:00",timeTo:"20:00",status:"active",availability:{mon:true,tue:true,wed:true,thu:true,fri:true,sat:false,sun:false},amenities:[],photo:null,photoPreview:null,slots:1};
const AMENITY_OPTS=["CCTV","Lighting","Covered Roof","Security Guard","EV Charging","Wide Gate","24/7 Access","Wheelchair Access"];

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
export default function LandOwnerDashBoard(){
  const [page,setPage]=useState("overview");
  const [spots,setSpots]=useState(INIT_SPOTS);
  const [bookings]=useState(BOOKINGS);
  const [sideOpen,setSideOpen]=useState(true);
  const [showAddSpot,setShowAddSpot]=useState(false);
  const [editSpot,setEditSpot]=useState(null);
  const [form,setForm]=useState(BLANK_SPOT);
  const [saved,setSaved]=useState(false);
  const [detailSpot,setDetailSpot]=useState(null);
  const [time,setTime]=useState(new Date());
  const [notifOpen,setNotifOpen]=useState(false);

  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t);},[]);

  const totalRev=spots.reduce((a,s)=>a+s.revenue,0);
  const totalBookings=spots.reduce((a,s)=>a+s.bookings,0);
  const activeBookings=bookings.filter(b=>b.status==="active").length;

  function openAdd(){setForm(BLANK_SPOT);setEditSpot(null);setShowAddSpot(true);}
  function openEdit(spot){setForm({...spot});setEditSpot(spot.id);setShowAddSpot(true);}
  function saveSpot(){
    if(!form.name||!form.priceHour) return;
    const s={...form,id:editSpot||Date.now(),priceHour:Number(form.priceHour),priceDay:Number(form.priceDay),bookings:editSpot?spots.find(x=>x.id===editSpot).bookings:0,revenue:editSpot?spots.find(x=>x.id===editSpot).revenue:0,rating:editSpot?spots.find(x=>x.id===editSpot).rating:5.0,reviews:editSpot?spots.find(x=>x.id===editSpot).reviews:0};
    setSpots(editSpot?spots.map(x=>x.id===editSpot?s:x):[...spots,s]);
    setSaved(true); setTimeout(()=>{setSaved(false);setShowAddSpot(false);},1400);
  }
  function toggleSpotStatus(id){setSpots(spots.map(s=>s.id===id?{...s,status:s.status==="active"?"inactive":"active"}:s));}
  function removeSpot(id){setSpots(spots.filter(s=>s.id!==id));setDetailSpot(null);}
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
    <div style={{display:"flex",minHeight:"100vh",background:"#f7f5f0",fontFamily:"'Plus Jakarta Sans',sans-serif",color:"#2a1f0f"}}>

      {/* ══ SIDEBAR ══ */}
      <aside style={{width:SW,minHeight:"100vh",background:"#1c140a",display:"flex",flexDirection:"column",transition:"width 0.25s ease",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto",overflowX:"hidden"}}>
        {/* Logo */}
        <div style={{padding:"22px 16px 18px",borderBottom:"1px solid #2e2010",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setSideOpen(!sideOpen)}>
          <div style={{width:38,height:38,borderRadius:11,flexShrink:0,background:"linear-gradient(135deg,#e8a84a,#7a5c30)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 4px 16px rgba(232,168,74,0.4)"}}>🅿</div>
          {sideOpen&&<div><div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:17,color:"#f0e8d8",lineHeight:1.1}}>ParkEase</div><div style={{fontSize:10,color:"#6a5030",letterSpacing:"1.5px",textTransform:"uppercase",marginTop:2}}>Owner Portal</div></div>}
        </div>

        {/* Owner pill */}
        {sideOpen&&<div style={{margin:"16px 14px 8px",background:"#261a0e",border:"1px solid #3a2810",borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#e8a84a,#7a5c30)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:"#1c140a",flexShrink:0}}>{OWNER.avatar}</div>
          <div style={{minWidth:0}}>
            <div style={{fontWeight:700,fontSize:12,color:"#f0e8d8",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{OWNER.name}</div>
            <div style={{fontSize:10,color:"#6a5030",marginTop:1}}>{OWNER.area}</div>
          </div>
          {OWNER.verified&&<span style={{fontSize:14,marginLeft:"auto",flexShrink:0}}>✅</span>}
        </div>}

        {/* Nav */}
        <nav style={{flex:1,padding:"8px 10px",display:"flex",flexDirection:"column",gap:2}}>
          {NAV.map(n=>(
            <button key={n.key} className={`nav-link${page===n.key?" active":""}`}
              onClick={()=>setPage(n.key)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:sideOpen?"11px 14px":"11px 0",justifyContent:sideOpen?"flex-start":"center",borderRadius:11,border:"none",cursor:"pointer",textAlign:"left",background:"transparent",color:page===n.key?"#fff":"#7a6040",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:600,whiteSpace:"nowrap"}}>
              <span style={{fontSize:17,flexShrink:0}}>{n.icon}</span>
              {sideOpen&&<span>{n.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom help */}
        {sideOpen&&<div style={{padding:"14px 16px",borderTop:"1px solid #2e2010"}}>
          <div style={{background:"#261a0e",borderRadius:12,padding:"12px 14px",border:"1px solid #3a2810"}}>
            <div style={{fontSize:11,color:"#e8a84a",fontWeight:700,marginBottom:4}}>Need Help?</div>
            <div style={{fontSize:11,color:"#6a5030",lineHeight:1.6}}>Contact support at help@parkease.in</div>
          </div>
        </div>}
      </aside>

      {/* ══ MAIN AREA ══ */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"auto"}}>

        {/* ── Top Bar ── */}
        <header style={{background:"rgba(247,245,240,0.95)",backdropFilter:"blur(12px)",borderBottom:"1px solid #e0d8cc",padding:"0 28px",height:62,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
          <div>
            <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,color:"#1c140a",textTransform:"capitalize"}}>{showAddSpot?(editSpot?"Edit Spot":"Add New Spot"):detailSpot?"Spot Details":page}</span>
            {!showAddSpot&&!detailSpot&&<span style={{color:"#c8b89a",fontSize:13,marginLeft:8}}>/ {OWNER.name}</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{fontSize:12,color:"#b0a090",fontWeight:500}}>{time.toLocaleTimeString("en-IN")}</div>
            {activeBookings>0&&<div style={{position:"relative",cursor:"pointer"}} onClick={()=>setNotifOpen(!notifOpen)}>
              <div style={{width:36,height:36,borderRadius:11,background:"#f0e8d8",border:"1px solid #e0d0b0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🔔</div>
              <div style={{position:"absolute",top:-3,right:-3,width:16,height:16,borderRadius:"50%",background:"#e85030",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff"}}>{activeBookings}</div>
              {notifOpen&&<div style={{position:"absolute",top:44,right:0,width:260,background:"#fff",border:"1px solid #e0d8cc",borderRadius:14,boxShadow:"0 12px 36px rgba(0,0,0,0.12)",zIndex:300,overflow:"hidden"}}>
                <div style={{padding:"14px 16px",borderBottom:"1px solid #f0e8d8",fontWeight:700,fontSize:13,color:"#1c140a"}}>Active Bookings</div>
                {bookings.filter(b=>b.status==="active").map(b=>(
                  <div key={b.id} style={{padding:"12px 16px",borderBottom:"1px solid #f7f5f0"}}>
                    <div style={{fontWeight:600,fontSize:12,color:"#1c140a"}}>{b.user} · {b.spot}</div>
                    <div style={{fontSize:11,color:"#b0a090",marginTop:3}}>{b.date} · {b.time}</div>
                  </div>
                ))}
              </div>}
            </div>}
            {page==="spots"&&!showAddSpot&&!detailSpot&&spots.length<3&&(
              <button onClick={openAdd} style={{background:"linear-gradient(135deg,#7a5c30,#c8964a)",color:"#fff",border:"none",borderRadius:11,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",boxShadow:"0 4px 14px rgba(122,92,48,0.3)"}}>+ Add Spot</button>
            )}
          </div>
        </header>

        <main style={{flex:1,padding:"28px",animation:"slideUp 0.35s ease"}}>

          {/* ══ OVERVIEW ══ */}
          {page==="overview"&&!showAddSpot&&!detailSpot&&(
            <div style={{display:"flex",flexDirection:"column",gap:24}}>
              {/* Welcome */}
              <div style={{background:"linear-gradient(135deg,#1c140a 0%,#3a2810 60%,#5a3c18 100%)",borderRadius:22,padding:"32px 36px",display:"flex",justifyContent:"space-between",alignItems:"center",overflow:"hidden",position:"relative"}}>
                <div style={{position:"absolute",right:-40,top:-40,width:200,height:200,borderRadius:"50%",background:"rgba(232,168,74,0.08)"}}/>
                <div style={{position:"absolute",right:80,bottom:-60,width:160,height:160,borderRadius:"50%",background:"rgba(232,168,74,0.05)"}}/>
                <div>
                  <div style={{fontSize:12,color:"#c8964a",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:10}}>Welcome Back</div>
                  <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:"#f0e8d8",margin:"0 0 8px",letterSpacing:"-0.5px"}}>{OWNER.name}</h1>
                  <div style={{fontSize:13,color:"#7a6040"}}>📍 {OWNER.area} · Member since {OWNER.joined}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,color:"#7a6040",marginBottom:4}}>Total Earnings</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:900,color:"#e8a84a",lineHeight:1}}>{fmt(totalRev)}</div>
                  <div style={{fontSize:12,color:"#6a5030",marginTop:6}}>{totalBookings} total bookings</div>
                </div>
              </div>

              {/* KPI cards */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
                {[
                  {label:"Total Spots",value:spots.length,sub:`${spots.filter(s=>s.status==="active").length} active`,icon:"🗺",color:"#7a5c30",bg:"#fdf6e8"},
                  {label:"This Month",value:fmt(EARN_MONTHLY[EARN_MONTHLY.length-1].earn),sub:"March 2025",icon:"📈",color:"#1a6e42",bg:"#e8f8ee"},
                  {label:"Live Bookings",value:activeBookings,sub:"Right now",icon:"⚡",color:"#1a5a8a",bg:"#e8f2fb"},
                  {label:"Avg. Rating",value:spots.length?((spots.reduce((a,s)=>a+s.rating,0)/spots.length).toFixed(1)):"—",sub:"Across all spots",icon:"⭐",color:"#8a4a00",bg:"#fff4e0"},
                ].map((k,i)=>(
                  <div key={k.label} className="card-hover" style={{background:"#fff",border:"1px solid #ede5d8",borderRadius:18,padding:"22px 22px 18px",animationDelay:`${i*0.07}s`,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                    <div style={{width:40,height:40,borderRadius:12,background:k.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:14}}>{k.icon}</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:k.color,lineHeight:1}}>{k.value}</div>
                    <div style={{fontSize:12,color:"#b0a090",margin:"6px 0 0"}}>{k.label}</div>
                    <div style={{fontSize:11,color:"#c8b89a",marginTop:3}}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Spots + Earnings row */}
              <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:20}}>
                {/* Spot cards */}
                <div style={{background:"#fff",border:"1px solid #ede5d8",borderRadius:20,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#1c140a"}}>My Spots</div>
                    <button onClick={()=>setPage("spots")} style={{background:"transparent",border:"none",color:"#a07840",fontSize:12,fontWeight:700,cursor:"pointer"}}>Manage All →</button>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    {spots.map(spot=>(
                      <div key={spot.id} className="card-hover" style={{display:"flex",gap:14,alignItems:"center",padding:"14px",background:"#faf8f5",borderRadius:14,border:"1px solid #ede5d8",cursor:"pointer"}} onClick={()=>{setDetailSpot(spot);setPage("spots");}}>
                        <div style={{width:52,height:52,borderRadius:12,overflow:"hidden",flexShrink:0,background:"#f0e8d8"}}>
                          {spot.photo?<img src={spot.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🅿</div>}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:13,color:"#1c140a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{spot.name}</div>
                          <div style={{fontSize:11,color:"#b0a090",marginTop:2}}>{spot.type} · ₹{spot.priceHour}/hr</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:"#7a5c30"}}>{fmt(spot.revenue)}</div>
                          <div style={{fontSize:10,color:"#c8b89a",marginTop:2}}>{spot.bookings} bookings</div>
                        </div>
                        <Badge s={spot.status}/>
                      </div>
                    ))}
                    {spots.length<3&&<div onClick={()=>{setPage("spots");openAdd();}} style={{border:"2px dashed #e0d0b8",borderRadius:14,padding:"18px",textAlign:"center",cursor:"pointer",color:"#c8b89a",fontSize:13,fontWeight:600,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#a07840";e.currentTarget.style.color="#a07840"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e0d0b8";e.currentTarget.style.color="#c8b89a"}}>
                      + Add New Spot ({3-spots.length} slot{3-spots.length!==1?"s":""} left)
                    </div>}
                  </div>
                </div>

                {/* Earnings chart + recent */}
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  <div style={{background:"#fff",border:"1px solid #ede5d8",borderRadius:20,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.04)",flex:1}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:"#1c140a",marginBottom:4}}>Earnings Trend</div>
                    <div style={{fontSize:11,color:"#c8b89a",marginBottom:18}}>Last 6 months</div>
                    <EarnChart data={EARN_MONTHLY}/>
                  </div>
                  <div style={{background:"linear-gradient(135deg,#f0e8d8,#fdf6e8)",border:"1px solid #e0d0b0",borderRadius:20,padding:22,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                    <div style={{fontSize:11,color:"#a07840",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Commission Info</div>
                    <div style={{fontSize:13,color:"#5a3c18",lineHeight:1.7}}>ParkEase takes a <strong>10% platform fee</strong>. You keep 90% of every booking.</div>
                    <div style={{display:"flex",gap:16,marginTop:14}}>
                      <div><div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:"#7a5c30"}}>{fmt(totalRev*0.9)}</div><div style={{fontSize:11,color:"#b0a090"}}>Your share</div></div>
                      <div><div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:"#c8964a"}}>{fmt(totalRev*0.1)}</div><div style={{fontSize:11,color:"#b0a090"}}>Platform fee</div></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent bookings */}
              <div style={{background:"#fff",border:"1px solid #ede5d8",borderRadius:20,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:18,alignItems:"center"}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#1c140a"}}>Recent Bookings</div>
                  <button onClick={()=>setPage("bookings")} style={{background:"transparent",border:"none",color:"#a07840",fontSize:12,fontWeight:700,cursor:"pointer"}}>View All →</button>
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
                  <div key={spot.id} className="card-hover" style={{background:"#fff",border:"1px solid #ede5d8",borderRadius:20,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.05)",animation:`slideUp 0.35s ease ${i*0.07}s both`}}>
                    <div style={{height:170,position:"relative",overflow:"hidden",cursor:"pointer"}} onClick={()=>setDetailSpot(spot)}>
                      {spot.photo?<img src={spot.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{height:"100%",background:"#f0e8d8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,color:"#d4c0a0"}}>🅿</div>}
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
                        <div><div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"#7a5c30"}}>₹{spot.priceHour}<span style={{fontSize:11,color:"#c8b89a",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:400}}>/hr</span></div></div>
                        <div><div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"#1a6e42"}}>{fmt(spot.revenue)}</div><div style={{fontSize:10,color:"#c8b89a"}}>earned</div></div>
                        <div><div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"#1a5a8a"}}>{spot.bookings}</div><div style={{fontSize:10,color:"#c8b89a"}}>bookings</div></div>
                      </div>
                      <div style={{display:"flex",gap:4,marginBottom:14}}>
                        {DAYS.map((d,i)=>(
                          <div key={d} style={{flex:1,height:22,borderRadius:5,background:spot.availability[d]?"#f0e8d8":"#f7f5f0",border:`1px solid ${spot.availability[d]?"#c8a060":"#ede5d8"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:spot.availability[d]?"#7a5c30":"#d4c4b0"}}>{DAY_L[i]}</div>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>setDetailSpot(spot)} style={{flex:1,padding:"9px",borderRadius:9,border:"1px solid #e0d0b0",background:"transparent",color:"#7a5c30",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>View</button>
                        <button onClick={()=>openEdit(spot)} style={{flex:1,padding:"9px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#7a5c30,#c8964a)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Edit</button>
                        <button onClick={()=>toggleSpotStatus(spot.id)} style={{flex:1,padding:"9px",borderRadius:9,border:`1px solid ${spot.status==="active"?"#f8a0a0":"#90d0a8"}`,background:"transparent",color:spot.status==="active"?"#c04040":"#1a6e42",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{spot.status==="active"?"Pause":"Activate"}</button>
                      </div>
                    </div>
                  </div>
                ))}
                {spots.length<3&&<div onClick={openAdd} style={{border:"2px dashed #e0d0b8",borderRadius:20,minHeight:240,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#c8b89a",gap:10,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#a07840";e.currentTarget.style.color="#a07840"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e0d0b8";e.currentTarget.style.color="#c8b89a"}}>
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
                <button onClick={()=>setDetailSpot(null)} style={{background:"transparent",border:"none",color:"#b0a090",cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:22,display:"flex",alignItems:"center",gap:6,padding:0}}>← Back to Spots</button>
                <div style={{display:"grid",gridTemplateColumns:"1.1fr 1fr",gap:24}}>
                  <div style={{display:"flex",flexDirection:"column",gap:18}}>
                    <div style={{borderRadius:20,overflow:"hidden",height:260,background:"#f0e8d8"}}>
                      {spot.photo?<img src={spot.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:60,color:"#d4c0a0"}}>🅿</div>}
                    </div>
                    <div style={{background:"#fff",border:"1px solid #ede5d8",borderRadius:18,padding:22}}>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,marginBottom:4}}>{spot.name}</div>
                      <div style={{fontSize:12,color:"#b0a090",marginBottom:16}}>📍 {spot.address}</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                        {(spot.amenities||[]).map(a=><span key={a} style={{background:"#f0e8d8",color:"#7a5c30",padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:600}}>✓ {a}</span>)}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10}}>
                      <button onClick={()=>openEdit(spot)} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#7a5c30,#c8964a)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>✏️ Edit Spot</button>
                      <button onClick={()=>toggleSpotStatus(spot.id)} style={{flex:1,padding:"12px",borderRadius:12,border:`1px solid ${spot.status==="active"?"#f0a090":"#90d0a8"}`,background:"transparent",color:spot.status==="active"?"#c04040":"#1a6e42",fontWeight:700,fontSize:13,cursor:"pointer"}}>{spot.status==="active"?"⏸ Pause":"▶ Activate"}</button>
                      <button onClick={()=>removeSpot(spot.id)} style={{padding:"12px 16px",borderRadius:12,border:"1px solid #f0a090",background:"transparent",color:"#c04040",fontSize:13,cursor:"pointer"}}>🗑</button>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:16}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      {[{label:"Revenue",value:fmt(spot.revenue),color:"#7a5c30"},{label:"Bookings",value:spot.bookings,color:"#1a5a8a"},{label:"Rating",value:`⭐ ${spot.rating}`,color:"#8a4a00"},{label:"Reviews",value:spot.reviews,color:"#1a6e42"}].map(s=>(
                        <div key={s.label} style={{background:"#fff",border:"1px solid #ede5d8",borderRadius:14,padding:"16px 18px"}}>
                          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:s.color}}>{s.value}</div>
                          <div style={{fontSize:11,color:"#c8b89a",marginTop:4}}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{background:"#fff",border:"1px solid #ede5d8",borderRadius:18,padding:20}}>
                      <div style={{fontSize:11,color:"#b0a090",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:12}}>Schedule</div>
                      <div style={{display:"flex",gap:5,marginBottom:12}}>
                        {DAYS.map((d,i)=><div key={d} style={{flex:1,height:32,borderRadius:8,background:spot.availability[d]?"#f0e8d8":"#f7f5f0",border:`1px solid ${spot.availability[d]?"#c8a060":"#ede5d8"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:spot.availability[d]?"#7a5c30":"#d4c4b0"}}>{DAY_L[i]}</div>)}
                      </div>
                      <div style={{fontSize:13,color:"#8a7060"}}>⏰ {spot.timeFrom} — {spot.timeTo}</div>
                    </div>
                    <div style={{background:"#fff",border:"1px solid #ede5d8",borderRadius:18,padding:20}}>
                      <div style={{fontSize:11,color:"#b0a090",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:14}}>Bookings for this Spot</div>
                      {spotBookings.length===0?<div style={{fontSize:13,color:"#c8b89a"}}>No bookings yet</div>:<BookingsTable bookings={spotBookings.slice(0,3)}/>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── ADD/EDIT SPOT FORM ── */}
          {showAddSpot&&(
            <div style={{maxWidth:640,animation:"slideUp 0.3s ease"}}>
              <button onClick={()=>setShowAddSpot(false)} style={{background:"transparent",border:"none",color:"#b0a090",cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:24,display:"flex",alignItems:"center",gap:6,padding:0}}>← Back</button>
              <div style={{background:"#fff",border:"1px solid #ede5d8",borderRadius:22,padding:32,boxShadow:"0 4px 24px rgba(0,0,0,0.06)"}}>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,margin:"0 0 6px",color:"#1c140a"}}>{editSpot?"Edit Spot":"Register New Spot"}</h2>
                <p style={{color:"#c8b89a",fontSize:13,margin:"0 0 28px"}}>Fill in your parking land details</p>
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
                    <button onClick={saveSpot} style={{flex:1,padding:"14px",borderRadius:13,border:"none",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:14,background:saved?"#e8f8ee":"linear-gradient(135deg,#7a5c30,#c8964a)",color:saved?"#1a6e42":"#fff",boxShadow:saved?"none":"0 6px 22px rgba(122,92,48,0.35)",transition:"all 0.3s"}}>{saved?"✓ Spot Saved!":editSpot?"Update Spot":"List My Spot"}</button>
                    <button onClick={()=>setShowAddSpot(false)} style={{padding:"14px 20px",borderRadius:13,border:"1px solid #e0d8cc",background:"transparent",color:"#b0a090",cursor:"pointer",fontWeight:600}}>Cancel</button>
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
                  <div key={s.label} className="card-hover" style={{background:"#fff",border:"1px solid #ede5d8",borderRadius:16,padding:"20px 22px",boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:700,color:s.color}}>{s.count}</div>
                    <div style={{fontSize:12,color:"#b0a090",marginTop:6}}>{s.label} Bookings</div>
                  </div>
                ))}
              </div>
              <div style={{background:"#fff",border:"1px solid #ede5d8",borderRadius:20,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#1c140a",marginBottom:18}}>All Bookings</div>
                <BookingsTable bookings={bookings}/>
              </div>
            </div>
          )}

          {/* ══ EARNINGS ══ */}
          {page==="earnings"&&(
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                {[{label:"Gross Earnings",value:fmt(totalRev),color:"#7a5c30",note:"Before commission"},{label:"Your Share (90%)",value:fmt(totalRev*0.9),color:"#1a6e42",note:"After 10% platform fee"},{label:"Platform Fee (10%)",value:fmt(totalRev*0.1),color:"#8a4a00",note:"ParkEase commission"}].map(c=>(
                  <div key={c.label} className="card-hover" style={{background:"#fff",border:"1px solid #ede5d8",borderRadius:18,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                    <div style={{fontSize:11,color:"#c8b89a",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.8px"}}>{c.label}</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:c.color}}>{c.value}</div>
                    <div style={{fontSize:11,color:"#c8b89a",marginTop:8}}>{c.note}</div>
                  </div>
                ))}
              </div>
              <div style={{background:"#fff",border:"1px solid #ede5d8",borderRadius:20,padding:28,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:24}}>
                  <div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:"#1c140a",marginBottom:4}}>Monthly Earnings</div>
                    <div style={{fontSize:12,color:"#c8b89a"}}>Last 6 months performance</div>
                  </div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:"#7a5c30"}}>{fmt(totalRev)}</div>
                </div>
                <EarnChart data={EARN_MONTHLY}/>
              </div>
              <div style={{background:"#fff",border:"1px solid #ede5d8",borderRadius:20,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                <div style={{padding:"20px 24px",borderBottom:"1px solid #f0ebe0",fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:"#1c140a"}}>Earnings by Spot</div>
                <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:14}}>
                  {[...spots].sort((a,b)=>b.revenue-a.revenue).map(s=>{
                    const max=Math.max(...spots.map(x=>x.revenue));
                    return(
                      <div key={s.id} style={{display:"flex",alignItems:"center",gap:14}}>
                        <div style={{width:52,height:52,borderRadius:12,overflow:"hidden",flexShrink:0,background:"#f0e8d8"}}>
                          {s.photo?<img src={s.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:22,display:"flex",alignItems:"center",justifyContent:"center",height:"100%"}}>🅿</span>}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:13,color:"#1c140a",marginBottom:6}}>{s.name}</div>
                          <div style={{height:8,background:"#f0ebe0",borderRadius:8,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${max>0?(s.revenue/max*100):0}%`,background:"linear-gradient(to right,#7a5c30,#c8964a)",borderRadius:8,transition:"width 1s ease"}}/>
                          </div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#7a5c30"}}>{fmt(s.revenue)}</div>
                          <div style={{fontSize:11,color:"#c8b89a"}}>{s.bookings} bookings</div>
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
                <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#e8a84a,#7a5c30)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:26,color:"#1c140a",flexShrink:0}}>{OWNER.avatar}</div>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:"#f0e8d8",marginBottom:4}}>{OWNER.name}</div>
                  <div style={{fontSize:13,color:"#7a6040",marginBottom:8}}>{OWNER.area} · Joined {OWNER.joined}</div>
                  {OWNER.verified&&<span style={{background:"#1a3a10",color:"#4ade80",padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700}}>✓ Verified Owner</span>}
                </div>
              </div>
              <div style={{background:"#fff",border:"1px solid #ede5d8",borderRadius:20,padding:28,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#1c140a",marginBottom:22}}>Account Details</div>
                <div style={{display:"grid",gap:16}}>
                  <Field label="Full Name"><input defaultValue={OWNER.name} style={inp()}/></Field>
                  <Field label="Email Address"><input defaultValue={OWNER.email} style={inp()}/></Field>
                  <Field label="Phone Number"><input defaultValue={OWNER.phone} style={inp()}/></Field>
                  <Field label="Area / Location"><input defaultValue={OWNER.area} style={inp()}/></Field>
                  <button style={{padding:"13px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#7a5c30,#c8964a)",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",boxShadow:"0 4px 16px rgba(122,92,48,0.3)"}}>Save Changes</button>
                </div>
              </div>
              <div style={{background:"#fff",border:"1px solid #ede5d8",borderRadius:20,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:"#1c140a",marginBottom:16}}>Platform Summary</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[{l:"Total Spots Listed",v:spots.length},{l:"Total Bookings",v:totalBookings},{l:"Total Earnings",v:fmt(totalRev)},{l:"Avg. Rating",v:`⭐ ${spots.length?((spots.reduce((a,s)=>a+s.rating,0)/spots.length).toFixed(1)):"—"}`}].map(r=>(
                    <div key={r.l} style={{background:"#faf8f5",borderRadius:12,padding:"14px 16px",border:"1px solid #f0ebe0"}}>
                      <div style={{fontSize:11,color:"#c8b89a",marginBottom:6}}>{r.l}</div>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"#7a5c30"}}>{r.v}</div>
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
          <tr style={{borderBottom:"1px solid #f0ebe0"}}>
            {["ID","Customer","Vehicle","Spot","Date","Amount","Status"].map(h=>(
              <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:"#c8b89a",letterSpacing:"0.8px",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map(b=>(
            <tr key={b.id} className="row-hover" style={{borderBottom:"1px solid #faf8f5",transition:"background 0.15s"}}>
              <td style={{padding:"12px 14px"}}><span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,color:"#a07840",background:"#f0e8d8",padding:"3px 8px",borderRadius:6}}>{b.id}</span></td>
              <td style={{padding:"12px 14px"}}><div style={{fontWeight:600,fontSize:13,color:"#1c140a"}}>{b.user}</div><div style={{fontSize:11,color:"#c8b89a"}}>{b.phone}</div></td>
              <td style={{padding:"12px 14px",fontSize:12,color:"#8a7060",fontWeight:500}}>{b.vehicle}</td>
              <td style={{padding:"12px 14px",fontSize:12,color:"#6a5040",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.spot}</td>
              <td style={{padding:"12px 14px"}}><div style={{fontSize:12,color:"#1c140a"}}>{b.date}</div><div style={{fontSize:10,color:"#c8b89a"}}>{b.time}</div></td>
              <td style={{padding:"12px 14px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13,color:"#1a6e42"}}>{`₹${b.amount}`}</td>
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
      <label style={{fontSize:11,fontWeight:700,color:"#b0a090",letterSpacing:"0.8px",textTransform:"uppercase",display:"block",marginBottom:8}}>{label}</label>
      {children}
    </div>
  );
}