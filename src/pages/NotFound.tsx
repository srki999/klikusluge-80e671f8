import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="relative text-center rounded-2xl bg-card p-10 shadow-2xl">
        <button
          onClick={() => navigate("/")}
          className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Nazad na početnu"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Stranica nije pronađena</p>
        <button
          onClick={() => navigate("/")}
          className="rounded-xl px-6 py-3 text-sm font-bold text-secondary-foreground shadow-md transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg, hsl(30 100% 50%), hsl(30 95% 55%))" }}
        >
          Nazad na početnu
        </button>
      </div>
    </div>
  );
};

export default NotFound;
