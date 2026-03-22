import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Heart, Thermometer, Wind, Brain, TrendingUp, Clock, Smartphone, Bell, FileText, Loader2, Check } from "lucide-react";
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
  const { toast } = useToast();
  const navigate = useNavigate();
  const [readings, setReadings] = useState<HealthReading[]>([]);
  const [latest, setLatest] = useState<HealthReading | null>(null);
  const [onboarding, setOnboarding] = useState<any>(null);
  const [device, setDevice] = useState<any>(null);
  const [hasDevice, setHasDevice] = useState<boolean | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchData = async () => {
    try {
      const [devices, onboardingData, latestAi] = await Promise.all([
        api.get("/api/devices"),
        api.get("/api/onboarding").catch(() => null),
        api.get("/api/ai/latest").catch(() => null)
      ]);
      
      if (onboardingData) setOnboarding(onboardingData);
      if (latestAi) setAiAnalysis(latestAi);

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
      // setHasDevice(false); // Don't force false if it was just a transient error
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await api.post("/api/ai/analyze", {
        sensorData: latest ? {
          heartRate: latest.heart_rate,
          spo2: latest.spo2,
          temperature: latest.temperature
        } : {}
      });
      setAiAnalysis(result);
      toast({
        title: "Analysis Complete",
        description: `Your health status is: ${result.condition}`,
      });
    } catch (err: any) {
      toast({
        title: "Analysis Failed",
        description: err.response?.data?.error || "Could not analyze health data",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

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
            <p className="text-muted-foreground">AI-powered health monitoring and predictive analysis.</p>
          </div>
          <div className="flex gap-2">
            {!aiAnalysis && onboarding && (
              <Button onClick={handleAnalyze} disabled={isAnalyzing} className="rounded-full shadow-lg shadow-primary/20">
                {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                Analyze My Health
              </Button>
            )}
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
            {/* Rule Engine Alerts */}
            {aiAnalysis?.alerts?.length > 0 && (
              <div className="space-y-4">
                {aiAnalysis.alerts.map((alert: any, idx: number) => (
                  <div key={idx} className={`p-4 rounded-xl border flex items-center gap-3 ${
                    alert.severity === 'high' || alert.priority === 'critical' 
                    ? "bg-destructive/10 border-destructive/20 text-destructive" 
                    : "bg-orange-500/10 border-orange-500/20 text-orange-600"
                  }`}>
                    <Bell className="h-5 w-5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-bold">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI Health Overview Card (Top Level Insight) */}
            <Card className="overflow-hidden border-none shadow-premium bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-1">
              <div className="bg-card rounded-[inherit] p-6">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-shrink-0 relative">
                    <StressGauge score={aiAnalysis?.severity || stressScore} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                      <span className="text-3xl font-bold font-display">{aiAnalysis?.severity || stressScore}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Severity</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <div>
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                        <h2 className="text-2xl font-bold">{aiAnalysis?.condition || "Analyzing..."}</h2>
                        {aiAnalysis && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            aiAnalysis.riskLevel === 'high' ? "bg-destructive/10 text-destructive" :
                            aiAnalysis.riskLevel === 'medium' ? "bg-orange-500/10 text-orange-600" :
                            "bg-green-500/10 text-green-600"
                          }`}>
                            {aiAnalysis.riskLevel} Risk
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm max-w-md">
                        Based on your {onboarding ? "onboarding assessment" : "health profile"} and {latest ? "real-time sensor data" : "lifestyle data"}.
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                      <Button 
                        onClick={handleAnalyze} 
                        disabled={isAnalyzing} 
                        className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                      >
                        {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                        Re-run AI Analysis
                      </Button>
                      <Button variant="outline" className="rounded-full px-6" onClick={() => navigate("/report-upload")}>
                        <FileText className="mr-2 h-4 w-4" />
                        View Full Report
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

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
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Daily Health Score</CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold font-display">{healthScore}</div>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter">Based on AI Vitals Analysis</p>
                </CardContent>
              </Card>
            </div>

            {/* Ayurvedic Recommendations Section */}
            {aiAnalysis?.recommendations && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-8 bg-card/50 border-none shadow-premium border-l-4 border-l-primary/30">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Ayurvedic Remedies</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Traditional Herbal Support</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {aiAnalysis.recommendations.medicines?.map((m: any, i: number) => (
                      <div key={i} className="group p-3 rounded-xl bg-background/50 hover:bg-primary/5 transition-colors border border-border/20">
                        <p className="font-bold text-sm text-primary group-hover:translate-x-1 transition-transform">{m.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.benefit}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-8 bg-card/50 border-none shadow-premium border-l-4 border-l-green-500/30">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Lifestyle & Diet</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Holistic Wellness Plan</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-green-600 mb-3 tracking-widest">Lifestyle Tips</p>
                      <ul className="space-y-3">
                        {aiAnalysis.recommendations.lifestyleTips?.map((tip: string, i: number) => (
                          <li key={i} className="text-sm flex gap-2 text-foreground/80">
                            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-green-600 mb-3 tracking-widest">Dietary Advice</p>
                      <ul className="space-y-3">
                        {aiAnalysis.recommendations.dietTips?.map((tip: string, i: number) => (
                          <li key={i} className="text-sm flex gap-2 text-foreground/80">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0 mt-2" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>

                {/* Disclaimer */}
                <div className="md:col-span-2">
                  <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                    <p className="text-[10px] leading-relaxed text-muted-foreground italic">
                      <span className="font-bold uppercase not-italic mr-2">Medical Disclaimer:</span>
                      {aiAnalysis.recommendations.disclaimer}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                <p className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">AI Health metrics comparison</p>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                      <Line type="monotone" dataKey="temp" stroke="hsl(var(--stress-moderate))" strokeWidth={2} dot={false} animationDuration={1500} />
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
