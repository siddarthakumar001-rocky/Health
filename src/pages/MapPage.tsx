import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { MapPin, Navigation, Hospital, Loader2, Search, LocateFixed, Info, List, X } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

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
    map.locate({ setView: true, maxZoom: 15 });
    
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
  const { t } = useTranslation();
  const [position, setPosition] = useState<[number, number]>([20.5937, 78.9629]);
  const [hospitals, setHospitals] = useState<HospitalMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showList, setShowList] = useState(false);

  const fetchHospitals = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    try {
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
          <h1 className="font-display text-2xl font-bold">{t("map.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("map.subtitle")}</p>
        </div>

        <Card className="overflow-hidden border-none shadow-premium rounded-3xl">
          <div className="h-[500px] md:h-[500px] w-full relative" style={{ zIndex: 0 }}>
            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 z-[1000] bg-background/60 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
                  <p className="text-xs font-bold text-teal-600">{t("map.locating")}</p>
                </div>
              </div>
            )}

            {/* Floating Glassmorphism Panel */}
            <div
              className="absolute top-3 right-3 z-10 pointer-events-none"
              style={{ maxWidth: "90%" }}
            >
              <div className="pointer-events-auto w-72 sm:w-80 bg-white/20 dark:bg-black/30 backdrop-blur-lg border border-white/30 dark:border-white/10 rounded-xl shadow-lg p-3 space-y-2">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("map.searchPlaceholder")}
                    className="h-10 rounded-lg bg-white/60 dark:bg-black/40 border-white/30 dark:border-white/10 text-sm placeholder:text-muted-foreground/70"
                  />
                  <Button type="submit" size="icon" className="h-10 w-10 shrink-0 rounded-lg bg-teal-500 hover:bg-teal-600 shadow-sm">
                    <Search className="h-4 w-4 text-white" />
                  </Button>
                </form>

                {/* Toggle List Button */}
                <button
                  onClick={() => setShowList(!showList)}
                  className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors text-foreground/80"
                >
                  {showList ? <X className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
                  {showList ? t("map.hideList") : t("map.showList")} ({hospitals.length})
                </button>

                {/* Hospital List (collapsible) */}
                {showList && (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {hospitals.length === 0 && !loading && (
                      <p className="text-xs text-center text-muted-foreground py-2">{t("map.noFacilities")}</p>
                    )}
                    {hospitals.map(h => (
                      <div key={h.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
                        <Hospital className="h-4 w-4 text-teal-600 shrink-0" />
                        <span className="text-xs font-medium text-foreground truncate flex-1">{h.name}</span>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-teal-600 hover:underline shrink-0"
                        >
                          {t("map.navigate")}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Map */}
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
                        {t("map.navigate")}
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </Card>

        {/* Hospital list below map (desktop) */}
        <div className="hidden md:block space-y-3">
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
              <p className="text-sm font-medium">{t("map.noFacilities")}</p>
              <p className="text-xs">{t("map.tryMoving")}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
