import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

type Step = "email" | "otp" | "newPassword";

const ForgotPassword = () => {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const inputClass =
    "w-full rounded-xl border border-border bg-popover px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition";

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Unesite email adresu");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.functions.invoke("send-otp", {
      body: { email: email.trim() },
    });

    if (error || data?.error) {
      toast.error(data?.error || "Greška pri slanju koda");
      setLoading(false);
      return;
    }

    toast.success("Kod je poslat na vaš email!");
    setStep("otp");
    setLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 4) {
      toast.error("Unesite četvorocifreni kod");
      return;
    }
    setStep("newPassword");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
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
    const code = otp.join("");

    const { data, error } = await supabase.functions.invoke("verify-otp", {
      body: { email: email.trim(), code, newPassword: password },
    });

    if (error || data?.error) {
      toast.error(data?.error || "Greška pri promeni lozinke");
      setLoading(false);
      return;
    }

    toast.success("Lozinka je uspešno promenjena!");
    navigate("/auth");
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, hsl(225 35% 30%), hsl(225 40% 55%))",
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl">
        <button
          onClick={() => {
            if (step === "otp") setStep("email");
            else if (step === "newPassword") setStep("otp");
            else navigate("/auth");
          }}
          className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Nazad"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="mb-6 flex justify-center">
          <img src={logo} alt="Klik Usluge" className="h-28 w-auto" />
        </div>

        {step === "email" && (
          <>
            <h1 className="mb-2 text-center text-2xl font-bold text-foreground">
              Zaboravljena lozinka
            </h1>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Unesite email adresu vašeg naloga i poslaćemo vam kod za verifikaciju.
            </p>
            <form onSubmit={handleSendOtp} className="space-y-4">
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
                {loading ? "Slanje..." : "Pošalji kod"}
              </button>
            </form>
          </>
        )}

        {step === "otp" && (
          <>
            <h1 className="mb-2 text-center text-2xl font-bold text-foreground">
              Unesite kod
            </h1>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Poslali smo četvorocifreni kod na <strong>{email}</strong>
            </p>
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center gap-3">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="h-14 w-14 rounded-xl border border-border bg-popover text-center text-2xl font-bold text-foreground outline-none focus:ring-2 focus:ring-ring transition"
                  />
                ))}
              </div>
              <button
                type="submit"
                className="w-full rounded-xl py-3 text-sm font-bold text-secondary-foreground shadow-md transition hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, hsl(30 100% 50%), hsl(30 95% 55%))",
                }}
              >
                Potvrdi kod
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition"
              >
                {loading ? "Slanje..." : "Pošalji ponovo"}
              </button>
            </form>
          </>
        )}

        {step === "newPassword" && (
          <>
            <h1 className="mb-2 text-center text-2xl font-bold text-foreground">
              Nova lozinka
            </h1>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Unesite novu lozinku za vaš nalog.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
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
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
