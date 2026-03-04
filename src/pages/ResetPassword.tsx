import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check if there's a recovery token in the URL hash
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setReady(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Lozinka mora imati najmanje 6 karaktera");
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast.error("Lozinka mora sadržati barem jedan broj");
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      toast.error("Lozinka mora sadržati barem jedan specijalan karakter");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Lozinke se ne poklapaju");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error("Greška pri promeni lozinke. Pokušajte ponovo.");
      setLoading(false);
      return;
    }

    toast.success("Lozinka je uspešno promenjena!");
    navigate("/");
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-popover px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition";

  if (!ready) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-4"
        style={{
          background: "linear-gradient(135deg, hsl(225 35% 30%), hsl(225 40% 55%))",
        }}
      >
        <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl text-center">
          <div className="mb-6 flex justify-center">
            <img src={logo} alt="Klik Usluge" className="h-28 w-auto" />
          </div>
          <p className="text-sm text-muted-foreground">
            Učitavanje... Ako ste došli ovde bez linka iz emaila, ova stranica neće raditi.
          </p>
          <button
            onClick={() => navigate("/zaboravljena-lozinka")}
            className="mt-4 w-full rounded-xl py-3 text-sm font-bold text-secondary-foreground shadow-md transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, hsl(30 100% 50%), hsl(30 95% 55%))",
            }}
          >
            Zatraži novi link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, hsl(225 35% 30%), hsl(225 40% 55%))",
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <img src={logo} alt="Klik Usluge" className="h-28 w-auto" />
        </div>
        <h1 className="mb-2 text-center text-2xl font-bold text-foreground">
          Nova lozinka
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Unesite novu lozinku za vaš nalog.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nova lozinka"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Min. 6 karaktera, jedan broj i jedan specijalan karakter.
          </p>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Potvrda nove lozinke"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-bold text-secondary-foreground shadow-md transition hover:opacity-90 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, hsl(30 100% 50%), hsl(30 95% 55%))",
            }}
          >
            {loading ? "Menjanje..." : "Promeni lozinku"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
