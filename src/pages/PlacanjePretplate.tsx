import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CreditCard, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import PrivacyPolicySection from "@/components/PrivacyPolicySection";

const PlacanjePretplate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const plan = (location.state as any)?.plan;

  const [form, setForm] = useState({ name: "", card: "", expiry: "", cvv: "" });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  if (!plan) {
    navigate("/pretplata");
    return null;
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleChange = (field: string, value: string) => {
    if (field === "card") {
      value = value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
    }
    if (field === "expiry") {
      value = value.replace(/\D/g, "").slice(0, 4);
      if (value.length >= 2) {
        const mm = parseInt(value.slice(0, 2), 10);
        if (mm > 12) value = "12" + value.slice(2);
        if (mm === 0 && value.slice(0, 2) === "00") value = "01" + value.slice(2);
      }
      if (value.length > 2) value = value.slice(0, 2) + "/" + value.slice(2);
    }
    if (field === "cvv") value = value.replace(/\D/g, "").slice(0, 3);
    setForm((f) => ({ ...f, [field]: value }));
  };

  const expiryParts = form.expiry.split("/");
  const expiryValid = expiryParts.length === 2 && parseInt(expiryParts[0], 10) >= 1 && parseInt(expiryParts[0], 10) <= 12 && expiryParts[1]?.length === 2;
  const valid = form.name.trim().length > 1 && form.card.replace(/\s/g, "").length === 16 && form.expiry.length === 5 && expiryValid && form.cvv.length === 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setProcessing(true);

    await new Promise((r) => setTimeout(r, 2000));

    await supabase.from("subscriptions").insert({
      user_id: user.id,
      plan_name: plan.name,
      price_eur: plan.priceEur,
      price_rsd: plan.priceRsd,
      status: "active",
    });

    setProcessing(false);
    setSuccess(true);
    setTimeout(() => navigate("/"), 2000);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, hsl(225 35% 30%), hsl(225 40% 55%))" }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl">
        <button
          onClick={() => navigate("/pretplata")}
          className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Nazad"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="mb-4 flex justify-center">
          <img src={logo} alt="Klik Usluge" className="h-20 w-auto" />
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle size={56} className="text-green-500" />
            <h2 className="text-xl font-bold text-foreground">Uplata uspešna!</h2>
            <p className="text-sm text-muted-foreground">Vaša pretplata je aktivirana. Preusmeravanje...</p>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-center text-2xl font-bold text-foreground">Plaćanje pretplate</h1>

            <div className="mb-6 rounded-xl border border-border bg-muted/50 p-4 text-center">
              <p className="text-lg font-bold text-foreground">{plan.label}</p>
              <p className="text-2xl font-extrabold text-foreground">{plan.priceEur}€ <span className="text-sm font-normal text-muted-foreground">/ {plan.priceRsd} RSD</span></p>
              <p className="mt-1 text-xs text-muted-foreground">Period: 1 mesec</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Ime na kartici</label>
                <input
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Petar Petrović"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Broj kartice</label>
                <input
                  value={form.card}
                  onChange={(e) => handleChange("card", e.target.value)}
                  placeholder="0000 0000 0000 0000"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-foreground">Datum isteka</label>
                  <input
                    value={form.expiry}
                    onChange={(e) => handleChange("expiry", e.target.value)}
                    placeholder="MM/YY"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-foreground">CVV</label>
                  <input
                    value={form.cvv}
                    onChange={(e) => handleChange("cvv", e.target.value)}
                    placeholder="123"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!valid || processing}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-secondary-foreground shadow-md transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, hsl(30 100% 50%), hsl(30 95% 55%))" }}
              >
                {processing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Obrađujem...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Potvrdi uplatu
                  </>
                )}
              </button>
            </form>

            
          </>
        )}
      </div>
    </div>
  );
};

export default PlacanjePretplate;
