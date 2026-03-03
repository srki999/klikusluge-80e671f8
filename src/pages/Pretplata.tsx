import { useNavigate } from "react-router-dom";
import { UserCircle, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import badgeBronza from "@/assets/badge-bronza.png";
import badgeSrebro from "@/assets/badge-srebro.png";
import badgeZlato from "@/assets/badge-zlato.png";
import badgePlatina from "@/assets/badge-platina.png";

const plans = [
  {
    name: "bronza",
    label: "Bronza",
    priceEur: 10,
    priceRsd: 1200,
    gradient: "linear-gradient(135deg, hsl(30 30% 45%), hsl(30 25% 55%))",
    border: "hsl(30 30% 50%)",
    badge: null,
    image: badgeBronza,
    discount: "10% popust na postavljanje oglasa",
  },
  {
    name: "srebro",
    label: "Srebro",
    priceEur: 15,
    priceRsd: 1800,
    gradient: "linear-gradient(135deg, hsl(220 10% 70%), hsl(220 10% 82%))",
    border: "hsl(220 10% 72%)",
    badge: null,
    image: badgeSrebro,
    discount: "15% popust na postavljanje oglasa",
  },
  {
    name: "zlato",
    label: "Zlato",
    priceEur: 20,
    priceRsd: 2400,
    gradient: "linear-gradient(135deg, hsl(43 80% 50%), hsl(43 75% 60%))",
    border: "hsl(43 80% 55%)",
    badge: "Najpopularniji",
    image: badgeZlato,
    discount: "20% popust na postavljanje oglasa",
  },
  {
    name: "platina",
    label: "Platina",
    priceEur: 25,
    priceRsd: 3000,
    gradient: "linear-gradient(135deg, hsl(225 40% 50%), hsl(225 35% 62%))",
    border: "hsl(225 40% 55%)",
    badge: null,
    image: badgePlatina,
    discount: "25% popust na postavljanje oglasa",
  },
];

const Pretplata = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("ime, prezime").eq("user_id", user.id).single()
        .then(({ data }) => { if (data) setUserName(`${data.ime} ${data.prezime}`.trim()); });
    }
  }, [user]);

  const selectPlan = (plan: typeof plans[0]) => {
    if (!user) { navigate("/auth"); return; }
    navigate("/placanje-pretplate", { state: { plan } });
  };

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-2 shadow-lg flex-shrink-0"
        style={{ background: "linear-gradient(135deg, hsl(225 35% 42%), hsl(225 40% 62%))" }}
      >
        <img src={logo} alt="Klik Usluge" className="h-20 w-auto cursor-pointer" onClick={() => navigate("/")} />
        <button
          onClick={() => navigate(user ? "/profile" : "/auth")}
          className="flex items-center gap-2 rounded-full border-2 border-primary-foreground/30 bg-primary-foreground/15 px-3 py-2 transition hover:bg-primary-foreground/25"
        >
          <UserCircle size={24} className="text-primary-foreground" />
          {userName && <span className="text-sm font-medium text-primary-foreground">{userName}</span>}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="mb-6 text-center">
          <Crown size={36} className="mx-auto mb-2 text-secondary" />
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Izaberite model pretplate</h1>
          <p className="mt-1 text-sm text-muted-foreground">Mesečni planovi prilagođeni vašim potrebama</p>
        </div>

        <div className="grid w-full max-w-[1200px] gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`group relative flex flex-col items-center rounded-2xl border bg-card p-5 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${plan.badge ? "ring-2 ring-secondary scale-[1.03]" : ""}`}
              style={{ borderColor: plan.border }}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-4 py-1 text-xs font-bold text-secondary-foreground shadow">
                  {plan.badge}
                </span>
              )}

              <img
                src={plan.image}
                alt={plan.label}
                className="mb-3 h-20 w-auto object-contain"
              />

              <h2 className="mb-1 text-lg font-bold text-foreground">{plan.label}</h2>

              <p className="mb-3 text-center text-xs text-muted-foreground">{plan.discount}</p>

              <div className="mb-4 text-center">
                <span className="text-2xl font-extrabold text-foreground">{plan.priceEur}€</span>
                <span className="ml-1 text-sm text-muted-foreground">/ mesec</span>
                <p className="mt-0.5 text-sm text-muted-foreground">{plan.priceRsd} RSD mesečno</p>
              </div>

              <div className="mt-auto w-full">
                <button
                  onClick={() => selectPlan(plan)}
                  className="w-full rounded-xl py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:opacity-90 hover:shadow-lg"
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
