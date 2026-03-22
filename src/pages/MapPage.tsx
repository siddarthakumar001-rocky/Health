import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { MapPin, Navigation, Hospital, Loader2, Search, LocateFixed, Info } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  className: "hue-rotate-[140deg] drop-shadow-lg", 
});

interface HospitalMarker {
  id: number;
  name: string;
  type: string;
  lat: number;
  lon: number;
}

function LocationMarker({ onLocationFound }: { onLocationFound: (lat: number, lon: number) => void }) {
  const map = useMap();
  useEffect(() => {
    let locating = false;
    map.locate({ setView: true, maxZoom: 15 }); // Increased zoom
    
    const onLocFound = (e: L.LocationEvent) => {
      if (!locating) {
        onLocationFound(e.latlng.lat, e.latlng.lng);
        locating = true;
      }
    };
    
    map.on("locationfound", onLocFound);
    return () => {
      map.off("locationfound", onLocFound);
    };
  }, [map, onLocationFound]);
  return null;
}

export default function MapPage() {
  const [position, setPosition] = useState<[number, number]>([20.5937, 78.9629]);
  const [hospitals, setHospitals] = useState<HospitalMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchHospitals = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    try {
      // Focused and fast query
      const query = `[out:json][timeout:15];nwr["amenity"~"hospital|clinic"](around:10000,${lat},${lon});out center body 40;`;
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Overpass API error");
      const data = await res.json();
      
      const results: HospitalMarker[] = data.elements.map((el: any) => ({
        id: el.id,
        name: el.tags?.name || "Medical Center",
        type: el.tags?.amenity || "Facility",
        lat: el.lat || el.center?.lat,
        lon: el.lon || el.center?.lon,
      })).filter((h: any) => h.lat && h.lon);
      
      setHospitals(results);
    } catch (err) {
      console.error("Failed to fetch hospitals", err);
    }
    setLoading(false);
  }, []);

  const handleLocationFound = useCallback((lat: number, lon: number) => {
    setPosition([lat, lon]);
    fetchHospitals(lat, lon);
  }, [fetchHospitals]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        handleLocationFound(parseFloat(lat), parseFloat(lon));
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    }
  };

  const handleRefresh = useCallback(() => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handleLocationFound(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.error("Geolocation failed", err);
          setLoading(false);
        }
      );
    }
  }, [handleLocationFound]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Nearby Hospitals</h1>
          <p className="text-sm text-muted-foreground">Find healthcare facilities near you</p>
        </div>

        <Card className="overflow-hidden border-none shadow-premium rounded-3xl">
          <div className="h-[400px] w-full relative">
            {loading && (
              <div className="absolute inset-0 z-[1000] bg-background/60 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
                  <p className="text-xs font-bold text-teal-600">Locating Facilities...</p>
                </div>
              </div>
            )}
            <MapContainer center={position} zoom={13} className="h-full w-full" scrollWheelZoom>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker onLocationFound={handleLocationFound} />
              <Marker position={position}>
                <Popup>Current Location</Popup>
              </Marker>
              {hospitals.map(h => (
                <Marker key={h.id} position={[h.lat, h.lon]} icon={hospitalIcon}>
                  <Popup>
                    <div className="p-1">
                      <p className="font-bold text-sm text-teal-800">{h.name}</p>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-teal-600 hover:underline inline-block mt-1"
                      >
                        Navigate →
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </Card>

        <div className="space-y-3">
          {hospitals.map(h => (
            <Card key={h.id} className="flex items-center gap-4 p-5 hover:bg-muted/50 transition-all shadow-sm border border-border/40 rounded-3xl bg-card">
              <div className="h-10 w-10 shrink-0 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                <Hospital className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground leading-tight">{h.name}</p>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-2xl border border-border/50 bg-muted/20 hover:bg-teal-50 hover:text-teal-600">
                  <Navigation className="h-4 w-4" />
                </Button>
              </a>
            </Card>
          ))}

          {!loading && hospitals.length === 0 && (
            <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-3xl border-2 border-dashed">
              <p className="text-sm font-medium">No medical facilities found within 5km.</p>
              <p className="text-xs">Try moving to a more central location.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
