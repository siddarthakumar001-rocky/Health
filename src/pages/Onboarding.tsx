import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/lib/auth";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

const HEADACHE_TYPES = ["Half Headache", "Temporal Headache", "Migraine", "Cluster Headache", "Tension Headache", "Sinus Headache"];
const BODY_PAIN_LOCATIONS = ["Head", "Neck", "Thorax", "Abdomen", "Upper Limbs", "Lower Limbs", "Back"];
const COMMON_SYMPTOMS = [
  "Cold", "Cough (with sputum)", "Cough (without sputum)", "Numbness", "Tingling Sensation",
  "Pain", "Vomiting", "Loose Motion", "Abdominal Discomfort", "Neck Pain",
  "Loss of Appetite", "Fatigue", "Body Ache", "Fever", "Dizziness",
];
const ENT_ISSUES = [
  "Deafness", "Ear Discharge", "Ear Pain", "Throat Pain", "Nasal Bleeding",
  "Nasal Obstruction", "Polyp", "Deviated Nasal Septum", "Loss of Taste", "Ulcers on Oral Cavity",
];
const OCULAR_ISSUES = [
  "Redness", "Eye Pain", "Irritation to Light", "Excessive Tears", "Distant Vision Issues",
  "Near Vision Issues", "Squint Eyes",
];
const CONDITIONS = ["Diabetes", "Hypertension", "Stroke", "Heart Disease", "Asthma", "Thyroid Disorder"];
const BLOOD_INVESTIGATIONS = ["CBC", "CRP", "LFT", "TFT", "RFT", "Lipid Profile", "Urine Routine", "HbA1c", "ESR"];
const IMAGING_TYPES = ["X-Ray", "CT Scan", "MRI Scan", "PET Scan", "Mammography", "Ultrasound", "ECG", "Echo"];

interface OnboardingData {
  age: string; gender: string; marital_status: string; physically_handicapped: boolean;
  headache_type: string; body_pain_location: string[]; chest_pain_side: string; chest_pressure: boolean;
  stroke_history: boolean; cardiac_arrest_history: boolean;
  conditions: string[];
  on_medication: boolean; medication_details: string;
  has_bp: boolean; bp_values: string; has_sugar: boolean; sugar_values: string;
  low_energy: boolean; proper_sleep: boolean; sleep_hours: number[];
  pain_severity: string; pain_locations: string[];
  common_symptoms: string[];
  wound_scar_marks: boolean; wound_details: string; fractures: boolean; fracture_details: string;
  ent_issues: string[]; ocular_issues: string[]; ocular_family_history: boolean;
  menstrual_flow: string; cycle_duration: string; pads_per_day: string; menstrual_other_symptoms: string;
  menopausal: boolean;
  past_traumatic_history: string; surgical_history: string; medications_history: string;
  physical_exhaustion: boolean;
  smoking: string; smoking_duration: string; smoking_frequency: string;
  alcohol: string; alcohol_duration: string; alcohol_frequency: string;
  other_addictions: string;
  sexually_active: string;
  blood_investigations: string[]; imaging_done: string[];
  has_blood_report: boolean;
  diet_type: string; meals_per_day: string; food_type: string; outside_food_intake: string;
  womens_health: string;
}

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    age: "", gender: "", marital_status: "", physically_handicapped: false,
    headache_type: "", body_pain_location: [], chest_pain_side: "", chest_pressure: false,
    stroke_history: false, cardiac_arrest_history: false,
    conditions: [],
    on_medication: false, medication_details: "",
    has_bp: false, bp_values: "", has_sugar: false, sugar_values: "",
    low_energy: false, proper_sleep: true, sleep_hours: [7],
    pain_severity: "", pain_locations: [],
    common_symptoms: [],
    wound_scar_marks: false, wound_details: "", fractures: false, fracture_details: "",
    ent_issues: [], ocular_issues: [], ocular_family_history: false,
    menstrual_flow: "", cycle_duration: "", pads_per_day: "", menstrual_other_symptoms: "",
    menopausal: false,
    past_traumatic_history: "", surgical_history: "", medications_history: "",
    physical_exhaustion: false,
    smoking: "never", smoking_duration: "", smoking_frequency: "",
    alcohol: "never", alcohol_duration: "", alcohol_frequency: "",
    other_addictions: "",
    sexually_active: "",
    blood_investigations: [], imaging_done: [],
    has_blood_report: false,
    diet_type: "veg", meals_per_day: "3", food_type: "", outside_food_intake: "rarely",
    womens_health: "",
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const set = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setData(prev => ({ ...prev, [key]: value }));

  const toggleArr = (key: keyof OnboardingData, item: string) => {
    setData(prev => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item] };
    });
  };

  // Determine steps based on gender
  const getSteps = () => {
    const steps = [
      "Basic Info", "Pain & Symptoms", "Common Symptoms", "Medical History",
      "Medications & Vitals", "Lifestyle & Sleep", "Physical Exam",
      "ENT & Ocular", "Substance Use",
    ];
    if (data.gender === "female") steps.push("Women's Health");
    if (data.marital_status === "married") steps.push("Sexual History");
    steps.push("Investigations & Imaging", "Diet History");
    return steps;
  };

  const steps = getSteps();
  const totalSteps = steps.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleFinish = async () => {
    if (!user) return;
    try {
      await api.post("/onboarding", {
        user_id: user.id,
          age: parseInt(data.age) || 0,
          gender: data.gender,
          marital_status: data.marital_status,
          symptoms: data.common_symptoms,
          conditions: data.conditions,
          on_medication: data.on_medication,
          medication_details: data.medication_details,
          sleep_hours: data.sleep_hours[0],
          smoking: data.smoking,
          alcohol: data.alcohol,
          exercise: data.physical_exhaustion ? "limited" : "normal",
          womens_health: data.womens_health,
          physically_handicapped: data.physically_handicapped,
          headache_type: data.headache_type,
          body_pain_location: data.body_pain_location,
          chest_pain_side: data.chest_pain_side,
          chest_pressure: data.chest_pressure,
          stroke_history: data.stroke_history,
          cardiac_arrest_history: data.cardiac_arrest_history,
          has_bp: data.has_bp,
          bp_values: data.bp_values,
          has_sugar: data.has_sugar,
          sugar_values: data.sugar_values,
          low_energy: data.low_energy,
          proper_sleep: data.proper_sleep,
          has_blood_report: data.has_blood_report,
          pain_severity: data.pain_severity,
          pain_locations: data.pain_locations,
          wound_scar_marks: data.wound_scar_marks,
          wound_details: data.wound_details,
          fractures: data.fractures,
          fracture_details: data.fracture_details,
          menstrual_flow: data.menstrual_flow,
          cycle_duration: data.cycle_duration,
          pads_per_day: parseInt(data.pads_per_day) || null,
          menstrual_other_symptoms: data.menstrual_other_symptoms,
          menopausal: data.menopausal,
          past_traumatic_history: data.past_traumatic_history,
          surgical_history: data.surgical_history,
          medications_history: data.medications_history,
          physical_exhaustion: data.physical_exhaustion,
          smoking_duration: data.smoking_duration,
          smoking_frequency: data.smoking_frequency,
          alcohol_duration: data.alcohol_duration,
          alcohol_frequency: data.alcohol_frequency,
          other_addictions: data.other_addictions,
          ent_issues: data.ent_issues,
          ocular_issues: data.ocular_issues,
          ocular_family_history: data.ocular_family_history,
          common_symptoms: data.common_symptoms,
          sexually_active: data.sexually_active === "yes",
          blood_investigations: data.blood_investigations,
          imaging_done: data.imaging_done,
          diet_type: data.diet_type,
          meals_per_day: parseInt(data.meals_per_day) || 3,
          food_type: data.food_type,
          outside_food_intake: data.outside_food_intake,
        });
      navigate("/device-connect");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const CheckboxGrid = ({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (s: string) => void }) => (
    <div className="grid grid-cols-2 gap-2">
      {items.map(item => (
        <label key={item} className="flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 text-sm transition-colors hover:bg-accent">
          <Checkbox checked={selected.includes(item)} onCheckedChange={() => onToggle(item)} />
          <span>{item}</span>
        </label>
      ))}
    </div>
  );

  const YesNo = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <Label className="text-sm">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );

  const renderStep = () => {
    const currentStepName = steps[step];

    switch (currentStepName) {
      case "Basic Info":
        return (
          <>
            <CardTitle className="font-display">Basic Information</CardTitle>
            <CardDescription>Tell us about yourself</CardDescription>
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input type="number" value={data.age} onChange={e => set("age", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={data.gender} onValueChange={v => set("gender", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Marital Status</Label>
                <Select value={data.marital_status} onValueChange={v => set("marital_status", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single / Unmarried</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <YesNo label="Are you Physically Handicapped (PH)?" value={data.physically_handicapped} onChange={v => set("physically_handicapped", v)} />
            </div>
          </>
        );

      case "Pain & Symptoms":
        return (
          <>
            <CardTitle className="font-display">Pain & Symptoms</CardTitle>
            <CardDescription>Describe any pain or discomfort</CardDescription>
            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label>Headache Type</Label>
                <Select value={data.headache_type} onValueChange={v => set("headache_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type (if any)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Headache</SelectItem>
                    {HEADACHE_TYPES.map(t => <SelectItem key={t} value={t.toLowerCase().replace(/ /g, "_")}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Body Pain Location(s)</Label>
                <CheckboxGrid items={BODY_PAIN_LOCATIONS} selected={data.body_pain_location} onToggle={i => toggleArr("body_pain_location", i)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chest Pain Side</Label>
                  <Select value={data.chest_pain_side} onValueChange={v => set("chest_pain_side", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Chest Pain</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="both">Both Sides</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <YesNo label="Pressure on chest?" value={data.chest_pressure} onChange={v => set("chest_pressure", v)} />
              </div>
              <div className="space-y-2">
                <Label>Pain Severity</Label>
                <Select value={data.pain_severity} onValueChange={v => set("pain_severity", v)}>
                  <SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Pain</SelectItem>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                    <SelectItem value="very_severe">Very Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <YesNo label="Low Energy?" value={data.low_energy} onChange={v => set("low_energy", v)} />
            </div>
          </>
        );

      case "Common Symptoms":
        return (
          <>
            <CardTitle className="font-display">Common Symptoms</CardTitle>
            <CardDescription>Select any symptoms you're experiencing</CardDescription>
            <div className="mt-6">
              <CheckboxGrid items={COMMON_SYMPTOMS} selected={data.common_symptoms} onToggle={i => toggleArr("common_symptoms", i)} />
            </div>
          </>
        );

      case "Medical History":
        return (
          <>
            <CardTitle className="font-display">Medical History</CardTitle>
            <CardDescription>Your past medical conditions and history</CardDescription>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label>Existing Conditions</Label>
                <CheckboxGrid items={CONDITIONS} selected={data.conditions} onToggle={i => toggleArr("conditions", i)} />
              </div>
              <YesNo label="Previous history of Stroke?" value={data.stroke_history} onChange={v => set("stroke_history", v)} />
              <YesNo label="Previous Cardiac Arrest?" value={data.cardiac_arrest_history} onChange={v => set("cardiac_arrest_history", v)} />
              <div className="space-y-2">
                <Label>Past Traumatic History</Label>
                <Textarea value={data.past_traumatic_history} onChange={e => set("past_traumatic_history", e.target.value)} placeholder="Describe any past traumatic events..." />
              </div>
              <div className="space-y-2">
                <Label>Surgical History</Label>
                <Textarea value={data.surgical_history} onChange={e => set("surgical_history", e.target.value)} placeholder="List any past surgeries..." />
              </div>
            </div>
          </>
        );

      case "Medications & Vitals":
        return (
          <>
            <CardTitle className="font-display">Medications & Vitals</CardTitle>
            <CardDescription>Current medications and vital readings</CardDescription>
            <div className="mt-6 space-y-4">
              <YesNo label="Currently on any medication?" value={data.on_medication} onChange={v => set("on_medication", v)} />
              {data.on_medication && (
                <div className="space-y-2">
                  <Label>Medication Details</Label>
                  <Textarea value={data.medication_details} onChange={e => set("medication_details", e.target.value)} placeholder="List your medications..." />
                </div>
              )}
              <div className="space-y-2">
                <Label>Medications History (past)</Label>
                <Textarea value={data.medications_history} onChange={e => set("medications_history", e.target.value)} placeholder="Any past medications..." />
              </div>
              <YesNo label="Do you have BP (Blood Pressure issues)?" value={data.has_bp} onChange={v => set("has_bp", v)} />
              {data.has_bp && (
                <div className="space-y-2">
                  <Label>BP Values (if known)</Label>
                  <Input value={data.bp_values} onChange={e => set("bp_values", e.target.value)} placeholder="e.g. 120/80 mmHg" />
                </div>
              )}
              <YesNo label="Do you have Sugar (Diabetes)?" value={data.has_sugar} onChange={v => set("has_sugar", v)} />
              {data.has_sugar && (
                <div className="space-y-2">
                  <Label>Sugar Values (if known)</Label>
                  <Input value={data.sugar_values} onChange={e => set("sugar_values", e.target.value)} placeholder="e.g. Fasting: 110 mg/dL" />
                </div>
              )}
            </div>
          </>
        );

      case "Lifestyle & Sleep":
        return (
          <>
            <CardTitle className="font-display">Lifestyle & Sleep</CardTitle>
            <CardDescription>Your daily habits and sleep pattern</CardDescription>
            <div className="mt-6 space-y-5">
              <YesNo label="Do you get proper sleep?" value={data.proper_sleep} onChange={v => set("proper_sleep", v)} />
              <div className="space-y-2">
                <Label>Sleep Hours: {data.sleep_hours[0]}h</Label>
                <Slider value={data.sleep_hours} onValueChange={v => set("sleep_hours", v)} min={1} max={14} step={0.5} />
              </div>
              <YesNo label="Physical exhaustion during walk or exercise?" value={data.physical_exhaustion} onChange={v => set("physical_exhaustion", v)} />
            </div>
          </>
        );

      case "Physical Exam":
        return (
          <>
            <CardTitle className="font-display">Physical Examination</CardTitle>
            <CardDescription>Wounds, scars, and fractures</CardDescription>
            <div className="mt-6 space-y-4">
              <YesNo label="Any wound/scar marks?" value={data.wound_scar_marks} onChange={v => set("wound_scar_marks", v)} />
              {data.wound_scar_marks && (
                <div className="space-y-2">
                  <Label>Wound/Scar Details</Label>
                  <Textarea value={data.wound_details} onChange={e => set("wound_details", e.target.value)} placeholder="Describe location and type..." />
                </div>
              )}
              <YesNo label="Any fractures?" value={data.fractures} onChange={v => set("fractures", v)} />
              {data.fractures && (
                <div className="space-y-2">
                  <Label>Fracture Details</Label>
                  <Textarea value={data.fracture_details} onChange={e => set("fracture_details", e.target.value)} placeholder="Describe fracture location and status..." />
                </div>
              )}
            </div>
          </>
        );

      case "ENT & Ocular":
        return (
          <>
            <CardTitle className="font-display">ENT & Eye History</CardTitle>
            <CardDescription>Ear, Nose, Throat, and Eye related issues</CardDescription>
            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label>ENT Issues</Label>
                <CheckboxGrid items={ENT_ISSUES} selected={data.ent_issues} onToggle={i => toggleArr("ent_issues", i)} />
              </div>
              <div className="space-y-2">
                <Label>Ocular (Eye) Issues</Label>
                <CheckboxGrid items={OCULAR_ISSUES} selected={data.ocular_issues} onToggle={i => toggleArr("ocular_issues", i)} />
              </div>
              <YesNo label="Family history of eye conditions?" value={data.ocular_family_history} onChange={v => set("ocular_family_history", v)} />
            </div>
          </>
        );

      case "Substance Use":
        return (
          <>
            <CardTitle className="font-display">Substance Use History</CardTitle>
            <CardDescription>Smoking, alcohol, and other substances</CardDescription>
            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label>Smoking</Label>
                <Select value={data.smoking} onValueChange={v => set("smoking", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="occasionally">Occasionally</SelectItem>
                    <SelectItem value="regularly">Regularly</SelectItem>
                    <SelectItem value="quit">Quit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {data.smoking !== "never" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input value={data.smoking_duration} onChange={e => set("smoking_duration", e.target.value)} placeholder="e.g. 5 years" />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Input value={data.smoking_frequency} onChange={e => set("smoking_frequency", e.target.value)} placeholder="e.g. 3 per day" />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Alcohol</Label>
                <Select value={data.alcohol} onValueChange={v => set("alcohol", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="occasionally">Occasionally</SelectItem>
                    <SelectItem value="regularly">Regularly</SelectItem>
                    <SelectItem value="quit">Quit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {data.alcohol !== "never" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input value={data.alcohol_duration} onChange={e => set("alcohol_duration", e.target.value)} placeholder="e.g. 3 years" />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Input value={data.alcohol_frequency} onChange={e => set("alcohol_frequency", e.target.value)} placeholder="e.g. weekends" />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Other Addictions</Label>
                <Textarea value={data.other_addictions} onChange={e => set("other_addictions", e.target.value)} placeholder="Any other substance use..." />
              </div>
            </div>
          </>
        );

      case "Women's Health":
        return (
          <>
            <CardTitle className="font-display">Women's Health</CardTitle>
            <CardDescription>Menstrual and reproductive health</CardDescription>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label>Menstrual Flow</Label>
                <Select value={data.menstrual_flow} onValueChange={v => set("menstrual_flow", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="heavy">Heavy</SelectItem>
                    <SelectItem value="irregular">Irregular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cycle Duration (days)</Label>
                  <Input value={data.cycle_duration} onChange={e => set("cycle_duration", e.target.value)} placeholder="e.g. 28" />
                </div>
                <div className="space-y-2">
                  <Label>Pads per Day (1-5)</Label>
                  <Select value={data.pads_per_day} onValueChange={v => set("pads_per_day", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Other Menstrual Symptoms</Label>
                <Textarea value={data.menstrual_other_symptoms} onChange={e => set("menstrual_other_symptoms", e.target.value)} placeholder="Cramps, mood changes, etc." />
              </div>
              <YesNo label="Menopausal?" value={data.menopausal} onChange={v => set("menopausal", v)} />
              <div className="space-y-2">
                <Label>Pregnancy / Reproductive Status</Label>
                <Select value={data.womens_health} onValueChange={v => set("womens_health", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="na">Not applicable</SelectItem>
                    <SelectItem value="pregnant">Pregnant</SelectItem>
                    <SelectItem value="postpartum">Postpartum</SelectItem>
                    <SelectItem value="trying">Trying to conceive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        );

      case "Sexual History":
        return (
          <>
            <CardTitle className="font-display">Sexual History</CardTitle>
            <CardDescription>This information is confidential</CardDescription>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label>Are you sexually active?</Label>
                <Select value={data.sexually_active} onValueChange={v => set("sexually_active", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        );

      case "Investigations & Imaging":
        return (
          <>
            <CardTitle className="font-display">Investigations & Imaging</CardTitle>
            <CardDescription>Previous blood tests and imaging done</CardDescription>
            <div className="mt-6 space-y-5">
              <YesNo label="Have you done any blood investigations before?" value={data.has_blood_report} onChange={v => set("has_blood_report", v)} />
              {data.has_blood_report && (
                <div className="space-y-2">
                  <Label>Blood Investigations Done</Label>
                  <CheckboxGrid items={BLOOD_INVESTIGATIONS} selected={data.blood_investigations} onToggle={i => toggleArr("blood_investigations", i)} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Imaging Done</Label>
                <CheckboxGrid items={IMAGING_TYPES} selected={data.imaging_done} onToggle={i => toggleArr("imaging_done", i)} />
              </div>
            </div>
          </>
        );

      case "Diet History":
        return (
          <>
            <CardTitle className="font-display">Diet History</CardTitle>
            <CardDescription>Your food habits and nutrition</CardDescription>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label>Diet Type</Label>
                <Select value={data.diet_type} onValueChange={v => set("diet_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="veg">Vegetarian</SelectItem>
                    <SelectItem value="nonveg">Non-Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="eggetarian">Eggetarian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Meals per Day</Label>
                <Select value={data.meals_per_day} onValueChange={v => set("meals_per_day", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} meals</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type of Food / Amount Description</Label>
                <Textarea value={data.food_type} onChange={e => set("food_type", e.target.value)} placeholder="Describe your typical food intake..." />
              </div>
              <div className="space-y-2">
                <Label>Outside / Junk Food Intake</Label>
                <Select value={data.outside_food_intake} onValueChange={v => set("outside_food_intake", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="rarely">Rarely</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const isLastStep = step === totalSteps - 1;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 p-4">
      <div className="mx-auto w-full max-w-2xl flex-1">
        {/* Step indicator */}
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>Step {step + 1} of {totalSteps}</span>
          <span className="font-medium text-foreground">{steps[step]}</span>
        </div>
        <Progress value={progress} className="mb-6" />

        <Card>
          <CardHeader className="max-h-[55vh] overflow-y-auto">{renderStep()}</CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              {isLastStep ? (
                <Button onClick={handleFinish}>
                  <Check className="mr-1 h-4 w-4" /> Complete
                </Button>
              ) : (
                <Button onClick={() => setStep(s => s + 1)}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
