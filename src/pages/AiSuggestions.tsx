import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Brain, Leaf, AlertCircle, Loader2, Sparkles, ChevronLeft, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/services/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function AiSuggestions() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const fetchLatestAnalysis = async () => {
    try {
      const res = await api.get("/api/ai/latest");
      if (res.data) {
        setAnalysis(res.data);
      } else {
        // If no analysis exists, trigger one immediately
        handleAnalyze();
      }
    } catch (err) {
      console.error("Fetch Analysis Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await api.post("/api/ai/analyze", { sensorData: {} });
      setAnalysis(res.data);
      toast({
        title: t("dashboard.analysisComplete"),
        description: res.data.condition,
      });
    } catch (err) {
      toast({
        title: "Analysis Failed",
        description: "Could not generate suggestions based on your profile.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchLatestAnalysis();
  }, [user]);

  if (loading || analyzing) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-in fade-in duration-700">
          <div className="relative">
            <div className="h-32 w-32 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Brain className="absolute inset-0 m-auto h-12 w-12 text-primary animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">{t('reports.analyzing')}</h2>
            <p className="text-muted-foreground animate-pulse">Running AI diagnostic on your health profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-8 px-4 pb-12 animate-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate("/report-upload")} className="rounded-full">
                <ChevronLeft className="h-6 w-6" />
             </Button>
             <div>
                <div className="flex items-center gap-2 mb-1">
                   <Sparkles className="h-5 w-5 text-primary" />
                   <span className="text-xs font-black uppercase tracking-widest text-primary/60">AI Diagnostic Engine</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                  Health Analysis & Remedies
                </h1>
             </div>
          </div>
          <Button variant="outline" onClick={handleAnalyze} className="rounded-full border-primary/20 hover:bg-primary/5">
            <Activity className="mr-2 h-4 w-4" />
            Refresh Analysis
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status Panel */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="border-none shadow-premium bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Brain className="h-32 w-32" />
              </div>
              <CardHeader>
                <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-3xl font-black mb-4 shadow-lg">
                  {analysis?.healthScore || "?"}
                </div>
                <CardTitle className="text-2xl font-black">{t('reports.healthScore')}</CardTitle>
                <CardDescription>Based on your latest onboarding inputs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-2xl bg-background/50 border border-primary/10">
                   <p className="text-xs font-bold uppercase text-primary/60 mb-1">{t('reports.predictedCondition')}</p>
                   <p className="text-xl font-black">{analysis?.condition || "Excellent"}</p>
                </div>
                <div className="p-4 rounded-2xl bg-background/50 border border-primary/10">
                   <p className="text-xs font-bold uppercase text-primary/60 mb-1">{t('reports.riskLevel')}</p>
                   <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${analysis?.riskLevel === 'Low' ? 'bg-green-500' : 'bg-amber-500'}`} />
                      <p className="text-xl font-black uppercase text-primary">{analysis?.riskLevel || "Low"}</p>
                   </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-premium bg-muted/30">
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Prakriti (Dosha)
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                     <span className="text-4xl font-black text-primary">{analysis?.dominantDosha?.[0]}</span>
                     <div>
                        <p className="font-bold text-lg">{analysis?.dominantDosha} Type</p>
                        <p className="text-xs opacity-60">Ayurvedic Body Constitution</p>
                     </div>
                  </div>
                  <p className="text-sm leading-relaxed opacity-80 italic">
                    {analysis?.recommendations?.doshaAdvice || "Maintain a balanced lifestyle by eating warmth-providing foods and practicing grounding activities."}
                  </p>
               </CardContent>
            </Card>
          </div>

          {/* Recommendations Content */}
          <div className="lg:col-span-2 space-y-8">
             <div className="flex flex-col gap-4">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <Leaf className="h-7 w-7 text-primary" />
                  Medicine Cabinet
                </h3>
                <p className="text-muted-foreground">Personalized Ayurvedic remedies based on your reported symptoms.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysis?.recommendations?.medicines?.map((med: any, idx: number) => (
                  <Card key={idx} className="border-none shadow-premium bg-card/40 backdrop-blur-md group hover:scale-[1.02] transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Leaf className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase py-1 px-3 bg-primary/5 rounded-full border border-primary/10">Ayurvedic Remedy</span>
                      </div>
                      <CardTitle className="mt-4 text-xl font-bold">{med.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                         <p className="text-xs font-bold text-primary uppercase tracking-tighter">Primary Benefit</p>
                         <p className="text-sm opacity-80">{med.benefit}</p>
                      </div>
                      <div className="pt-2 flex items-center justify-between border-t border-muted">
                         <span className="text-[10px] opacity-40 italic">Natural Ingredient</span>
                         <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                )) || (
                  <div className="col-span-full py-12 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
                    <p className="text-muted-foreground">General wellness herbs recommended based on profile.</p>
                  </div>
                )}
             </div>

             <Card className="border-none shadow-premium bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-1">
                <div className="bg-background/80 rounded-2xl p-8">
                   <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-emerald-500" />
                      Expert Lifestyle Advice
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <p className="text-xs font-black uppercase text-emerald-600 tracking-widest">Dietary Guidelines</p>
                        <p className="text-sm leading-relaxed opacity-80">
                          {analysis?.recommendations?.dietAdvice || "Focus on fresh, seasonal vegetables and whole grains. Avoid processed sugars and excessive caffeine."}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-black uppercase text-teal-600 tracking-widest">Physical Activity</p>
                        <p className="text-sm leading-relaxed opacity-80">
                          {analysis?.recommendations?.exerciseAdvice || "Moderate yoga and rhythmic breathing (Pranayama) are highly recommended for your current constitution."}
                        </p>
                      </div>
                   </div>
                </div>
             </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
