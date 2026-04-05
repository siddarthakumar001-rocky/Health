import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Smartphone, Loader2, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function DeviceConnect() {
  const [deviceId, setDeviceId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !deviceId.trim()) return;
    
    setIsConnecting(true);
    try {
      await api.post("/api/device/connect", {
        userId: user.id || (user as any)._id,
        deviceId: deviceId.trim(),
      });
      toast({ title: t("deviceConnect.success") });
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err: any) {
      toast({ 
        title: t("deviceConnect.failed"), 
        description: err.response?.data?.error || "Could not link device.", 
        variant: "destructive" 
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-premium border-none">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-50">
            <Smartphone className="h-10 w-10 text-teal-600" />
          </div>
          <CardTitle className="font-display text-2xl font-bold">{t("deviceConnect.title")}</CardTitle>
          <CardDescription>{t("deviceConnect.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConnect} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="deviceId" className="text-sm font-semibold">{t("deviceConnect.deviceIdLabel")}</Label>
              <Input
                id="deviceId"
                placeholder={t("deviceConnect.placeholder")}
                className="rounded-xl h-12"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
              <WifiOff className="h-4 w-4" />
              <span className="text-xs font-semibold">{t("deviceConnect.notConnected")}</span>
            </div>

            <Button 
              type="submit"
              className="w-full h-14 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-base transition-all shadow-md active:scale-95" 
              disabled={isConnecting || !deviceId.trim()}
            >
              {isConnecting ? <Loader2 className="h-5 w-5 animate-spin" /> : t("deviceConnect.connectButton")}
            </Button>

            <button 
              type="button"
              className="w-full text-center text-sm font-bold text-muted-foreground hover:text-foreground transition-colors" 
              onClick={() => navigate("/dashboard")}
            >
              {t("deviceConnect.skip")}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
