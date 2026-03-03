import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import logo from "@/assets/logo.png";

const registerSchema = z.object({
  ime: z.string().trim().min(1, "Ime je obavezno").max(50),
  prezime: z.string().trim().min(1, "Prezime je obavezno").max(50),
  email: z.string().trim().email("Nevažeća email adresa"),
  telefon: z.string().trim().min(1, "Broj telefona je obavezan").max(20),
  iskustva: z.string().max(2000).optional(),
  password: z.string().min(6, "Lozinka mora imati najmanje 6 karaktera").regex(/[0-9]/, "Lozinka mora sadržati barem jedan broj").regex(/[^a-zA-Z0-9]/, "Lozinka mora sadržati barem jedan specijalan karakter"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Lozinke se ne poklapaju",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().trim().email("Nevažeća email adresa"),
  password: z.string().min(1, "Lozinka je obavezna"),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    ime: "", prezime: "", email: "", telefon: "", iskustva: "", password: "", confirmPassword: "",
  });

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isLogin) {
        const parsed = loginSchema.safeParse(form);
        if (!parsed.success) {
          const fieldErrors: Record<string, string> = {};
          parsed.error.errors.forEach(err => {
            fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) {
          toast.error("Pogrešan email ili lozinka");
          setLoading(false);
          return;
        }
        toast.success("Uspešno ste se prijavili!");
        navigate("/");
      } else {
        const parsed = registerSchema.safeParse(form);
        if (!parsed.success) {
          const fieldErrors: Record<string, string> = {};
          parsed.error.errors.forEach(err => {
            fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              ime: form.ime,
              prezime: form.prezime,
              telefon: form.telefon,
              iskustva: form.iskustva,
            },
          },
        });
        if (error) {
          toast.error(error.message);
          setLoading(false);
          return;
        }
        toast.success("Nalog je kreiran! Proverite email za potvrdu.");
        setIsLogin(true);
      }
    } catch {
      toast.error("Došlo je do greške");
    }
    setLoading(false);
  };

  const inputClass = "w-full rounded-xl border border-border bg-popover px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition";
  const errorClass = "text-xs text-destructive mt-1";

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, hsl(225 35% 30%), hsl(225 40% 55%))",
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl">
        <button
          onClick={() => navigate("/")}
          className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Nazad na početnu"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="mb-6 flex justify-center">
          <img src={logo} alt="Klik Usluge" className="h-28 w-auto" />
        </div>

        <h1 className="mb-6 text-center text-2xl font-bold text-foreground">
          {isLogin ? "Prijavite se" : "Napravite nalog"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input name="ime" placeholder="Ime" value={form.ime} onChange={handleChange} className={inputClass} />
                  {errors.ime && <p className={errorClass}>{errors.ime}</p>}
                </div>
                <div>
                  <input name="prezime" placeholder="Prezime" value={form.prezime} onChange={handleChange} className={inputClass} />
                  {errors.prezime && <p className={errorClass}>{errors.prezime}</p>}
                </div>
              </div>
              <div>
                <input name="telefon" placeholder="Broj telefona" value={form.telefon} onChange={handleChange} className={inputClass} />
                {errors.telefon && <p className={errorClass}>{errors.telefon}</p>}
              </div>
              <div>
                <textarea
                  name="iskustva"
                  placeholder="Bivša iskustva"
                  value={form.iskustva}
                  onChange={handleChange}
                  rows={3}
                  className={inputClass + " resize-none"}
                />
              </div>
            </>
          )}

          <div>
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className={inputClass} />
            {errors.email && <p className={errorClass}>{errors.email}</p>}
          </div>

          <div className="relative">
            <input name="password" type={showPassword ? "text" : "password"} placeholder="Lozinka" value={form.password} onChange={handleChange} className={inputClass} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.password && <p className={errorClass}>{errors.password}</p>}
          </div>

          {!isLogin && (
            <div className="relative">
              <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Potvrda lozinke" value={form.confirmPassword} onChange={handleChange} className={inputClass} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.confirmPassword && <p className={errorClass}>{errors.confirmPassword}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-bold text-secondary-foreground shadow-md transition hover:opacity-90 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, hsl(30 100% 50%), hsl(30 95% 55%))",
            }}
          >
            {loading ? "Molimo sačekajte..." : isLogin ? "Prijavite se" : "Registrujte se"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {isLogin ? "Nemate nalog? " : "Već imate nalog? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setErrors({}); }}
            className="font-semibold text-accent underline-offset-2 hover:underline"
          >
            {isLogin ? "Registrujte se" : "Prijavite se"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
