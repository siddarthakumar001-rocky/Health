import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import { Bell, Check } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/lib/auth";

interface Alert {
  _id: string; // MongoDB uses _id
  message: string;
  severity: string;
  resolved: boolean;
  createdAt: string;
}

export default function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    const fetchAlerts = async () => {
      const data = await api.get(`/alerts?severity=${filter}`);
      if (data) setAlerts(data as Alert[]);
    };
    fetchAlerts();
    
    // Polling as a fallback for real-time
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [user, filter]);

  const resolveAlert = async (id: string) => {
    await api.patch(`/alerts/${id}/resolve`, {});
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
            <h1 className="font-display text-2xl font-bold">Alerts</h1>
            <p className="text-sm text-muted-foreground">Health notifications and warnings</p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {alerts.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">No alerts yet</p>
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
                    <Button size="sm" variant="outline" onClick={() => resolveAlert(alert._id)}>
                      <Check className="mr-1 h-3 w-3" /> Resolve
                    </Button>
                  )}
                  {alert.resolved && <Badge variant="outline">Resolved</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
