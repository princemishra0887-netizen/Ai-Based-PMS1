import { useState, useEffect } from "react";

/* ── Data ── */
const SPOTS = [
  {
    id:1, name:"Front Yard – Spot A", owner:"Rajesh Kumar",
    address:"12, MG Road, Ghaziabad, UP 201001", area:"Ghaziabad",
    lat:28.6692, lng:77.4538, type:"Open Air",
    priceHour:30, priceDay:200, rating:4.7, reviews:38,
    status:"active", distance:"0.4 km",
    photo:"https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&q=80",
    amenities:["CCTV","Lighting","Wide Gate"],
    availability:{ mon:true,tue:true,wed:true,thu:true,fri:true,sat:false,sun:false },
    timeFrom:"08:00", timeTo:"20:00", slots:2,
    description:"Spacious open-air yard right off MG Road. Easy drive-in access with a wide gate. CCTV monitored and well-lit at night. Ideal for daily commuters.",
  },
  {
    id:2, name:"Side Lane – Spot B", owner:"Rajesh Kumar",
    address:"12, MG Road, Ghaziabad, UP 201001", area:"Ghaziabad",
    lat:28.6695, lng:77.4542, type:"Covered",
    priceHour:50, priceDay:320, rating:4.9, reviews:61,
    status:"active", distance:"0.6 km",
    photo:"https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&q=80",
    amenities:["CCTV","Covered Roof","Security Guard","EV Charging"],
    availability:{ mon:true,tue:true,wed:true,thu:true,fri:true,sat:true,sun:true },
    timeFrom:"00:00", timeTo:"23:59", slots:1,
    description:"Fully covered spot with 24/7 security guard. EV charging point available. Perfect for overnight stays or long-day parking. Rain and sun protected.",
  },
  {
    id:3, name:"Basement – Spot C", owner:"Priya Sharma",
    address:"7, Vaishali Sector 4, Ghaziabad, UP 201010", area:"Vaishali",
    lat:28.6450, lng:77.3500, type:"Basement",
    priceHour:40, priceDay:260, rating:4.5, reviews:22,
    status:"active", distance:"1.2 km",
    photo:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    amenities:["CCTV","Lighting","Elevator Access"],
    availability:{ mon:true,tue:true,wed:true,thu:true,fri:true,sat:true,sun:false },
    timeFrom:"06:00", timeTo:"22:00", slots:3,
    description:"Underground basement spot in a residential complex. Very secure with elevator access. Ground floor entry is smooth for all car types.",
  },
  {
    id:4, name:"Mathura Town Center – Spot A", owner:"Govind Sharma",
    address:"Krishna Nagar, Mathura, UP 281001", area:"Mathura",
    lat:27.5031, lng:77.6740, type:"Covered",
    priceHour:20, priceDay:150, rating:4.6, reviews:29,
    status:"active", distance:"0.3 km",
    photo:"https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&q=80",
    amenities:["CCTV","Covered Roof","Lighting"],
    availability:{ mon:true,tue:true,wed:true,thu:true,fri:true,sat:true,sun:true },
    timeFrom:"07:00", timeTo:"22:00", slots:4,
    description:"Prime covered parking in Mathura city center. Safe and well-monitored. Perfect for shopping and temple visits.",
  },
  {
    id:5, name:"Mathura Main Street – Open Lot", owner:"Meera Patel",
    address:"Main Bazaar, Mathura, UP 281001", area:"Mathura",
    lat:27.5020, lng:77.6750, type:"Open Air",
    priceHour:15, priceDay:100, rating:4.4, reviews:18,
    status:"active", distance:"0.5 km",
    photo:"https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&q=80",
    amenities:["CCTV","Lighting"],
    availability:{ mon:true,tue:true,wed:true,thu:true,fri:true,sat:true,sun:true },
    timeFrom:"06:00", timeTo:"23:00", slots:6,
    description:"Large open parking lot near Mathura's main market. Good for short-term parking. Well-lit area with CCTV coverage.",
  },
  {
    id:6, name:"Mathura Temple Parking – Premium", owner:"Ram Kumar",
    address:"Radhakund Road, Mathura,  UP 281001", area:"Mathura",
    lat:27.5010, lng:77.6760, type:"Basement",
    priceHour:25, priceDay:180, rating:4.8, reviews:42,
    status:"active", distance:"0.7 km",
    photo:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    amenities:["CCTV","Security Guard","24/7 Access","EV Charging"],
    availability:{ mon:true,tue:true,wed:true,thu:true,fri:true,sat:true,sun:true },
    timeFrom:"00:00", timeTo:"23:59", slots:5,
    description:"Safe, secure basement parking near temples. 24/7 access and professional security team. Premium parking experience.",
  },
];

const DAYS = ["mon","tue","wed","thu","fri","sat","sun"];
const DAY_L = ["Mo","Tu","We","Th","Fr","Sa","Su"];
const TYPE_COLOR = { "Open Air":"text-yellow-400", "Covered":"text-blue-400", "Basement":"text-purple-400" };
const TYPE_BG = { "Open Air":"bg-yellow-400/10", "Covered":"bg-blue-400/10", "Basement":"bg-purple-400/10" };
const TYPE_BORDER = { "Open Air":"border-yellow-400/30", "Covered":"border-blue-400/30", "Basement":"border-purple-400/30" };

function stars(n) { 
  return "★".repeat(Math.floor(n)) + (n%1>=0.5?"½":"") + "☆".repeat(5-Math.ceil(n)); 
}

/* ══════════════════════════════════════
   MAIN APP
══════════════════════════════════════ */
export default function BookParkingSpot(){
  const [page, setPage] = useState("browse");
  const [spots] = useState(SPOTS);
  const [chosen, setChosen] = useState(null);
  const [bookingData, setBookingData] = useState(null);

  // filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterDay, setFilterDay] = useState("All");
  const [sortBy, setSortBy] = useState("rating");
  const [filterDate, setFilterDate] = useState("");

  const filtered = spots
    .filter(s => {
      const q = search.toLowerCase();
      const dayIndex = filterDate ? new Date(filterDate).getDay() : (filterDay === "All" ? -1 : DAYS.indexOf(filterDay));
      const dayCheck = filterDate ? (dayIndex === 0 ? s.availability.sun : s.availability[DAYS[dayIndex]]) : (filterDay==="All" || s.availability[filterDay]);
      return (!q || s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q) || s.area.toLowerCase().includes(q))
        && (filterType==="All" || s.type===filterType)
        && dayCheck;
    })
    .sort((a,b) => sortBy==="price" ? a.priceHour-b.priceHour : sortBy==="rating" ? b.rating-a.rating : parseFloat(a.distance)-parseFloat(b.distance));

  function goBook(spot){ setChosen(spot); setPage("book"); }
  function goDetail(spot){ setChosen(spot); setPage("detail"); }
  function goConfirm(data){ setBookingData(data); setPage("confirm"); }

  return(
    <div className="min-h-screen bg-[#080a0f] text-gray-200 font-['Outfit',sans-serif]"
         style={{
           backgroundImage: "radial-gradient(ellipse at 10% 0%,#0d1a2a 0%,transparent 55%), radial-gradient(ellipse at 90% 100%,#150d2a 0%,transparent 55%)"
         }}>

      {/* ── NAV ── */}
      <nav className="bg-[#080a0f]/90 backdrop-blur-xl border-b border-[#13161f] px-7 flex items-center justify-between h-[62px] sticky top-0 z-200">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={()=>setPage("browse")}>
          <div className="w-9 h-9 bg-gradient-to-br from-[#63d2ff] to-[#3a8fff] rounded-[10px] flex items-center justify-center text-lg shadow-[0_0_16px_#63d2ff44]">
            🅿
          </div>
          <span className="font-extrabold text-lg tracking-tight">ParkEase</span>
        </div>
        <div className="flex gap-2 items-center">
          {page!=="browse"&&(
            <button onClick={()=>setPage("browse")}
              className="bg-transparent border border-[#1e2230] rounded-lg px-4 py-1.5 text-gray-500 cursor-pointer text-xs font-medium hover:border-[#63d2ff] hover:text-[#63d2ff] transition-colors">
              ← Browse Spots
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#63d2ff] to-[#3a8fff] flex items-center justify-center font-extrabold text-xs text-[#080a0f]">
            U
          </div>
        </div>
      </nav>

      {/* ══ BROWSE ══ */}
      {page==="browse"&&(
        <div className="max-w-[1060px] mx-auto px-5 py-10 animate-[fadeUp_0.4s_ease]">
          {/* Hero */}
          <div className="text-center mb-11">
            <div className="text-xs font-semibold tracking-[3px] text-[#63d2ff] uppercase mb-3">
              Find Parking Near You
            </div>
            <h1 className="font-['Outfit',sans-serif] text-[clamp(28px,5vw,48px)] font-black m-0 mb-3.5 leading-tight tracking-tight bg-gradient-to-r from-white to-[#63d2ff] bg-clip-text text-transparent">
              Book a Parking Spot<br/>in Seconds
            </h1>
            <p className="text-gray-600 text-sm max-w-[420px] mx-auto leading-relaxed">
              Real land owners. Real spots. Affordable hourly & daily rates.
            </p>
          </div>

          {/* Search + Filters */}
          <div className="bg-[#0d0f14] border border-[#1e2230] rounded-xl p-5 mb-8 flex flex-wrap gap-3 items-center">
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="🔍  Search by name, area or address..."
              className="flex-1 min-w-[180px] bg-[#0d0f14] border border-[#1e2230] rounded-[10px] px-3.5 py-3 text-gray-200 text-sm font-['Outfit',sans-serif] focus:border-[#63d2ff] focus:shadow-[0_0_0_3px_rgba(99,210,255,0.12)] focus:outline-none transition-all"/>
            <input value={filterDate} onChange={e=>setFilterDate(e.target.value)} type="date"
              className="w-[140px] bg-[#0d0f14] border border-[#1e2230] rounded-[10px] px-3.5 py-3 text-gray-200 text-sm font-['Outfit',sans-serif] focus:border-[#63d2ff] focus:shadow-[0_0_0_3px_rgba(99,210,255,0.12)] focus:outline-none"/>
            <select value={filterType} onChange={e=>setFilterType(e.target.value)} 
              className="w-[140px] bg-[#0d0f14] border border-[#1e2230] rounded-[10px] px-3.5 py-3 text-gray-200 text-sm font-['Outfit',sans-serif] focus:border-[#63d2ff] focus:shadow-[0_0_0_3px_rgba(99,210,255,0.12)] focus:outline-none">
              <option value="All">All Types</option>
              {["Open Air","Covered","Basement"].map(t=><option key={t}>{t}</option>)}
            </select>
            <select value={filterDay} onChange={e=>setFilterDay(e.target.value)} 
              className="w-[130px] bg-[#0d0f14] border border-[#1e2230] rounded-[10px] px-3.5 py-3 text-gray-200 text-sm font-['Outfit',sans-serif] focus:border-[#63d2ff] focus:shadow-[0_0_0_3px_rgba(99,210,255,0.12)] focus:outline-none">
              <option value="All">Any Day</option>
              {DAYS.map((d,i)=><option key={d} value={d}>{["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][i]}</option>)}
            </select>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} 
              className="w-[140px] bg-[#0d0f14] border border-[#1e2230] rounded-[10px] px-3.5 py-3 text-gray-200 text-sm font-['Outfit',sans-serif] focus:border-[#63d2ff] focus:shadow-[0_0_0_3px_rgba(99,210,255,0.12)] focus:outline-none">
              <option value="rating">Top Rated</option>
              <option value="price">Lowest Price</option>
              <option value="distance">Nearest</option>
            </select>
            {/* City Selector */}
            <div className="flex gap-2 ml-auto">
              {["Ghaziabad","Mathura"].map(city=>(
                <button key={city} onClick={()=>setSearch(city)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${search.includes(city) ? "bg-gradient-to-r from-[#63d2ff] to-[#3a8fff] text-[#080a0f]" : "bg-[#13161f] text-gray-400 border border-[#1e2230] hover:border-[#63d2ff]"}`}>
                  📍 {city}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div className="text-xs text-gray-600 mb-5">
            Showing <span className="text-[#63d2ff] font-bold">{filtered.length}</span> available spot{filtered.length!==1?"s":""}
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
            {filtered.map((spot,i)=>(
              <div key={spot.id} className="spot-card bg-[#0d0f14] border border-[#1a1d28] rounded-xl overflow-hidden animate-[fadeUp_0.4s_ease_both] hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(0,0,0,0.5)] transition-all duration-250"
                   style={{animationDelay: `${i*0.06}s`}}>
                {/* Photo */}
                <div className="h-[170px] relative overflow-hidden cursor-pointer" onClick={()=>goDetail(spot)}>
                  <img src={spot.photo} alt={spot.name} 
                    className="w-full h-full object-cover transition-transform duration-400 hover:scale-105"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080a0f]/70 to-transparent"/>
                  <div className={`absolute top-3 left-3 ${TYPE_BG[spot.type]} border ${TYPE_BORDER[spot.type]} rounded-lg px-2.5 py-1 text-xs font-bold ${TYPE_COLOR[spot.type]}`}>
                    {spot.type}
                  </div>
                  <div className="absolute top-3 right-3 bg-[#080a0f]/80 backdrop-blur-md rounded-lg px-2.5 py-1 text-xs font-bold text-[#63d2ff]">
                    📍 {spot.distance}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <div>
                      <div className="font-extrabold text-base tracking-tight">{spot.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{spot.area}</div>
                    </div>
                  </div>
                </div>
                {/* Body */}
                <div className="p-4 pt-3.5">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex gap-4">
                      <div>
                        <span className="text-2xl font-extrabold text-[#63d2ff] font-['Outfit',sans-serif]">₹{spot.priceHour}</span>
                        <span className="text-xs text-gray-600">/hr</span>
                      </div>
                      <div>
                        <span className="text-2xl font-extrabold text-yellow-400 font-['Outfit',sans-serif]">₹{spot.priceDay}</span>
                        <span className="text-xs text-gray-600">/day</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 text-xs">{stars(spot.rating)}</div>
                      <div className="text-xs text-gray-600">{spot.rating} · {spot.reviews} reviews</div>
                    </div>
                  </div>
                  {/* Day chips */}
                  <div className="flex gap-1 mb-3">
                    {DAYS.map((d,i)=>(
                      <div key={d} className={`flex-1 h-5 rounded flex items-center justify-center text-[8px] font-bold border
                        ${spot.availability[d] ? 'bg-[#0a1e2a] border-[#63d2ff]/30 text-[#63d2ff]' : 'bg-[#111318] border-[#1a1d28] text-[#2a2d38]'}`}>
                        {DAY_L[i]}
                      </div>
                    ))}
                  </div>
                  {/* Amenities */}
                  <div className="flex gap-1.5 flex-wrap mb-3.5">
                    {spot.amenities.slice(0,3).map(a=>(
                      <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-[#13161f] text-gray-500 border border-[#1e2230]">
                        {a}
                      </span>
                    ))}
                    {spot.amenities.length>3&&<span className="text-[10px] text-gray-600">+{spot.amenities.length-3} more</span>}
                  </div>
                  {/* CTAs */}
                  <div className="flex gap-2">
                    <button onClick={()=>goDetail(spot)}
                      className="flex-1 py-2.5 rounded-[10px] border border-[#1e2230] bg-transparent text-gray-500 text-xs font-semibold cursor-pointer hover:border-[#63d2ff] hover:text-[#63d2ff] transition-all">
                      View Details
                    </button>
                    <button onClick={()=>goBook(spot)}
                      className="flex-[2] py-2.5 rounded-[10px] border-none bg-gradient-to-r from-[#63d2ff] to-[#3a8fff] text-[#080a0f] text-xs font-extrabold cursor-pointer shadow-[0_4px_18px_rgba(99,210,255,0.25)] hover:shadow-[0_6px_28px_rgba(99,210,255,0.45)] transition-shadow">
                      Book Now →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length===0&&(
            <div className="text-center py-20 text-gray-700">
              <div className="text-5xl mb-4">🔍</div>
              <div className="font-bold text-lg text-gray-600 mb-2">No spots found</div>
              <div className="text-sm">Try changing your search or filters</div>
            </div>
          )}
        </div>
      )}

      {/* ══ DETAIL ══ */}
      {page==="detail"&&chosen&&(
        <div className="max-w-[900px] mx-auto px-5 py-9 animate-[fadeUp_0.35s_ease]">
          <div className="grid grid-cols-2 gap-7">
            {/* Left */}
            <div>
              <div className="rounded-lg overflow-hidden h-[280px] mb-4.5 relative">
                <img src={chosen.photo} alt="" className="w-full h-full object-cover"/>
                <div className={`absolute top-3.5 left-3.5 ${TYPE_BG[chosen.type]} border ${TYPE_BORDER[chosen.type]} rounded-lg px-3 py-1.5 text-xs font-bold ${TYPE_COLOR[chosen.type]}`}>
                  {chosen.type}
                </div>
              </div>
              <div className="bg-[#0d0f14] border border-[#1a1d28] rounded-xl p-5.5">
                <div className="text-xs text-gray-600 tracking-wide uppercase mb-2.5">About this spot</div>
                <p className="text-sm leading-relaxed text-gray-400 m-0 mb-4.5">{chosen.description}</p>
                <div className="text-xs text-gray-600 tracking-wide uppercase mb-2.5">Amenities</div>
                <div className="flex flex-wrap gap-2">
                  {chosen.amenities.map(a=>(
                    <span key={a} className="bg-[#0a1e2a] text-[#63d2ff] px-3.5 py-1.5 rounded-full text-xs font-semibold border border-[#63d2ff]/20">
                      ✓ {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {/* Right */}
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex gap-2 items-center mb-1.5">
                  <span className="bg-[#1c2b12] text-[#c8f53a] text-[10px] px-2.5 py-0.5 rounded-full font-bold">ACTIVE</span>
                  <span className="text-xs text-gray-600">Owner: {chosen.owner}</span>
                </div>
                <h1 className="font-['Outfit',sans-serif] text-2xl font-extrabold m-0 mb-1.5 tracking-tight">{chosen.name}</h1>
                <div className="text-xs text-gray-500 mb-1">📍 {chosen.address}</div>
                <div className="text-yellow-400 text-xs mb-0.5">{stars(chosen.rating)} <span className="text-gray-500">{chosen.rating} ({chosen.reviews} reviews)</span></div>
              </div>

              {/* Pricing card */}
              <div className="bg-[#0d0f14] border border-[#1a1d28] rounded-xl p-5.5">
                <div className="text-xs text-gray-600 tracking-wide uppercase mb-3.5">Pricing</div>
                <div className="flex gap-6">
                  <div>
                    <div className="font-['Outfit',sans-serif] text-4xl font-black text-[#63d2ff] leading-none">₹{chosen.priceHour}</div>
                    <div className="text-xs text-gray-600 mt-1">per hour</div>
                  </div>
                  <div className="w-px bg-[#1a1d28]"/>
                  <div>
                    <div className="font-['Outfit',sans-serif] text-4xl font-black text-yellow-400 leading-none">₹{chosen.priceDay}</div>
                    <div className="text-xs text-gray-600 mt-1">per day</div>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="bg-[#0d0f14] border border-[#1a1d28] rounded-xl p-5.5">
                <div className="text-xs text-gray-600 tracking-wide uppercase mb-3">Availability</div>
                <div className="flex gap-1.5 mb-3">
                  {DAYS.map((d,i)=>(
                    <div key={d} className={`flex-1 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold border
                      ${chosen.availability[d] ? 'bg-[#0a1e2a] border-[#63d2ff]/30 text-[#63d2ff]' : 'bg-[#0d0f14] border-[#1a1d28] text-gray-600'}`}>
                      {DAY_L[i]}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500">⏰ {chosen.timeFrom} – {chosen.timeTo}</div>
              </div>

              {/* Spots */}
              <div className="bg-[#0a1e2a] border border-[#63d2ff]/20 rounded-xl p-4 pl-5.5 flex items-center gap-3.5">
                <div className="text-2xl">🚗</div>
                <div>
                  <div className="font-['Outfit',sans-serif] text-xl font-extrabold text-[#63d2ff]">{chosen.slots} slot{chosen.slots!==1?"s":""} available</div>
                  <div className="text-xs text-gray-600">Real-time availability</div>
                </div>
              </div>

              <button onClick={()=>goBook(chosen)}
                className="py-4 rounded-xl border-none bg-gradient-to-r from-[#63d2ff] to-[#3a8fff] text-[#080a0f] font-['Outfit',sans-serif] font-black text-base cursor-pointer shadow-[0_6px_30px_rgba(99,210,255,0.3)] tracking-tight animate-[pulse_2s_infinite]">
                Reserve This Spot →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ BOOK ══ */}
      {page==="book"&&chosen&&(
        <BookingForm spot={chosen} onConfirm={goConfirm} onBack={()=>setPage("browse")}/>
      )}

      {/* ══ CONFIRM ══ */}
      {page==="confirm"&&bookingData&&(
        <ConfirmScreen data={bookingData} onDone={()=>setPage("browse")}/>
      )}
    </div>
  );
}

/* ══ BOOKING FORM ══ */
function BookingForm({spot, onConfirm, onBack}){
  const [form, setForm] = useState({
    name:"", phone:"", vehicle:"", vehicleType:"Car",
    booking_date:"", timeFrom:"", timeTo:"", durationType:"hourly",
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const dateToday = new Date().toISOString().split("T")[0];

  function calcTotal(){
    if(form.durationType==="daily") return spot.priceDay;
    if(!form.timeFrom||!form.timeTo) return 0;
    const [h1,m1]=form.timeFrom.split(":").map(Number);
    const [h2,m2]=form.timeTo.split(":").map(Number);
    const hours = ((h2*60+m2)-(h1*60+m1))/60;
    return hours>0 ? Math.round(hours*spot.priceHour) : 0;
  }

  function next(){
    if(step<3) setStep(step+1);
    else {
      setLoading(true);
      setTimeout(()=>{
        setLoading(false);
        onConfirm({ spot, form, total:calcTotal(), bookingId:"PK"+Math.random().toString(36).slice(2,8).toUpperCase() });
      }, 1800);
    }
  }

  const canNext = step===1
    ? form.name&&form.phone&&form.vehicle
    : step===2
    ? form.booking_date&&(form.durationType==="daily"||( form.timeFrom&&form.timeTo&&calcTotal()>0))
    : true;

  return(
    <div className="max-w-[560px] mx-auto px-5 py-9 animate-[fadeUp_0.35s_ease]">
      <button onClick={onBack}
        className="bg-transparent border-none text-gray-500 cursor-pointer text-xs mb-7 flex items-center gap-1.5 p-0 hover:text-[#63d2ff] transition-colors">
        ← Back
      </button>

      {/* Spot summary strip */}
      <div className="bg-[#0d0f14] border border-[#1a1d28] rounded-xl p-3.5 pl-4.5 flex gap-3.5 items-center mb-7">
        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
          <img src={spot.photo} alt="" className="w-full h-full object-cover"/>
        </div>
        <div className="flex-1">
          <div className="font-bold text-sm">{spot.name}</div>
          <div className="text-xs text-gray-600 mt-0.5">📍 {spot.area} · {spot.type}</div>
        </div>
        <div className="text-right">
          <div className="font-['Outfit',sans-serif] font-extrabold text-lg text-[#63d2ff]">₹{spot.priceHour}/hr</div>
          <div className="text-xs text-gray-600">₹{spot.priceDay}/day</div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-0 mb-8 relative">
        {["Your Details","Schedule","Review"].map((s,i)=>(
          <div key={s} className="flex-1 text-center relative">
            <div className={`w-7 h-7 rounded-full mx-auto mb-2 flex items-center justify-center text-xs font-bold z-10 relative
              ${step>i+1 ? 'bg-[#63d2ff] border-2 border-[#63d2ff] text-[#080a0f]' : 
                step===i+1 ? 'bg-gradient-to-r from-[#63d2ff] to-[#3a8fff] border-2 border-[#63d2ff] text-[#080a0f]' : 
                'bg-[#13161f] border-2 border-[#1e2230] text-gray-600'}`}>
              {step>i+1 ? "✓" : i+1}
            </div>
            {i<2&&<div className={`absolute top-3.5 left-1/2 w-full h-0.5 z-0
              ${step>i+1 ? 'bg-[#63d2ff]/20' : 'bg-[#13161f]'}`}/>}
            <div className={`text-xs font-semibold ${step===i+1 ? 'text-[#63d2ff]' : 'text-gray-600'}`}>{s}</div>
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step===1&&(
        <div className="grid gap-4.5 animate-[fadeUp_0.3s_ease]">
          <h2 className="font-['Outfit',sans-serif] text-xl font-extrabold m-0 mb-1 tracking-tight">Your Details</h2>
          <div>
            <label className="text-xs font-semibold text-gray-600 tracking-wide uppercase block mb-1.5">Full Name</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
              placeholder="Aditya Sharma" 
              className="w-full bg-[#0d0f14] border border-[#1e2230] rounded-[10px] px-3.5 py-3 text-gray-200 text-sm font-['Outfit',sans-serif] focus:border-[#63d2ff] focus:shadow-[0_0_0_3px_rgba(99,210,255,0.12)] focus:outline-none"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 tracking-wide uppercase block mb-1.5">Phone Number</label>
            <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}
              placeholder="+91 98765 43210" type="tel"
              className="w-full bg-[#0d0f14] border border-[#1e2230] rounded-[10px] px-3.5 py-3 text-gray-200 text-sm font-['Outfit',sans-serif] focus:border-[#63d2ff] focus:shadow-[0_0_0_3px_rgba(99,210,255,0.12)] focus:outline-none"/>
          </div>
          <div className="grid grid-cols-[2fr,1fr] gap-3.5">
            <div>
              <label className="text-xs font-semibold text-gray-600 tracking-wide uppercase block mb-1.5">Vehicle Number</label>
              <input value={form.vehicle} onChange={e=>setForm(f=>({...f,vehicle:e.target.value}))}
                placeholder="UP 14 AB 1234"
                className="w-full bg-[#0d0f14] border border-[#1e2230] rounded-[10px] px-3.5 py-3 text-gray-200 text-sm font-['Outfit',sans-serif] focus:border-[#63d2ff] focus:shadow-[0_0_0_3px_rgba(99,210,255,0.12)] focus:outline-none"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 tracking-wide uppercase block mb-1.5">Type</label>
              <select value={form.vehicleType} onChange={e=>setForm(f=>({...f,vehicleType:e.target.value}))} 
                className="w-full bg-[#0d0f14] border border-[#1e2230] rounded-[10px] px-3.5 py-3 text-gray-200 text-sm font-['Outfit',sans-serif] focus:border-[#63d2ff] focus:shadow-[0_0_0_3px_rgba(99,210,255,0.12)] focus:outline-none">
                {["Car","Bike","SUV","Truck"].map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step===2&&(
        <div className="grid gap-4.5 animate-[fadeUp_0.3s_ease]">
          <h2 className="font-['Outfit',sans-serif] text-xl font-extrabold m-0 mb-1 tracking-tight">Pick Your Schedule</h2>
          <div>
            <label className="text-xs font-semibold text-gray-600 tracking-wide uppercase block mb-1.5">Date</label>
            <input value={form.booking_date} onChange={e=>setForm(f=>({...f,booking_date:e.target.value}))}
              type="date" min={dateToday} 
              className="w-full bg-[#0d0f14] border border-[#1e2230] rounded-[10px] px-3.5 py-3 text-gray-200 text-sm font-['Outfit',sans-serif] focus:border-[#63d2ff] focus:shadow-[0_0_0_3px_rgba(99,210,255,0.12)] focus:outline-none"/>
          </div>
          {/* Duration type toggle */}
          <div>
            <label className="text-xs font-semibold text-gray-600 tracking-wide uppercase block mb-2.5">Booking Type</label>
            <div className="flex bg-[#0d0f14] border border-[#1e2230] rounded-xl p-1 gap-1">
              {["hourly","daily"].map(t=>(
                <button key={t} onClick={()=>setForm(f=>({...f,durationType:t}))}
                  className={`flex-1 py-2.5 rounded-lg border-none cursor-pointer font-bold text-xs transition-all
                    ${form.durationType===t ? 'bg-gradient-to-r from-[#63d2ff] to-[#3a8fff] text-[#080a0f]' : 'bg-transparent text-gray-500'}`}>
                  {t==="hourly"?`Hourly · ₹${spot.priceHour}/hr`:`Full Day · ₹${spot.priceDay}`}
                </button>
              ))}
            </div>
          </div>
          {form.durationType==="hourly"&&(
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-600 tracking-wide uppercase block mb-1.5">From</label>
                <input value={form.timeFrom} onChange={e=>setForm(f=>({...f,timeFrom:e.target.value}))}
                  type="time" min={spot.timeFrom} max={spot.timeTo}
                  className="w-full bg-[#0d0f14] border border-[#1e2230] rounded-[10px] px-3.5 py-3 text-gray-200 text-sm font-['Outfit',sans-serif] focus:border-[#63d2ff] focus:shadow-[0_0_0_3px_rgba(99,210,255,0.12)] focus:outline-none"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 tracking-wide uppercase block mb-1.5">To</label>
                <input value={form.timeTo} onChange={e=>setForm(f=>({...f,timeTo:e.target.value}))}
                  type="time" min={spot.timeFrom} max={spot.timeTo}
                  className="w-full bg-[#0d0f14] border border-[#1e2230] rounded-[10px] px-3.5 py-3 text-gray-200 text-sm font-['Outfit',sans-serif] focus:border-[#63d2ff] focus:shadow-[0_0_0_3px_rgba(99,210,255,0.12)] focus:outline-none"/>
              </div>
            </div>
          )}
          {calcTotal()>0&&(
            <div className="bg-[#0a1e2a] border border-[#63d2ff]/20 rounded-xl p-3.5 pl-4.5 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {form.durationType==="daily"?"Full day booking":
                  `${form.timeFrom} – ${form.timeTo}`}
              </span>
              <span className="font-['Outfit',sans-serif] text-2xl font-black text-[#63d2ff]">₹{calcTotal()}</span>
            </div>
          )}
        </div>
      )}

      {/* Step 3 – Review */}
      {step===3&&(
        <div className="animate-[fadeUp_0.3s_ease]">
          <h2 className="font-['Outfit',sans-serif] text-xl font-extrabold m-0 mb-5 tracking-tight">Review & Confirm</h2>
          <div className="bg-[#0d0f14] border border-[#1a1d28] rounded-xl overflow-hidden mb-4.5">
            {[
              ["Spot",spot.name],["Location",spot.address],
              ["Name",form.name],["Phone",form.phone],
              ["Vehicle",`${form.vehicle} (${form.vehicleType})`],
              ["Date",form.booking_date],
              ["Time",form.durationType==="daily"?"Full Day":`${form.timeFrom} – ${form.timeTo}`],
            ].map(([k,v],i)=>(
              <div key={k} className={`flex justify-between px-5 py-3.5 ${i<6 ? 'border-b border-[#13161f]' : ''}`}>
                <span className="text-xs text-gray-600 font-medium">{k}</span>
                <span className="text-xs font-semibold text-gray-200 text-right max-w-[60%]">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-r from-[#0a1e2a] to-[#0d1a28] border border-[#63d2ff]/20 rounded-xl p-4.5 pl-5.5 flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-600 mb-1">Total Amount</div>
              <div className="text-xs text-gray-700">{form.durationType==="daily"?"1 day":"Hourly"} · {spot.name}</div>
            </div>
            <div className="font-['Outfit',sans-serif] text-3xl font-black text-[#63d2ff]">₹{calcTotal()}</div>
          </div>
          <div className="mt-3.5 text-xs text-gray-700 leading-relaxed px-1">
            🔒 Payment collected on arrival. Booking confirmed immediately after submission.
          </div>
        </div>
      )}

      {/* Nav buttons */}
      <div className="flex gap-2.5 mt-7">
        {step>1&&(
          <button onClick={()=>setStep(step-1)}
            className="py-3.5 px-5 rounded-xl border border-[#1e2230] bg-transparent text-gray-500 font-semibold cursor-pointer text-sm hover:border-[#63d2ff] hover:text-[#63d2ff] transition-colors">
            ← Back
          </button>
        )}
        <button onClick={next} disabled={!canNext||loading}
          className={`flex-1 py-3.5 rounded-xl border-none font-['Outfit',sans-serif] font-black text-sm flex items-center justify-center gap-2 transition-all
            ${canNext && !loading ? 'bg-gradient-to-r from-[#63d2ff] to-[#3a8fff] text-[#080a0f] shadow-[0_6px_28px_rgba(99,210,255,0.3)] cursor-pointer' : 'bg-[#13161f] text-gray-600 cursor-not-allowed'}`}>
          {loading
            ? <><div className="w-4 h-4 rounded-full border-3 border-[#080a0f]/30 border-t-[#080a0f] animate-spin"/>Confirming…</>
            : step===3 ? "Confirm Booking →" : step===2 ? "Review Booking →" : "Continue →"
          }
        </button>
      </div>
    </div>
  );
}

/* ══ CONFIRM SCREEN ══ */
function ConfirmScreen({data, onDone}){
  const {spot,form,total,bookingId} = data;
  const [show,setShow]=useState(false);
  useEffect(()=>{ setTimeout(()=>setShow(true),100); },[]);

  const confettiPieces = Array.from({length:18},(_,i)=>({
    id:i, color:["#63d2ff","#f7c948","#c8f53a","#c084fc","#f97316"][i%5],
    left:`${5+i*5}%`, delay:`${i*0.08}s`, size:8+Math.random()*8
  }));

  return(
    <div className="max-w-[500px] mx-auto px-5 py-16 text-center animate-[fadeUp_0.4s_ease] relative">
      {/* Confetti */}
      {show&&confettiPieces.map(c=>(
        <div key={c.id} className="fixed top-[20%] pointer-events-none z-[999] animate-[confetti_1.2s_ease_forwards]"
             style={{
               left: c.left,
               width: c.size,
               height: c.size,
               backgroundColor: c.color,
               borderRadius: '2px',
               animationDelay: c.delay
             }}/>
      ))}

      <div className="w-20 h-20 rounded-full mx-auto mb-6 bg-gradient-to-r from-[#63d2ff] to-[#3a8fff] flex items-center justify-center text-4xl shadow-[0_0_48px_rgba(99,210,255,0.5)]">
        ✓
      </div>

      <h1 className="font-['Outfit',sans-serif] text-3xl font-black m-0 mb-2 tracking-tight bg-gradient-to-r from-white to-[#63d2ff] bg-clip-text text-transparent">
        Booking Confirmed!
      </h1>
      <p className="text-gray-600 text-sm m-0 mb-8 leading-relaxed">
        Your spot is reserved. Show the booking ID at the parking.
      </p>

      {/* Booking ticket */}
      <div className="bg-[#0d0f14] border border-[#1a1d28] rounded-xl overflow-hidden mb-6 text-left">
        {/* Ticket header */}
        <div className="bg-gradient-to-r from-[#0a1e2a] to-[#0d1428] px-6 py-5 border-b border-[#13161f]">
          <div className="text-xs text-[#63d2ff] tracking-wider uppercase mb-2">Booking ID</div>
          <div className="font-['Outfit',sans-serif] text-3xl font-black tracking-wider text-[#63d2ff]">{bookingId}</div>
        </div>
        {/* Ticket body */}
        <div className="py-1.5">
          {[
            ["Spot",spot.name],["Address",spot.address],
            ["Name",form.name],["Vehicle",`${form.vehicle} · ${form.vehicleType}`],
            ["Date",form.booking_date],["Time",form.durationType==="daily"?"Full Day":`${form.timeFrom} – ${form.timeTo}`],
          ].map(([k,v],i)=>(
            <div key={k} className={`flex justify-between px-6 py-2.5 ${i<5 ? 'border-b border-[#0f1116]' : ''}`}>
              <span className="text-xs text-gray-600">{k}</span>
              <span className="text-xs font-semibold text-gray-200">{v}</span>
            </div>
          ))}
        </div>
        {/* Ticket footer */}
        <div className="bg-[#0a1e2a] px-6 py-4 flex justify-between items-center border-t border-dashed border-[#1e2230]">
          <div className="text-xs text-gray-600">Total (pay on arrival)</div>
          <div className="font-['Outfit',sans-serif] text-2xl font-black text-[#63d2ff]">₹{total}</div>
        </div>
      </div>

      <button onClick={onDone}
        className="w-full py-3.5 rounded-xl border-none bg-gradient-to-r from-[#63d2ff] to-[#3a8fff] text-[#080a0f] font-['Outfit',sans-serif] font-black text-sm cursor-pointer shadow-[0_6px_28px_rgba(99,210,255,0.3)]">
        Book Another Spot →
      </button>
    </div>
  );
}