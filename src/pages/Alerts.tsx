import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import { Bell, Check } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";

interface Alert {
  _id: string;
  message: string;
  severity: string;
  resolved: boolean;
  createdAt: string;
}

export default function Alerts() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    const fetchAlerts = async () => {
      const res = await api.get(`/api/alerts?user_id=${user.id}`);
      if (res.data) setAlerts(res.data as Alert[]);
    };
    fetchAlerts();
    
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [user, filter]);

  const resolveAlert = async (id: string) => {
    await api.patch(`/api/alerts/${id}/resolve`);
    setAlerts(prev => prev.map(a => a._id === id ? { ...a, resolved: true } : a));
  };

  const severityColor = (s: string) => {
    switch (s) {
      case "low": return "bg-stress-low";
      case "moderate": return "bg-stress-moderate text-black";
      case "high": return "bg-stress-high";
      default: return "bg-muted";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">{t("alerts.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("alerts.subtitle")}</p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("alerts.all")}</SelectItem>
              <SelectItem value="low">{t("alerts.low")}</SelectItem>
              <SelectItem value="moderate">{t("alerts.moderate")}</SelectItem>
              <SelectItem value="high">{t("alerts.high")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {alerts.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">{t("alerts.noAlerts")}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <Card key={alert._id} className={alert.resolved ? "opacity-60" : ""}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Badge className={severityColor(alert.severity)}>{alert.severity}</Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</p>
                  </div>
                  {!alert.resolved && (
                    <Button size="sm" variant="outline" onClick={() => resolveAlert(alert._id)} className="h-10 rounded-xl">
                      <Check className="mr-1 h-3 w-3" /> {t("alerts.resolve")}
                    </Button>
                  )}
                  {alert.resolved && <Badge variant="outline">{t("alerts.resolved")}</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
