import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Brain, Bell, FileText, Heart, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import HowToUseModal from "@/components/HowToUseModal";

export default function Landing() {
  const { t } = useTranslation();
  const [showGuide, setShowGuide] = useState(false);

  const features = [
    { icon: Activity, titleKey: "landing.feature1Title", descKey: "landing.feature1Desc" },
    { icon: Brain, titleKey: "landing.feature2Title", descKey: "landing.feature2Desc" },
    { icon: Bell, titleKey: "landing.feature3Title", descKey: "landing.feature3Desc" },
    { icon: FileText, titleKey: "landing.feature4Title", descKey: "landing.feature4Desc" },
  ];

  const steps = [
    { num: "01", titleKey: "landing.step1Title", descKey: "landing.step1Desc" },
    { num: "02", titleKey: "landing.step2Title", descKey: "landing.step2Desc" },
    { num: "03", titleKey: "landing.step3Title", descKey: "landing.step3Desc" },
    { num: "04", titleKey: "landing.step4Title", descKey: "landing.step4Desc" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-7 w-7 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">{t("landing.appName")}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button variant="outline" className="border-primary/20 hover:bg-primary/5" asChild>
              <Link to="/login">{t("landing.logIn")}</Link>
            </Button>
            <Button asChild className="shadow-lg shadow-primary/20">
              <Link to="/signup">{t("landing.getStarted")}</Link>
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
              {t("landing.heroTitle1")}
              <br />
              <span className="text-primary italic">{t("landing.heroTitle2")}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 leading-relaxed font-light">
              {t("landing.heroDesc")}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" asChild className="rounded-full px-8 h-14 text-base font-semibold shadow-xl shadow-primary/30">
                <Link to="/signup">{t("landing.startMonitoring")}</Link>
              </Button>
              <Button size="lg" asChild className="rounded-full px-8 h-14 text-base font-semibold shadow-xl shadow-primary/30">
                <Link to="/login">{t("landing.signIn")}</Link>
              </Button>
              <Button
                size="lg"
                onClick={() => setShowGuide(true)}
                className="rounded-full px-8 h-14 text-base font-semibold shadow-xl shadow-primary/30"
              >
                <HelpCircle className="mr-2 h-5 w-5" />
                {t("landing.howToUse")}
              </Button>
            </div>
          </motion.div>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.05)_0%,transparent_100%)]" />
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <h2 className="font-display text-center text-3xl font-bold">{t("landing.featuresTitle")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">{t("landing.featuresDesc")}</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div key={f.titleKey} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <f.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold">{t(f.titleKey)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(f.descKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t bg-muted/50 py-20">
        <div className="container">
          <h2 className="font-display text-center text-3xl font-bold">{t("landing.howItWorks")}</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div key={s.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} viewport={{ once: true }}
                className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {s.num}
                </div>
                <h3 className="font-display text-lg font-semibold">{t(s.titleKey)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(s.descKey)}</p>
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
              <span className="font-display text-lg font-bold">{t("landing.appName")}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {t("landing.footer")}
            </div>
            <div className="flex items-center gap-6">
              <Button variant="link" size="sm" className="text-muted-foreground hover:text-primary" asChild>
                <Link to="/admin-login">{t("landing.adminLogin")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>

      <HowToUseModal open={showGuide} onOpenChange={setShowGuide} />
    </div>
  );
}
