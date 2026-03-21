import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Brain, Bell, FileText, Wifi, Heart, Shield, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Activity, title: "Real-Time Monitoring", desc: "Live heart rate, SpO2, and temperature tracking from your ESP32 wearable." },
  { icon: Brain, title: "AI Stress Analysis", desc: "Intelligent stress scoring using physiological data and symptom analysis." },
  { icon: Bell, title: "Emergency Alerts", desc: "Instant WhatsApp notifications when abnormal vitals are detected." },
  { icon: FileText, title: "Health Reports", desc: "Generate comprehensive PDF health reports with AI-powered insights." },
];

const steps = [
  { num: "01", title: "Connect Device", desc: "Pair your ESP32 wearable sensor" },
  { num: "02", title: "Complete Health Profile", desc: "Answer a quick health questionnaire" },
  { num: "03", title: "Monitor Dashboard", desc: "View real-time health data and insights" },
  { num: "04", title: "Get AI Insights", desc: "Receive personalized health recommendations" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-7 w-7 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">HealthPulse AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-primary/20 hover:bg-primary/5" asChild>
              <Link to="/login">Log In</Link>
            </Button>
            <Button asChild className="shadow-lg shadow-primary/20">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero py-24 md:py-32 relative overflow-hidden">
        <div className="container relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 backdrop-blur-sm">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
              AI-Powered Health
              <br />
              <span className="text-primary italic">Monitoring System</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 leading-relaxed font-light">
              Connect your ESP32 wearable, track vital signs in real-time, and get AI-powered stress analysis with emergency alerts.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" asChild className="rounded-full px-8 h-12 text-base font-semibold shadow-xl shadow-primary/30">
                <Link to="/signup">Start Monitoring</Link>
              </Button>
              <Button size="lg" asChild className="rounded-full px-8 h-12 text-base font-semibold shadow-xl shadow-primary/30">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </motion.div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.05)_0%,transparent_100%)]" />
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <h2 className="font-display text-center text-3xl font-bold">Intelligent Health Tracking</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">Everything you need to monitor and manage your health with AI-powered precision.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <f.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t bg-muted/50 py-20">
        <div className="container">
          <h2 className="font-display text-center text-3xl font-bold">How It Works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div key={s.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} viewport={{ once: true }}
                className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {s.num}
                </div>
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-bold">HealthPulse AI</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2026 HealthPulse AI. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <Button variant="link" size="sm" className="text-muted-foreground hover:text-primary" asChild>
                <Link to="/admin-login">Admin Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
