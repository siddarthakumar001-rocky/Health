import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Heart, Thermometer, Wind, Brain, TrendingUp, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";
import StressGauge from "@/components/StressGauge";
import { computeStressScore, getStressLevel, getStressColor, getRecommendations } from "@/lib/stress";
import { useAuth } from "@/lib/auth";
import { api } from "@/services/api";

interface HealthReading {
  heart_rate: number;
  spo2: number;
  temperature: number;
  timestamp: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [readings, setReadings] = useState<HealthReading[]>([]);
  const [latest, setLatest] = useState<HealthReading | null>(null);
  const [hasDevice, setHasDevice] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Check for devices first
        const devices = await api.get("/devices");
        
        if (!devices || devices.length === 0) {
          setHasDevice(false);
          return;
        }
        
        setHasDevice(true);
        const data = await api.get("/health");
        if (data?.length) {
          setReadings(data.reverse());
          setLatest(data[data.length - 1]);
        }
      } catch(err) {
        console.error(err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const stressScore = computeStressScore({
    heartRate: latest?.heart_rate,
    temperature: latest?.temperature,
    symptomCount: 0,
    sleepHours: 7,
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

  const lastUpdated = latest ? new Date(latest.timestamp).toLocaleString() : "No data yet";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Health Dashboard</h1>
            <p className="text-sm text-muted-foreground">Real-time monitoring & AI analysis</p>
          </div>
          {hasDevice && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-stress-low pulse-live" />
              <Clock className="h-3 w-3" />
              <span>{lastUpdated}</span>
            </div>
          )}
        </div>

        {hasDevice === false ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="mb-2">No Device Connected</CardTitle>
            <p className="max-w-xs mx-auto mb-6 text-sm text-muted-foreground">
              Connect a health tracking device to start seeing your real-time health data and AI stress analysis.
            </p>
            <Button onClick={() => navigate("/device-connect")}>
              Connect a Device
            </Button>
          </Card>
        ) : hasDevice === null ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Vital Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
                  <Heart className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-display">{latest?.heart_rate || "--"}</div>
                  <p className="text-xs text-muted-foreground">BPM</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">SpO2</CardTitle>
                  <Wind className="h-4 w-4 text-chart-5" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-display">{latest?.spo2 || "--"}</div>
                  <p className="text-xs text-muted-foreground">%</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Temperature</CardTitle>
                  <Thermometer className="h-4 w-4 text-stress-moderate" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-display">{latest?.temperature?.toFixed(1) || "--"}</div>
                  <p className="text-xs text-muted-foreground">°C</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Stress Level</CardTitle>
                  <Brain className="h-4 w-4" style={{ color: getStressColor(stressLevel) }} />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold capitalize" style={{ color: getStressColor(stressLevel) }}>
                    {stressLevel}
                  </div>
                  <p className="text-xs text-muted-foreground">Score: {stressScore}/100</p>
                </CardContent>
              </Card>
            </div>

            {/* Gauges + Recommendations */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="flex flex-col items-center justify-center p-6">
                <p className="mb-2 text-sm font-medium text-muted-foreground">Stress Score</p>
                <StressGauge score={stressScore} />
              </Card>

              <Card className="flex flex-col items-center justify-center p-6">
                <p className="mb-2 text-sm font-medium text-muted-foreground">Health Score</p>
                <StressGauge score={healthScore} />
              </Card>

              <Card className="p-6">
                <p className="mb-3 text-sm font-semibold">Recommendations</p>
                <ul className="space-y-2">
                  {recommendations.map((r, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {r}</li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="p-4">
                <p className="mb-2 text-sm font-semibold">Heart Rate Trend</p>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="hr" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-4">
                <p className="mb-2 text-sm font-semibold">Temperature Trend</p>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={[35, 40]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="temp" stroke="hsl(var(--stress-moderate))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-4">
                <p className="mb-2 text-sm font-semibold">Stress Trend</p>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="stress" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>

  );
}
