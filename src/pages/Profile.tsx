import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import { User, Smartphone, FileHeart } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [device, setDevice] = useState<any>(null);
  const [onboarding, setOnboarding] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };
        const [oRes, dRes] = await Promise.all([
          fetch("http://localhost:5000/api/onboarding", { headers }),
          fetch("http://localhost:5000/api/devices", { headers })
        ]);
        if (oRes.ok) setOnboarding(await oRes.json());
        if (dRes.ok) {
           const dev = await dRes.json();
           if (dev.length) setDevice(dev[0]);
        }
      } catch (err) {
        console.error("Failed to fetch profile details", err);
      }
    };
    load();
  }, [user]);

  const meta = user?.user_metadata || {};

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="font-display text-2xl font-bold">Profile</h1>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {meta.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <CardTitle>{meta.name || "User"}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div><Label className="text-muted-foreground">Phone</Label><p className="text-sm font-medium">{meta.phone || "N/A"}</p></div>
            <div><Label className="text-muted-foreground">Age</Label><p className="text-sm font-medium">{meta.age || "N/A"}</p></div>
            <div><Label className="text-muted-foreground">Gender</Label><p className="text-sm font-medium capitalize">{meta.gender || "N/A"}</p></div>
            <div><Label className="text-muted-foreground">Emergency Contact</Label><p className="text-sm font-medium">{meta.emergency_contact || "N/A"}</p></div>
          </CardContent>
        </Card>

        {onboarding && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><FileHeart className="h-5 w-5 text-primary" /> Medical History</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div><Label className="text-muted-foreground">Conditions</Label><p className="text-sm">{onboarding.conditions?.join(", ") || "None"}</p></div>
              <div><Label className="text-muted-foreground">Symptoms</Label><p className="text-sm">{onboarding.symptoms?.join(", ") || "None"}</p></div>
              <div><Label className="text-muted-foreground">Sleep</Label><p className="text-sm">{onboarding.sleep_hours}h/night</p></div>
              <div><Label className="text-muted-foreground">Exercise</Label><p className="text-sm capitalize">{onboarding.exercise}</p></div>
            </CardContent>
          </Card>
        )}

        {device && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Smartphone className="h-5 w-5 text-primary" /> Connected Device</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div><Label className="text-muted-foreground">Device ID</Label><p className="text-sm font-medium">{device.device_id}</p></div>
              <div><Label className="text-muted-foreground">Status</Label><p className="text-sm font-medium capitalize">{device.status}</p></div>
              <div><Label className="text-muted-foreground">Last Sync</Label><p className="text-sm">{device.last_sync ? new Date(device.last_sync).toLocaleString() : "Never"}</p></div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
