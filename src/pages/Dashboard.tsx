import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Heart, Thermometer, Wind, Brain, TrendingUp, Clock, Smartphone } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";
import StressGauge from "@/components/StressGauge";
import { computeStressScore, getStressLevel, getStressColor, getRecommendations } from "@/lib/stress";
import { useAuth } from "@/lib/auth";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

interface HealthReading {
  heart_rate: number;
  spo2: number;
  temperature: number;
  timestamp: string;
}

import Feedback from "@/components/Feedback";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [readings, setReadings] = useState<HealthReading[]>([]);
  const [latest, setLatest] = useState<HealthReading | null>(null);
  const [onboarding, setOnboarding] = useState<any>(null);
  const [device, setDevice] = useState<any>(null);
  const [hasDevice, setHasDevice] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [devices, onboardingData] = await Promise.all([
          api.get("/api/devices"),
          api.get("/api/onboarding").catch(() => null)
        ]);
        
        if (onboardingData) setOnboarding(onboardingData);

        if (!devices || devices.length === 0) {
          setHasDevice(false);
          setDevice(null);
          return;
        }
        
        setHasDevice(true);
        setDevice(devices[0]);
        const data = await api.get("/api/health");
        if (data?.length) {
          setReadings(data.reverse());
          setLatest(data[data.length - 1]);
        }
      } catch(err) {
        console.error("Dashboard data fetch failed:", err);
        setHasDevice(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const symptomCount = onboarding ? (
    (onboarding.common_symptoms?.length || 0) + 
    (onboarding.ent_issues?.length || 0) + 
    (onboarding.ocular_issues?.length || 0) +
    (onboarding.pain_locations?.length || 0)
  ) : 0;
  
  const sleepHours = onboarding?.sleep_hours?.[0] || 7;

  const stressScore = computeStressScore({
    heartRate: latest?.heart_rate,
    temperature: latest?.temperature,
    symptomCount,
    sleepHours,
  });

  const stressLevel = getStressLevel(stressScore);
  const healthScore = Math.max(0, 100 - stressScore);
  const recommendations = getRecommendations(stressLevel);

  const chartData = readings.map(r => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    hr: r.heart_rate,
    temp: r.temperature,
    stress: computeStressScore({ heartRate: r.heart_rate, temperature: r.temperature }),
  }));

  const lastUpdated = latest ? new Date(latest.timestamp).toLocaleString() : null;

  return (
    <DashboardLayout>
      <div className="space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Health Dashboard</h1>
            <p className="text-muted-foreground">Monitor your vital signs and AI-driven stress analysis.</p>
          </div>
          {hasDevice && (
            <div className="flex flex-col items-start md:items-end gap-1.5 bg-muted/50 p-3 rounded-xl border border-border/50">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Smartphone className="h-3.5 w-3.5 text-primary" />
                <span>Device: <span className="text-foreground">{device?.device_id || "Active Wearable"}</span></span>
              </div>
              {lastUpdated && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <Clock className="h-3 w-3" />
                  <span>Last Sync: {lastUpdated}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {hasDevice === false ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-card/30 rounded-3xl border-2 border-dashed border-border/50">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Smartphone className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">No Device Connected</h2>
            <p className="max-w-md mx-auto mb-8 text-muted-foreground leading-relaxed">
              Your health dashboard is ready! Connect your ESP32 wearable to start tracking heart rate, SpO2, and temperature in real-time.
            </p>
            <Button size="lg" onClick={() => navigate("/device-connect")} className="rounded-full px-8 shadow-xl shadow-primary/20">
              Connect a Device
            </Button>
          </div>
        ) : hasDevice === null ? (
          <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm font-medium animate-pulse text-muted-foreground">Syncing your health data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Vital Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="overflow-hidden border-none shadow-premium bg-gradient-to-br from-card to-destructive/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Heart Rate</CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Heart className="h-4 w-4 text-destructive" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold font-display">{latest?.heart_rate || "0"}</div>
                  <p className="text-[10px] font-bold text-destructive mt-1 uppercase">BPM</p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-none shadow-premium bg-gradient-to-br from-card to-blue-500/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SpO2</CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Wind className="h-4 w-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold font-display">{latest?.spo2 || "0"}</div>
                  <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase">Oxygen Level</p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-none shadow-premium bg-gradient-to-br from-card to-orange-500/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Body Temp</CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Thermometer className="h-4 w-4 text-orange-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold font-display">{latest?.temperature?.toFixed(1) || "0.0"}</div>
                  <p className="text-[10px] font-bold text-orange-500 mt-1 uppercase">Celsius</p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-none shadow-premium bg-gradient-to-br from-card to-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stress Level</CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold capitalize" style={{ color: getStressColor(stressLevel) }}>
                    {stressLevel}
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter">AI Analysis Score: {stressScore}</p>
                </CardContent>
              </Card>
            </div>

            {/* Gauges + Recommendations */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="flex flex-col items-center justify-center p-8 bg-card/50 border-none shadow-premium group">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-primary">Stress Distribution</p>
                <div className="relative">
                   <StressGauge score={stressScore} />
                   <div className="absolute inset-0 flex items-center justify-center mt-12">
                      <span className="text-2xl font-bold">{stressScore}</span>
                   </div>
                </div>
              </Card>

              <Card className="flex flex-col items-center justify-center p-8 bg-card/50 border-none shadow-premium group">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-primary">Health index</p>
                <div className="relative">
                   <StressGauge score={healthScore} />
                   <div className="absolute inset-0 flex items-center justify-center mt-12">
                      <span className="text-2xl font-bold">{healthScore}</span>
                   </div>
                </div>
              </Card>

              <Card className="p-8 bg-card/50 border-none shadow-premium">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                   <TrendingUp className="h-3 w-3" />
                   Health Recommendations
                </p>
                <ul className="space-y-4">
                  {recommendations.slice(0, 3).map((r, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground/80">
                       <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center shrink-0 font-bold">{i+1}</span>
                       {r}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6 bg-card/50 border-none shadow-premium">
                <p className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">Heart Rate Trend (BPM)</p>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="hr" stroke="hsl(var(--destructive))" strokeWidth={3} dot={false} animationDuration={1500} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6 bg-card/50 border-none shadow-premium">
                <p className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">Vitals comparison</p>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                      <Line type="monotone" dataKey="temp" stroke="hsl(var(--stress-moderate))" strokeWidth={3} dot={false} animationDuration={1500} />
                      <Line type="monotone" dataKey="stress" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} animationDuration={1500} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

          </div>
        )}

        {/* Feedback Section - Always Visible */}
        <div className="pt-20">
          <Feedback />
        </div>
      </div>
    </DashboardLayout>
  );
}
