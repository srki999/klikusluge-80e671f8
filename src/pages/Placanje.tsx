import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard } from "lucide-react";
import logo from "@/assets/logo.png";

const Placanje = () => {
  const navigate = useNavigate();

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, hsl(225 35% 30%), hsl(225 40% 55%))",
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl text-center">
        <button
          onClick={() => navigate("/")}
          className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Nazad"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="mb-4 flex justify-center">
          <img src={logo} alt="Klik Usluge" className="h-20 w-auto" />
        </div>

        <CreditCard size={48} className="mx-auto mb-4 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">Plaćanje</h1>
        <p className="text-sm text-muted-foreground">
          Funkcija plaćanja će uskoro biti dostupna. Vaš oglas je sačuvan sa statusom "na čekanju plaćanja".
        </p>

        <button
          onClick={() => navigate("/")}
          className="mt-6 w-full rounded-xl py-3 text-sm font-bold text-secondary-foreground shadow-md transition hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, hsl(30 100% 50%), hsl(30 95% 55%))",
          }}
        >
          Nazad na početnu
        </button>
      </div>
    </div>
  );
};

export default Placanje;
