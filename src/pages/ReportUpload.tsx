import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { 
  Activity, 
  FileText, 
  User, 
  Heart, 
  ClipboardList, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Plus,
  Loader2,
  Trash2,
  Filter,
  Sparkles
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { api } from "../services/api";

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-3 mb-4 opacity-80">
    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <h3 className="text-sm font-bold uppercase tracking-wider text-primary/80">{title}</h3>
  </div>
);

const DataRow = ({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) => (
  <div className="flex items-center justify-between py-3 border-b border-muted/50 last:border-0 group hover:bg-muted/30 px-3 transition-colors rounded-lg">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />}
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
    <span className="text-sm font-semibold text-foreground">
      {value === null || value === undefined || value === "" ? "—" : 
       (typeof value === "boolean" ? (value ? "Yes" : "No") : 
        (Array.isArray(value) ? (value.length > 0 ? value.join(", ") : "None") : value))}
    </span>
  </div>
);

export default function ReportUpload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [analyzingSuggestion, setAnalyzingSuggestion] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [reportAnalysis, setReportAnalysis] = useState<any>(null);
  const [manualEntry, setManualEntry] = useState({ hemoglobin: "", sugar: "", cholesterol: "" });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [onboardRes, aiRes] = await Promise.all([
          api.get("/api/onboarding").catch(() => ({ data: {} })),
          api.get("/api/ai/latest").catch(() => ({ data: null }))
        ]);
        
        // Merge user metadata with onboarding data
        const meta = user?.user_metadata || {};
        const combinedOnboarding = {
          age: String(meta.age || ""),
          gender: meta.gender || "",
          ...onboardRes?.data
        };

        setOnboarding(combinedOnboarding);
        setAiAnalysis(aiRes?.data || null);
      } catch (err) {
        console.error("Fetch Data Error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const triggerAnalysis = async () => {
    setAnalyzingSuggestion(true);
    try {
      const res = await api.post("/api/ai/analyze", { sensorData: {} });
      setAiAnalysis(res.data);
      setShowSuggestions(true);
      toast({ title: "Analysis Complete", description: "Your Ayurvedic suggestions are ready." });
    } catch (err) {
      toast({ title: "Analysis Failed", description: "Could not generate suggestions.", variant: "destructive" });
    } finally {
      setAnalyzingSuggestion(false);
    }
  };

  const handleUpdateOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await api.post("/api/onboarding", onboarding);
      toast({ title: "Updated!", description: "Your health profile has been saved." });
      setIsEditing(false);
    } catch (err) {
      toast({ title: "Update Failed", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleManualAnalysis = async () => {
    if (!manualEntry.hemoglobin && !manualEntry.sugar && !manualEntry.cholesterol) {
      toast({ title: "Empty Data", description: "Please enter at least one value." });
      return;
    }
    setUploadLoading(true);
    try {
      const res = await api.post("/api/reports/analyze-manual", manualEntry);
      setReportAnalysis(res.data);
      toast({ title: "Analysis Ready", description: "Your manual records have been processed." });
    } catch (err) {
      toast({ title: "Analysis Failed", description: "Failed to process records.", variant: "destructive" });
    } finally {
      setUploadLoading(false);
    }
  };

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("report", file);

    setUploadLoading(true);
    try {
      const res = await api.post("/api/reports/upload", formData);
      setReportAnalysis(res.data);
      toast({ title: "Report Uploaded", description: "AI is analyzing your report parameters." });
    } catch (err) {
      toast({ title: "Upload Failed", description: "Error processing the PDF document.", variant: "destructive" });
    } finally {
      setUploadLoading(false);
    }
  };

  if (!onboarding) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-20">
          <Activity className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 px-4 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{t('reports.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('reports.subtitle')}</p>
          </div>
        </div>

        <Tabs defaultValue="onboarding" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 rounded-2xl">
            <TabsTrigger value="onboarding" className="flex items-center gap-2 rounded-xl data-[state=active]:shadow-premium">
              <User className="h-4 w-4" />
              <span>{t('reports.tabProfile')}</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2 rounded-xl data-[state=active]:shadow-premium">
              <ClipboardList className="h-4 w-4" />
              <span>{t('reports.tabReports')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="onboarding" className="mt-0">
            <Card className="overflow-hidden border-none shadow-premium bg-background/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{t('reports.aiAssess')}</CardTitle>
                    <CardDescription>{t('reports.aiAssessDesc')}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  {onboarding && (onboarding._id || Object.keys(onboarding).length > 0) ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} className="hidden lg:flex rounded-full px-4">
                        {isEditing ? t('reports.cancelEdit') : t('reports.updateOnly')}
                      </Button>
                      <Button variant="default" size="sm" onClick={() => navigate("/onboarding?mode=update")} className="rounded-full px-6 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
                        {t('reports.fullUpdate')}
                      </Button>
                    </>
                  ) : (
                    <Button variant="default" size="sm" onClick={() => navigate("/onboarding")} className="rounded-full px-6 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
                      {t('reports.startProfile')}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex h-96 items-center justify-center">
                    <Activity className="h-10 w-10 animate-spin text-primary/40" />
                  </div>
                ) : (onboarding && (onboarding._id || Object.keys(onboarding).length > 0)) || isEditing ? (
                  isEditing ? (
                    <form onSubmit={handleUpdateOnboarding} className="p-8 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-6">
                          <SectionHeader icon={User} title={t('reports.basicInfo')} />
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>{t('onboarding.age')}</Label>
                              <Input type="number" className="rounded-xl" value={onboarding.age || ""} onChange={e => setOnboarding({...onboarding, age: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('onboarding.gender')}</Label>
                              <Select value={onboarding.gender} onValueChange={v => setOnboarding({...onboarding, gender: v})}>
                                <SelectTrigger className="rounded-xl"><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="male">{t('onboarding.male')}</SelectItem>
                                  <SelectItem value="female">{t('onboarding.female')}</SelectItem>
                                  <SelectItem value="other">{t('onboarding.other')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>{t('onboarding.marital')}</Label>
                              <Select value={onboarding.marital_status} onValueChange={v => setOnboarding({...onboarding, marital_status: v})}>
                                <SelectTrigger className="rounded-xl"><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="single">{t('onboarding.single')}</SelectItem>
                                  <SelectItem value="married">{t('onboarding.married')}</SelectItem>
                                  <SelectItem value="divorced">{t('onboarding.divorced')}</SelectItem>
                                  <SelectItem value="widowed">{t('onboarding.widowed')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>{t('onboarding.ph')}</Label>
                              <Select value={onboarding.physically_handicapped === undefined ? "" : (onboarding.physically_handicapped ? "yes" : "no")} onValueChange={v => setOnboarding({...onboarding, physically_handicapped: v === "yes"})}>
                                <SelectTrigger className="rounded-xl"><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yes">{t('onboarding.yes')}</SelectItem>
                                  <SelectItem value="no">{t('onboarding.no')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <SectionHeader icon={Activity} title={t('reports.vitalsAndReports')} />
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label>{t('reports.bpIssues')}</Label>
                              <Switch checked={onboarding.has_bp} onCheckedChange={v => setOnboarding({...onboarding, has_bp: v})} />
                            </div>
                            {onboarding.has_bp && <Input placeholder={t('onboarding.placeholder.bp')} value={onboarding.bp_values} onChange={e => setOnboarding({...onboarding, bp_values: e.target.value})} />}
                            
                            <div className="flex items-center justify-between">
                              <Label>{t('reports.sugarIssues')}</Label>
                              <Switch checked={onboarding.has_sugar} onCheckedChange={v => setOnboarding({...onboarding, has_sugar: v})} />
                            </div>
                            {(onboarding.has_sugar || onboarding.sugar) && <Input placeholder={t('onboarding.placeholder.sugar')} value={onboarding.sugar_values || onboarding.sugar} onChange={e => setOnboarding({...onboarding, sugar_values: e.target.value})} />}
                          </div>

                          <div className="grid grid-cols-1 gap-4 bg-primary/5 p-4 rounded-2xl border border-primary/10 mt-4">
                            <div className="space-y-2">
                              <Label>{t('reports.hemo')}</Label>
                              <Input type="number" step="0.1" className="bg-background" value={onboarding.hemoglobin || ""} onChange={e => setOnboarding({...onboarding, hemoglobin: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('reports.bloodSugar')}</Label>
                              <Input type="number" className="bg-background" value={onboarding.sugar || ""} onChange={e => setOnboarding({...onboarding, sugar: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('reports.cholesterol')}</Label>
                              <Input type="number" className="bg-background" value={onboarding.cholesterol || ""} onChange={e => setOnboarding({...onboarding, cholesterol: e.target.value})} />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                           <SectionHeader icon={Activity} title={t('onboarding.stepDiet')} />
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>{t('onboarding.dietType')}</Label>
                                <Select value={onboarding.diet_type} onValueChange={v => setOnboarding({...onboarding, diet_type: v})}>
                                  <SelectTrigger className="rounded-xl"><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="veg">{t('onboarding.veg')}</SelectItem>
                                    <SelectItem value="nonveg">{t('onboarding.nonveg')}</SelectItem>
                                    <SelectItem value="vegan">{t('onboarding.vegan')}</SelectItem>
                                    <SelectItem value="eggetarian">{t('onboarding.eggetarian')}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>{t('reports.mealsDay')}</Label>
                                <Select value={onboarding.meals_per_day} onValueChange={v => setOnboarding({...onboarding, meals_per_day: v})}>
                                  <SelectTrigger className="rounded-xl"><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1meal">{t('onboarding.options.diet.1meal')}</SelectItem>
                                    <SelectItem value="2meals">{t('onboarding.options.diet.2meals')}</SelectItem>
                                    <SelectItem value="3meals">{t('onboarding.options.diet.3meals')}</SelectItem>
                                    <SelectItem value="4meals">{t('onboarding.options.diet.4meals')}</SelectItem>
                                    <SelectItem value="5meals">{t('onboarding.options.diet.5meals')}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                          <SectionHeader icon={Heart} title={t('reports.lifestyle')} />
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>{t('onboarding.smoking')}</Label>
                              <Select value={onboarding.smoking} onValueChange={v => setOnboarding({...onboarding, smoking: v})}>
                                <SelectTrigger className="rounded-xl"><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="never">{t('onboarding.never')}</SelectItem>
                                  <SelectItem value="occasionally">{t('onboarding.occasionally')}</SelectItem>
                                  <SelectItem value="regularly">{t('onboarding.regularly')}</SelectItem>
                                  <SelectItem value="quit">{t('onboarding.quit')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>{t('onboarding.alcohol')}</Label>
                              <Select value={onboarding.alcohol} onValueChange={v => setOnboarding({...onboarding, alcohol: v})}>
                                <SelectTrigger className="rounded-xl"><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="never">{t('onboarding.never')}</SelectItem>
                                  <SelectItem value="occasionally">{t('onboarding.occasionally')}</SelectItem>
                                  <SelectItem value="regularly">{t('onboarding.regularly')}</SelectItem>
                                  <SelectItem value="quit">{t('onboarding.quit')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>{t('onboarding.sleepHours')}</Label>
                            <Input type="number" className="rounded-xl" value={onboarding.sleep_hours?.[0] || onboarding.sleep_hours || ""} onChange={e => setOnboarding({...onboarding, sleep_hours: e.target.value})} />
                          </div>
                          
                          <SectionHeader icon={ClipboardList} title={t('reports.medHist')} />
                          <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t('reports.pastSurgical')}</Label>
                                <Textarea className="rounded-xl bg-background" value={onboarding.surgical_history || ""} onChange={e => setOnboarding({...onboarding, surgical_history: e.target.value})} placeholder={t('onboarding.placeholder.surgical')} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end pt-6 border-t">
                        <Button type="submit" disabled={isUpdating} className="rounded-full px-8 shadow-premium">
                          {isUpdating ? t('reports.applying') : t('reports.saveProfile')}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-8 space-y-12">
                      {/* AI Health Suggestions Section */}
                      <div className="p-8 rounded-[2rem] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 animate-in fade-in duration-700">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                          <div className="flex-shrink-0 relative">
                            {aiAnalysis ? (
                              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 p-1">
                                <div className="h-full w-full rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg">
                                  {aiAnalysis.healthScore || aiAnalysis.dominantDosha?.[0] || "?"}
                                </div>
                              </div>
                            ) : (
                              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-muted-foreground/20">
                                <Activity className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                              <h4 className="text-xl font-bold text-primary flex items-center gap-2 justify-center md:justify-start">
                                {t('reports.healthProfile')}
                                {aiAnalysis && <span className="text-xs px-2 py-0.5 bg-primary/20 rounded-full font-black uppercase tracking-tighter">AI Active</span>}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {aiAnalysis ? t('dashboard.basedOn') : "Get personalized AI health insights and Ayurvedic medicine suggestions based on your profile."}
                              </p>
                            </div>
                            
                            {!showSuggestions || !aiAnalysis ? (
                              <Button 
                                onClick={() => navigate("/ai-suggestions")}
                                disabled={analyzingSuggestion}
                                className="rounded-full px-8 bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-transform shadow-premium py-6 text-lg font-bold"
                              >
                                {analyzingSuggestion ? (
                                  <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    {t('reports.analyzing')}
                                  </>
                                ) : (
                                  <>
                                    <Plus className="mr-2 h-5 w-5" />
                                    {t('reports.getMedicine')}
                                  </>
                                )}
                              </Button>
                            ) : (
                                <Button 
                                    onClick={() => navigate("/ai-suggestions")}
                                    className="rounded-full px-8 bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-transform shadow-premium py-6 text-lg font-bold"
                                >
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    View Full AI Analysis
                                </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-10">
                          <div>
                            <SectionHeader icon={User} title={t('reports.bioData')} />
                            <div className="grid grid-cols-1 gap-1">
                              <DataRow label={t('onboarding.age')} value={onboarding.age} icon={Activity} />
                              <DataRow label={t('onboarding.gender')} value={onboarding.gender ? t(`onboarding.${onboarding.gender}`) : "—"} icon={User} />
                              <DataRow label={t('onboarding.marital')} value={onboarding.marital_status ? t(`onboarding.${onboarding.marital_status}`) : "—"} icon={Heart} />
                              <DataRow label={t('onboarding.phStatus')} value={onboarding.physically_handicapped === true ? "True (PH)" : "False (General)"} icon={User} />
                            </div>
                          </div>

                          <div>
                            <SectionHeader icon={ClipboardList} title={t('reports.clinicalBasics')} />
                            <div className="grid grid-cols-1 gap-1">
                              <DataRow label={t('reports.bpReading')} value={onboarding.bp_values} icon={Activity} />
                              <DataRow label={t('reports.sugarReading')} value={onboarding.sugar_values} icon={Activity} />
                              <DataRow label={t('reports.hemo')} value={onboarding.hemoglobin} icon={Activity} />
                            </div>
                          </div>

                          <div>
                             <SectionHeader icon={AlertCircle} title={t('reports.medicalRisk')} />
                             <div className="grid grid-cols-1 gap-1">
                               <DataRow label={t('reports.strokeHist')} value={onboarding.stroke_history} icon={AlertCircle} />
                               <DataRow label={t('reports.cardiacHist')} value={onboarding.cardiac_arrest_history} icon={Activity} />
                               <DataRow label={t('reports.traumaticHist')} value={onboarding.past_traumatic_history} icon={AlertCircle} />
                               <DataRow label={t('reports.pastSurgical')} value={onboarding.surgical_history} icon={ClipboardList} />
                             </div>
                          </div>
                        </div>

                        <div className="space-y-10">
                          <div>
                            <SectionHeader icon={Heart} title={t('reports.symptoms')} />
                            <div className="grid grid-cols-1 gap-1">
                              <DataRow label={t('reports.headache')} value={onboarding.headache_type && onboarding.headache_type !== 'none' ? t(`onboarding.options.headache.${onboarding.headache_type}`) : 'None'} icon={Activity} />
                              <DataRow label={t('reports.painLevel')} value={onboarding.pain_severity ? t(`onboarding.${onboarding.pain_severity}`) : 'N/A'} icon={AlertCircle} />
                              <DataRow label={t('reports.lowEnergy')} value={onboarding.low_energy} icon={Activity} />
                              <DataRow label={t('reports.chestPressure')} value={onboarding.chest_pressure} icon={Activity} />
                            </div>
                          </div>

                          <div>
                             <SectionHeader icon={Activity} title={t('reports.entOcular')} />
                             <div className="grid grid-cols-1 gap-1">
                               <DataRow label={t('reports.earIssues')} value={onboarding.ent_issues} icon={Activity} />
                               <DataRow label={t('reports.eyeIssues')} value={onboarding.ocular_issues} icon={Activity} />
                             </div>
                          </div>

                          <div>
                            <SectionHeader icon={Activity} title={t('reports.lifestyle')} />
                            <div className="grid grid-cols-1 gap-1">
                              <DataRow label={t('onboarding.smoking')} value={onboarding.smoking ? t(`onboarding.${onboarding.smoking}`) : "—"} icon={Activity} />
                              <DataRow label={t('onboarding.alcohol')} value={onboarding.alcohol ? t(`onboarding.${onboarding.alcohol}`) : "—"} icon={Activity} />
                              <DataRow label={t('onboarding.sleepHours')} value={onboarding.sleep_hours?.[0] || onboarding.sleep_hours} icon={Activity} />
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-2 pt-12 border-t border-muted/30">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
                              <div>
                                 <SectionHeader icon={Filter} title={t('reports.dietDigest')} />
                                 <div className="grid grid-cols-1 gap-1">
                                    <DataRow label={t('reports.dietType')} value={onboarding.diet_type ? t(`onboarding.${onboarding.diet_type}`) : "—"} icon={Activity} />
                                    <DataRow label={t('reports.mealsDay')} value={onboarding.meals_per_day} icon={Activity} />
                                    <DataRow label={t('reports.junkFood')} value={onboarding.outside_food_intake ? t(`onboarding.${onboarding.outside_food_intake}`) : "—"} icon={Activity} />
                                 </div>
                              </div>
                              <div>
                                 <SectionHeader icon={ClipboardList} title={t('reports.medication')} />
                                 <div className="grid grid-cols-1 gap-1">
                                    <DataRow label={t('reports.onMeds')} value={onboarding.on_medication} icon={CheckCircle2} />
                                    <DataRow label={t('reports.medsHistory')} value={onboarding.medications_history} icon={ClipboardList} />
                                 </div>
                              </div>
                           </div>

                           <div className="flex flex-col items-center gap-6 text-center">
                              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-40">
                                {t('reports.updatedAt')}: {onboarding.updatedAt ? new Date(onboarding.updatedAt).toLocaleDateString() : new Date().toLocaleDateString()}
                              </p>
                              <Button 
                                onClick={() => navigate("/onboarding?mode=update")} 
                                className="rounded-full px-12 py-7 text-xl font-black shadow-premium bg-gradient-to-r from-primary/80 to-primary hover:scale-105 transition-all text-white border-none"
                              >
                                {t('reports.updateOnboarding')}
                              </Button>
                              <p className="text-[10px] opacity-40 max-w-xs leading-relaxed">
                                Updating your onboarding data helps the AI provide more accurate health predictions and specific medicines.
                              </p>
                           </div>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="p-12 text-center space-y-4">
                    <div className="mx-auto h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                      <ClipboardList className="h-10 w-10 text-primary/40" />
                    </div>
                    <h3 className="text-xl font-bold">{t('reports.noData')}</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Complete your medical profile to enable AI analysis and personalized health suggestions.
                    </p>
                    <Button onClick={() => navigate("/onboarding")} className="mt-4 rounded-full px-8 shadow-premium">
                      {t('reports.startProfile')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-0 space-y-6">
            <Card className="border-none shadow-premium bg-background/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b bg-muted/30 px-6 py-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <Upload className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle className="text-xl">{t('reports.uploadTitle')}</CardTitle>
                      <CardDescription>{t('reports.uploadDesc')}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="group relative border-2 border-dashed border-primary/20 rounded-3xl p-12 text-center hover:border-primary/40 transition-all bg-primary/5 cursor-pointer">
                      <input type="file" onChange={onFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,image/*" disabled={uploadLoading} />
                      <div className="space-y-4">
                        <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <p className="font-bold text-lg">{t('reports.dropzone')}</p>
                          <p className="text-xs text-muted-foreground">PDF, JPEG or PNG up to 10MB</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-bold text-primary">{t('reports.manualEntry')}</Label>
                      </div>
                      <div className="grid grid-cols-1 gap-4 bg-muted/30 p-6 rounded-3xl border border-muted/50">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest opacity-60">{t('reports.hemo')}</Label>
                          <Input 
                            value={manualEntry.hemoglobin} 
                            onChange={e => setManualEntry(p => ({...p, hemoglobin: e.target.value}))} 
                            placeholder="e.g. 13.5" 
                            className="rounded-xl bg-background text-lg py-6"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest opacity-60">{t('reports.bloodSugar')}</Label>
                          <Input 
                            value={manualEntry.sugar} 
                            onChange={e => setManualEntry(p => ({...p, sugar: e.target.value}))} 
                            placeholder="e.g. 110" 
                            className="rounded-xl bg-background text-lg py-6"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest opacity-60">{t('reports.cholesterol')}</Label>
                          <Input 
                            value={manualEntry.cholesterol} 
                            onChange={e => setManualEntry(p => ({...p, cholesterol: e.target.value}))} 
                            placeholder="e.g. 180" 
                            className="rounded-xl bg-background text-lg py-6"
                          />
                        </div>
                        <Button 
                          onClick={handleManualAnalysis} 
                          disabled={uploadLoading}
                          className="w-full mt-4 rounded-xl py-6 text-base font-bold shadow-premium bg-gradient-to-r from-primary to-primary/80"
                        >
                          {uploadLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              {t('reports.analyzing')}
                            </>
                          ) : (
                            <>
                              <Activity className="mr-2 h-5 w-5" />
                              {t('reports.analyze')}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {reportAnalysis ? (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-xl flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            {t('reports.analysisTitle')}
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {reportAnalysis.parameters?.length > 0 ? reportAnalysis.parameters.map((param: any, idx: number) => (
                            <div key={idx} className="bg-background/80 border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-sm tracking-wide uppercase opacity-70">{param.name}</span>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                  param.status === 'Normal' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {param.status === 'Normal' ? t('reports.normal') : t('reports.abnormal')}
                                </span>
                              </div>
                              <div className="flex items-end justify-between">
                                <div className="space-y-1">
                                  <p className="text-2xl font-black">{param.value} <span className="text-xs font-normal opacity-50">{param.unit}</span></p>
                                  <p className="text-[10px] font-medium opacity-40">{t('reports.normalRange')}: {param.normal_range}</p>
                                </div>
                                <div className={`flex items-center gap-1.5 text-xs font-bold ${
                                  param.status === 'Normal' ? 'text-green-600' : (param.value > parseFloat(param.normal_range.split('-')[1]) ? 'text-red-500' : 'text-blue-500')
                                }`}>
                                  {param.status === 'Normal' ? <CheckCircle2 className="h-4 w-4" /> : (param.value > parseFloat(param.normal_range.split('-')[1]) ? <Activity className="h-4 w-4" /> : <Activity className="h-4 w-4" />)}
                                  {param.status === 'Normal' ? 'IDEAL' : (param.value > parseFloat(param.normal_range.split('-')[1]) ? t('reports.high') : t('reports.low'))}
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="p-8 text-center bg-muted/20 rounded-3xl border border-dashed border-muted/50">
                              <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                              <h4 className="font-bold text-lg mb-2">{t('reports.noValuesTitle')}</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {t('reports.noValuesDesc')}
                              </p>
                            </div>
                          )}
                        </div>

                        {reportAnalysis.parameters?.length > 0 && (
                          <div className="p-6 bg-primary/10 rounded-3xl border border-primary/20 space-y-3">
                            <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                AI Assessment
                            </h4>
                            <p className="text-sm leading-relaxed font-medium">
                                {reportAnalysis.summary || "Based on your report parameters, your health metrics are mostly within range. Continue monitoring and maintain a balanced diet."}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-muted/20 rounded-3xl border border-dashed border-muted/50 opacity-60">
                        <div className="h-20 w-20 rounded-3xl bg-background flex items-center justify-center mb-6 shadow-sm">
                          <FileText className="h-10 w-10 text-muted-foreground opacity-30" />
                        </div>
                        <h3 className="font-bold text-xl mb-2">{t('reports.analysisTitle')}</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                          Upload a report or enter values manually to see a detailed health breakdown here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
