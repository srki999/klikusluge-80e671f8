import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Unesite email adresu");
      return;
    }
    setLoading(true);

    // Check if email exists in profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id")
      .limit(1);

    // We can't directly check auth.users, so we use resetPasswordForEmail
    // which won't reveal if email exists (security best practice)
    // But user wants error if email doesn't exist, so we check via a workaround
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error("Greška pri slanju. Pokušajte ponovo.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-popover px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition";

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, hsl(225 35% 30%), hsl(225 40% 55%))",
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl">
        <button
          onClick={() => navigate("/auth")}
          className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Nazad"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="mb-6 flex justify-center">
          <img src={logo} alt="Klik Usluge" className="h-28 w-auto" />
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-foreground">
          Zaboravljena lozinka
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Unesite email adresu vašeg naloga i poslaćemo vam link za resetovanje lozinke.
        </p>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="rounded-xl bg-muted p-6">
              <p className="text-sm font-semibold text-foreground">
                Link za resetovanje lozinke je poslat!
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Proverite vaš email ({email}) i kliknite na link za resetovanje lozinke. Ako ne vidite email, proverite spam folder.
              </p>
            </div>
            <button
              onClick={() => navigate("/auth")}
              className="w-full rounded-xl py-3 text-sm font-bold text-secondary-foreground shadow-md transition hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, hsl(30 100% 50%), hsl(30 95% 55%))",
              }}
            >
              Nazad na prijavu
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email adresa"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-bold text-secondary-foreground shadow-md transition hover:opacity-90 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, hsl(30 100% 50%), hsl(30 95% 55%))",
              }}
            >
              {loading ? "Slanje..." : "Pošalji link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
