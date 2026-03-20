import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { MapPin, Navigation, Hospital } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: "hue-rotate-180",
});

interface HospitalMarker {
  id: number;
  name: string;
  lat: number;
  lon: number;
}

function LocationMarker({ onLocationFound }: { onLocationFound: (lat: number, lon: number) => void }) {
  const map = useMap();
  useEffect(() => {
    map.locate({ setView: true, maxZoom: 14 });
    map.on("locationfound", (e) => {
      onLocationFound(e.latlng.lat, e.latlng.lng);
    });
  }, [map, onLocationFound]);
  return null;
}

export default function MapPage() {
  const [position, setPosition] = useState<[number, number]>([20.5937, 78.9629]);
  const [hospitals, setHospitals] = useState<HospitalMarker[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHospitals = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const query = `[out:json][timeout:10];node["amenity"="hospital"](around:5000,${lat},${lon});out body 20;`;
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await res.json();
      const results: HospitalMarker[] = data.elements.map((el: any) => ({
        id: el.id,
        name: el.tags?.name || "Hospital",
        lat: el.lat,
        lon: el.lon,
      }));
      setHospitals(results);
    } catch (err) {
      console.error("Failed to fetch hospitals", err);
    }
    setLoading(false);
  };

  const handleLocationFound = (lat: number, lon: number) => {
    setPosition([lat, lon]);
    fetchHospitals(lat, lon);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Nearby Hospitals</h1>
          <p className="text-sm text-muted-foreground">Find healthcare facilities near you</p>
        </div>

        <Card className="overflow-hidden">
          <div className="h-[500px] w-full">
            <MapContainer center={position} zoom={13} className="h-full w-full" scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker onLocationFound={handleLocationFound} />
              <Marker position={position}>
                <Popup>Your Location</Popup>
              </Marker>
              {hospitals.map(h => (
                <Marker key={h.id} position={[h.lat, h.lon]} icon={hospitalIcon}>
                  <Popup>
                    <div className="space-y-1">
                      <p className="font-semibold">{h.name}</p>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Get Directions →
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </Card>

        <div className="grid gap-3 md:grid-cols-3">
          {hospitals.slice(0, 6).map(h => (
            <Card key={h.id} className="flex items-center gap-3 p-4">
              <Hospital className="h-5 w-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{h.name}</p>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline"><Navigation className="h-3 w-3" /></Button>
              </a>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
