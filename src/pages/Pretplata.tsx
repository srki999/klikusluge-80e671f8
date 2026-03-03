import { useNavigate } from "react-router-dom";
import { UserCircle, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const plans = [
  {
    name: "bronza",
    label: "Bronza",
    priceEur: 10,
    priceRsd: 1000,
    gradient: "linear-gradient(135deg, hsl(30 30% 45%), hsl(30 25% 55%))",
    border: "hsl(30 30% 50%)",
    badge: null,
  },
  {
    name: "srebro",
    label: "Srebro",
    priceEur: 15,
    priceRsd: 1500,
    gradient: "linear-gradient(135deg, hsl(220 10% 70%), hsl(220 10% 82%))",
    border: "hsl(220 10% 72%)",
    badge: null,
  },
  {
    name: "zlato",
    label: "Zlato",
    priceEur: 20,
    priceRsd: 2000,
    gradient: "linear-gradient(135deg, hsl(43 80% 50%), hsl(43 75% 60%))",
    border: "hsl(43 80% 55%)",
    badge: "Najpopularniji",
  },
  {
    name: "platina",
    label: "Platina",
    priceEur: 25,
    priceRsd: 2500,
    gradient: "linear-gradient(135deg, hsl(225 40% 50%), hsl(225 35% 62%))",
    border: "hsl(225 40% 55%)",
    badge: null,
  },
];

const Pretplata = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userName, setUserName] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("ime, prezime").eq("user_id", user.id).single()
        .then(({ data }) => { if (data) setUserName(`${data.ime} ${data.prezime}`.trim()); });
    }
  }, [user]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const selectPlan = (plan: typeof plans[0]) => {
    if (!user) { navigate("/auth"); return; }
    navigate("/placanje-pretplate", { state: { plan } });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 transition-shadow duration-300 ${scrolled ? "shadow-lg" : ""}`}
        style={{ background: "linear-gradient(135deg, hsl(225 35% 42%), hsl(225 40% 62%))" }}
      >
        <img src={logo} alt="Klik Usluge" className="h-24 w-auto cursor-pointer" onClick={() => navigate("/")} />
        <button
          onClick={() => navigate(user ? "/profile" : "/auth")}
          className="flex items-center gap-2 rounded-full border-2 border-primary-foreground/30 bg-primary-foreground/15 px-3 py-2 transition hover:bg-primary-foreground/25"
        >
          <UserCircle size={24} className="text-primary-foreground" />
          {userName && <span className="text-sm font-medium text-primary-foreground">{userName}</span>}
        </button>
      </header>

      <div className="h-[104px]" />

      <main className="mx-auto max-w-[1300px] px-4 py-12 md:py-16">
        <div className="mb-12 text-center">
          <Crown size={40} className="mx-auto mb-3 text-secondary" />
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">Izaberite model pretplate</h1>
          <p className="mt-2 text-muted-foreground">Mesečni planovi prilagođeni vašim potrebama</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`group relative flex flex-col rounded-2xl border bg-card p-6 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${plan.badge ? "ring-2 ring-secondary scale-[1.03]" : ""}`}
              style={{ borderColor: plan.border }}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-4 py-1 text-xs font-bold text-secondary-foreground shadow">
                  {plan.badge}
                </span>
              )}

              <div
                className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-md"
                style={{ background: plan.gradient }}
              >
                {plan.label[0]}
              </div>

              <h2 className="mb-1 text-xl font-bold text-foreground">{plan.label}</h2>

              <div className="mb-5 mt-3">
                <span className="text-3xl font-extrabold text-foreground">{plan.priceEur}€</span>
                <span className="ml-1 text-sm text-muted-foreground">/ mesec</span>
                <p className="mt-1 text-sm text-muted-foreground">{plan.priceRsd} RSD mesečno</p>
              </div>

              <div className="mt-auto">
                <button
                  onClick={() => selectPlan(plan)}
                  className="w-full rounded-xl py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                  style={{ background: plan.gradient }}
                >
                  Izaberi plan
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Pretplata;
