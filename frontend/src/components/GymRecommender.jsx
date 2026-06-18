import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, Star, Phone, Award, Target, Sliders, X, 
  Dumbbell, Check, AlertTriangle, RefreshCw, Loader2, Navigation 
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Absolute fallback coords if browser GPS is blocked
const HYDERABAD_CENTER = [17.3850, 78.4867];

// Haversine Formula to calculate exact real-world distance mathematically
function calculateRealDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

// Custom Gym Marker (Gold Theme)
const premiumGymIcon = new L.DivIcon({
  html: `
    <div style="position: relative; display: flex; justify-content: center; align-items: center;">
      <div style="position: absolute; width: 32px; height: 32px; background: rgba(255, 215, 0, 0.3); border-radius: 50%; animation: pulse 2s infinite;"></div>
      <div style="background: #111111; border: 2px solid #FFD700; width: 22px; height: 22px; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 0 10px #FFD700;">
        <div style="background: #FFD700; width: 8px; height: 8px; border-radius: 50%;"></div>
      </div>
    </div>
  `,
  className: 'custom-gym-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// NEW: Live User GPS Tracker Marker (Neon Blue Radar Theme)
const liveTrackerIcon = new L.DivIcon({
  html: `
    <div style="position: relative; display: flex; justify-content: center; align-items: center;">
      <div style="position: absolute; width: 40px; height: 40px; background: rgba(0, 191, 255, 0.2); border-radius: 50%; animation: pulse 1.5s infinite;"></div>
      <div style="background: #00BFFF; border: 2px solid #FFFFFF; width: 16px; height: 16px; border-radius: 50%; box-shadow: 0 0 12px #00BFFF;"></div>
    </div>
  `,
  className: 'live-user-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// Component to handle dynamic map centering smoothly
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true, duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function GymRecommender() {
  const [showModal, setShowModal] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formInputs, setFormInputs] = useState({
    area: '',
    minRating: 4.0,
    maxCost: 4000,
    maxDistance: 5
  });

  const [userLocation, setUserLocation] = useState(HYDERABAD_CENTER);
  const [mapCenter, setMapCenter] = useState(HYDERABAD_CENTER);
  const [mapZoom, setMapZoom] = useState(13);
  const [topPicks, setTopPicks] = useState([]);
  const [selectedGym, setSelectedGym] = useState(null);
  const [assignedGym, setAssignedGym] = useState(null);
  
  // New tracking state to let user toggled map auto-centering on movement
  const [isTrackingActive, setIsTrackingActive] = useState(true);

  // Safe client check for localStorage hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fitnova_assigned_gym');
      if (saved) {
        setAssignedGym(JSON.parse(saved));
      }
    }
  }, []);

  // 📡 NEW: REBUILT LIVE HARDWARE GPS TRACKER PIPELINE
  useEffect(() => {
    let watchId = null;

    if (typeof window !== 'undefined' && navigator.geolocation) {
      // Configuration options for high accuracy mobile tracking
      const gpsOptions = {
        enableHighAccuracy: true, // Forces hardware GPS chips instead of loose cellular triangulation
        timeout: 10000,           // Timeout window
        maximumAge: 0             // Prevents reading cached old telemetry data
      };

      // watchPosition acts as a persistent stream event listener
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const liveCoords = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(liveCoords);
          
          // Smoothly pan map center along with user steps if tracker snapping is turned on
          if (isTrackingActive) {
            setMapCenter(liveCoords);
          }
        },
        (err) => {
          console.warn(`Live Tracker Snag (${err.message}). Defaulting to baseline mesh layout.`);
        },
        gpsOptions
      );
    }

    // Standard cleanup handler to safely shut down the background GPS chip draw when app unmounts
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTrackingActive]);

  const runRecommendationEngine = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const [uLat, uLng] = userLocation;
      
      const gymBrands = [
        "Gold's Gym", "Cult.Fit Elite", "Iron Paradise", "Titanium Strength Club", 
        "Nitro Core Fitness", "Onyx Health Hub", "Pulse Functional Hub", "Blaze Crossfit",
        "Anytime Fitness", "Snap Fitness", "Talwalkars", "Powerhouse Gym"
      ];

      const simulatedGyms = Array.from({ length: 12 }).map((_, index) => {
        const angle = (index * 2.4) + 0.5; 
        const maxRangeFactor = formInputs.maxDistance / 11;
        const radialDistance = (index + 1) * maxRangeFactor * (0.75 + (index % 3) * 0.08);

        const latOffset = (radialDistance / 111.3) * Math.sin(angle);
        const lngOffset = (radialDistance / (111.3 * Math.cos(uLat * Math.PI / 180))) * Math.cos(angle);
        
        const gymLat = uLat + latOffset;
        const gymLng = uLng + lngOffset;
        const exactKm = calculateRealDistance(uLat, uLng, gymLat, gymLng);
        
        const brandName = gymBrands[(index * 7) % gymBrands.length];
        const sectorNumber = (index % 4) + 1;
        const areaPrefix = formInputs.area ? `${formInputs.area} Sec ${sectorNumber}` : `Zone ${index + 1}`;

        const rating = parseFloat((4.0 + ((index * 3) % 10) * 0.1).toFixed(1));
        const cost = 1200 + ((index * 4) % 6) * 400;

        return {
          id: `free-gym-node-${index}-${cost}`,
          name: `${areaPrefix} - ${brandName}`,
          lat: gymLat,
          lng: gymLng,
          rating: rating > 5.0 ? 4.9 : rating,
          cost: cost,
          distance: parseFloat(exactKm.toFixed(1)),
          address: `Plot ${10 + index * 4}, Road No. ${sectorNumber}, Near Central Junction`,
          experience: cost >= 2800 ? "Premium Gold Lounge" : "Standard Strength Facility"
        };
      });

      const matchingPicks = simulatedGyms
        .filter(gym => 
          gym.rating >= parseFloat(formInputs.minRating) &&
          gym.cost <= parseInt(formInputs.maxCost) &&
          gym.distance <= parseInt(formInputs.maxDistance)
        )
        .sort((a, b) => a.distance - b.distance);

      if (matchingPicks.length === 0) {
        alert("No gyms matched your exact parameters. Relaxing bounds to display closest alternatives!");
        setTopPicks(simulatedGyms.sort((a,b) => a.distance - b.distance).slice(0, 4));
      } else {
        setTopPicks(matchingPicks.slice(0, 5));
      }

      // Temporarily bypass tracking lock when displaying initial searches to showcase the destination focus
      setIsTrackingActive(false);

      if (matchingPicks.length > 0) {
        setMapCenter([matchingPicks[0].lat, matchingPicks[0].lng]);
        setMapZoom(14);
      } else {
        setMapCenter([simulatedGyms[0].lat, simulatedGyms[0].lng]);
        setMapZoom(13);
      }
      
      setIsLoading(false);
      setShowModal(false);
    }, 1200);
  };

  const handleAssignGym = (gym) => {
    setAssignedGym(gym);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fitnova_assigned_gym', JSON.stringify(gym));
    }
    setShowSuccessModal(true);
  };

  const executeCancellation = () => {
    setAssignedGym(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fitnova_assigned_gym');
    }
    setShowCancelModal(false);
  };

  return (
    <div className="h-screen pt-[72px] pl-[256px] bg-[#0f0f0f] flex text-white overflow-hidden relative font-sans select-none">
      
      {/* PARAMETER CONFIGURATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#151515] border border-stone-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
            
            {topPicks.length > 0 && !isLoading && (
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-stone-500 hover:text-white transition">
                <X size={18} />
              </button>
            )}

            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-[#FFD700]/10 rounded-full border border-[#FFD700]/20 mb-3">
                <Target className="text-[#FFD700]" size={24} />
              </div>
              <h2 className="text-lg font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#E6C200]">
                100% Free Location Pipeline
              </h2>
              <p className="text-xs text-stone-400 mt-1">Zero API Keys • No Credit Cards • Completely Secure</p>
            </div>

            {assignedGym && !isLoading && (
              <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/10 to-stone-900/40 border border-amber-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-[#FFD700] font-black block mb-0.5">Assigned Target</span>
                  <h4 className="text-xs font-bold text-white uppercase">{assignedGym.name}</h4>
                  <p className="text-[10px] text-stone-400 mt-0.5">₹{assignedGym.cost}/mo • ★ {assignedGym.rating}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-2.5 py-1.5 border border-stone-800 text-stone-400 hover:text-[#FF3131] bg-[#121212] transition rounded-lg text-[10px] font-black uppercase tracking-wider"
                >
                  Disconnect
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="text-[#FFD700] animate-spin" size={32} />
                <p className="text-xs uppercase tracking-widest font-mono text-amber-500">Mapping Live GPS Grid Vectors...</p>
              </div>
            ) : (
              <form onSubmit={runRecommendationEngine} className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-stone-400 block mb-1.5">Target Landmark / Area</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jubilee Hills, Gachibowli, Kukatpally..."
                    value={formInputs.area}
                    onChange={(e) => setFormInputs({...formInputs, area: e.target.value})}
                    className="w-full bg-[#1C1C1C] border border-stone-800 rounded-xl p-3 text-xs focus:outline-none focus:border-[#FFD700]/40 text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-black tracking-wider text-stone-400 block mb-1.5">Min Stars</label>
                    <select
                      value={formInputs.minRating}
                      onChange={(e) => setFormInputs({...formInputs, minRating: e.target.value})}
                      className="w-full bg-[#1C1C1C] border border-stone-800 rounded-xl p-3 text-xs focus:outline-none focus:border-[#FFD700]/40 text-white"
                    >
                      <option value="4.0">★ 4.0+</option>
                      <option value="4.3">★ 4.3+</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-black tracking-wider text-stone-400 block mb-1.5">Max Price</label>
                    <select
                      value={formInputs.maxCost}
                      onChange={(e) => setFormInputs({...formInputs, maxCost: e.target.value})}
                      className="w-full bg-[#1C1C1C] border border-stone-800 rounded-xl p-3 text-xs focus:outline-none focus:border-[#FFD700]/40 text-white"
                    >
                      <option value="2000">₹2,000</option>
                      <option value="3000">₹3,000</option>
                      <option value="4000">₹4,000</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-black tracking-wider text-stone-400 block mb-1.5">Radius Limit</label>
                    <select
                      value={formInputs.maxDistance}
                      onChange={(e) => setFormInputs({...formInputs, maxDistance: e.target.value})}
                      className="w-full bg-[#1C1C1C] border border-stone-800 rounded-xl p-3 text-xs focus:outline-none focus:border-[#FFD700]/40 text-white"
                    >
                      <option value="2">2 KM</option>
                      <option value="5">5 KM</option>
                      <option value="10">10 KM</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#E6C200] text-black font-black text-xs uppercase tracking-widest shadow-lg transition hover:brightness-105"
                >
                  Locate Nearby Gyms Safely
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DISCONNECT PROFILE MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-[#151515] border border-[#FF3131]/30 w-full max-w-sm rounded-2xl p-6 text-center">
            <div className="inline-flex p-3 bg-[#FF3131]/10 rounded-full border border-[#FF3131]/20 mb-3">
              <AlertTriangle className="text-[#FF3131]" size={22} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Reset Allocation Profile?</h3>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">This will clear your selected recommendation telemetry.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-2.5 border border-stone-800 text-stone-400 text-xs font-bold rounded-xl hover:bg-stone-900 transition">Abort</button>
              <button onClick={executeCancellation} className="flex-1 py-2.5 bg-[#FF3131] text-white text-xs font-black uppercase tracking-wider rounded-xl transition">Confirm Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* SYNC SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-[#151515] border border-[#FFD700]/30 rounded-2xl p-8 flex flex-col items-center max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full border-4 border-[#FFD700] flex items-center justify-center mb-4 relative">
              <Check className="text-[#FFD700]" size={28} strokeWidth={3} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Target Synchronized</h3>
            <p className="text-xs text-stone-400 mt-2">Facility chosen and locked into your primary fitness dashboard profile layout.</p>
            <button onClick={() => setShowSuccessModal(false)} className="mt-6 w-full py-2.5 bg-gradient-to-r from-[#FFD700] to-[#E6C200] text-black text-xs font-black uppercase tracking-wider rounded-xl transition">Open Workspace</button>
          </div>
        </div>
      )}

      {/* SIDEBAR DASHBOARD CONTROL */}
      <div className="w-[400px] border-r border-stone-800/80 bg-[#151515] flex flex-col h-full shadow-2xl z-[990]">
        <div className="p-4 border-b border-stone-800 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <Dumbbell className="text-[#FFD700]" size={16} />
              <h2 className="text-xs font-black uppercase tracking-wider text-white">Verified Fits Nearby</h2>
            </div>
            <p className="text-[10px] text-stone-500 mt-0.5">Target Scope: <span className="text-stone-300 font-bold font-mono text-xs uppercase">{formInputs.area || "Local Area"}</span></p>
          </div>
          <button onClick={() => setShowModal(true)} className="p-2 bg-[#1C1C1C] border border-stone-800 rounded-lg text-stone-400 hover:text-[#FFD700] transition">
            <Sliders size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {topPicks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500 space-y-2">
              <p className="text-xs uppercase font-mono tracking-wider text-stone-400">Data Feed Empty</p>
              <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-[#1C1C1C] border border-stone-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#FFD700]">Open Filter Matrix</button>
            </div>
          ) : (
            topPicks.map((gym) => (
              <div
                key={gym.id}
                onClick={() => {
                  setSelectedGym(gym);
                  setMapCenter([gym.lat, gym.lng]);
                  setMapZoom(16);
                }}
                className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer text-left relative group
                  ${selectedGym?.id === gym.id ? 'bg-stone-900 border-[#FFD700]/40 shadow-xl' : 'bg-[#1C1C1C]/40 border-stone-800/60 hover:bg-[#1C1C1C]'}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-wide group-hover:text-[#FFD700] transition-colors line-clamp-1">{gym.name}</h3>
                  <span className="flex items-center gap-0.5 text-[10px] font-mono font-black text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/20 px-1.5 py-0.5 rounded flex-shrink-0">
                    <Star size={10} fill="currentColor" /> {gym.rating}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-1 line-clamp-1">{gym.address}</p>
                <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-[11px] text-stone-400">
                  <div className="flex items-center gap-1"><MapPin size={12} className="text-stone-600" /> {gym.distance} km away</div>
                  <div className="flex items-center gap-1 font-mono text-stone-300"><span className="text-[#FFD700]">₹</span>{gym.cost}/mo</div>
                  <div className="flex items-center gap-1 col-span-2 text-[10px] uppercase font-bold text-stone-500"><Award size={12} className="text-[#E6C200]/70" /> {gym.experience}</div>
                </div>
                {selectedGym?.id === gym.id && (
                  <div className="mt-4 pt-3 border-t border-stone-800">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAssignGym(gym); }}
                      className="w-full py-2 rounded-lg bg-gradient-to-r from-[#FFD700] to-[#E6C200] text-black text-[10px] uppercase tracking-widest font-black shadow-md transition"
                    >
                      Assign System Recommendation
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAP VIEWPORT GRID */}
      <div className="flex-1 h-full relative z-10">
        
        {/* TOP INTERACTIVE FLOATING BAR */}
        <div className="absolute top-4 right-4 z-[990] flex items-center gap-2">
          {/* TRACKING TOGGLE SNAP BUTTON */}
          <button
            onClick={() => {
              setIsTrackingActive(!isTrackingActive);
              if(!isTrackingActive) setMapCenter(userLocation);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 border transition rounded-xl text-xs font-black uppercase tracking-wider shadow-xl
              ${isTrackingActive 
                ? 'bg-[#00BFFF]/10 border-[#00BFFF]/40 text-[#00BFFF]' 
                : 'bg-[#151515]/95 border-stone-800 text-stone-400 hover:text-white'}`}
          >
            <Navigation size={12} className={isTrackingActive ? "animate-pulse" : ""} />
            {isTrackingActive ? "Tracking GPS Live" : "GPS Lock Paused"}
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#151515]/95 border border-stone-800 hover:border-[#FFD700]/50 text-[#FFD700] transition rounded-xl text-xs font-black uppercase tracking-wider shadow-xl"
          >
            <RefreshCw size={12} /> Re-Filter Area
          </button>
        </div>

        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ height: '100%', width: '100%', background: '#0f0f0f' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          />
          
          <MapController center={mapCenter} zoom={mapZoom} />

          {/* NEW: DYNAMIC LIVE TRACKER MARKER FOR USER POSITION */}
          <Marker position={userLocation} icon={liveTrackerIcon}>
            <Popup>
              <div className="p-1 font-sans text-stone-900 text-center">
                <span className="text-xs font-black uppercase tracking-wider text-[#00BFFF]">Your Live Coordinates</span>
                <p className="text-[10px] text-stone-500 font-mono m-0 mt-0.5">Lat: {userLocation[0].toFixed(4)}</p>
                <p className="text-[10px] text-stone-500 font-mono m-0">Lng: {userLocation[1].toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>

          {topPicks.map((gym) => (
            <Marker 
              key={gym.id} 
              position={[gym.lat, gym.lng]} 
              icon={premiumGymIcon}
              eventHandlers={{ click: () => setSelectedGym(gym) }}
            >
              <Popup>
                <div className="p-1 font-sans text-stone-900 min-w-[140px]">
                  <h4 className="text-xs font-black uppercase m-0 text-stone-950">{gym.name}</h4>
                  <p className="text-[10px] m-0 mt-1 text-stone-600">Quality: <span className="text-amber-500 font-bold">★ {gym.rating}</span></p>
                  <p className="text-[10px] m-0 text-stone-600">Fees: <span className="font-bold">₹{gym.cost}/mo</span></p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}3