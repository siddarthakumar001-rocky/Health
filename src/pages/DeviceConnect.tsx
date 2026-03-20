import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Smartphone } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function DeviceConnect() {
  const [deviceId, setDeviceId] = useState("");
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "failed">("idle");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!user || !deviceId.trim()) return;
    setStatus("connecting");
    try {
      await api.post("/devices", {
        device_id: deviceId.trim(),
        status: "connected",
      });
      setStatus("connected");
      toast({ title: "Device connected!" });
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err: any) {
      setStatus("failed");
      toast({ title: "Connection failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">Connect Your Device</CardTitle>
          <CardDescription>Enter your ESP32 device ID to start monitoring</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Device ID</Label>
            <Input value={deviceId} onChange={e => setDeviceId(e.target.value)} placeholder="e.g. ESP32-HEALTH-001" />
          </div>

          <div className="flex items-center justify-center gap-3 rounded-lg border p-4">
            {status === "connected" ? (
              <>
                <Wifi className="h-5 w-5 text-stress-low" />
                <Badge className="bg-stress-low text-white">Connected</Badge>
              </>
            ) : status === "failed" ? (
              <>
                <WifiOff className="h-5 w-5 text-destructive" />
                <Badge variant="destructive">Disconnected</Badge>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Not connected</span>
              </>
            )}
          </div>

          <Button onClick={handleConnect} className="w-full" disabled={!deviceId.trim() || status === "connecting"}>
            {status === "connecting" ? "Connecting..." : status === "connected" ? "Connected ✓" : "Connect Device"}
          </Button>

          <Button variant="ghost" className="w-full" onClick={() => navigate("/dashboard")}>
            Skip for now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
