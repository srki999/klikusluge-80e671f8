import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Kontakt = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="relative flex items-center justify-center py-8"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--header-gradient-from)), hsl(var(--header-gradient-to)))",
        }}
      >
        <button
          onClick={() => navigate("/")}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-extrabold uppercase tracking-widest text-white">
          Kontakt
        </h1>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="space-y-5 rounded-2xl border border-border bg-card p-8 shadow-lg">
          {/* Email */}
          <div className="flex items-center gap-3">
            <Mail size={20} className="shrink-0 text-primary" />
            <a
              href="mailto:klikusluge@gmail.com"
              className="text-sm text-foreground underline underline-offset-2 hover:opacity-80"
            >
              klikusluge@gmail.com
            </a>
          </div>

          {/* Telefon */}
          <div className="flex items-center gap-3">
            <Phone size={20} className="shrink-0 text-primary" />
            <a
              href="tel:+381116578432"
              className="text-sm text-foreground underline underline-offset-2 hover:opacity-80"
            >
              +381 11 657 8432
            </a>
          </div>

          {/* Adresa */}
          <div className="flex items-center gap-3">
            <MapPin size={20} className="shrink-0 text-primary" />
            <span className="text-sm text-foreground">
              Knez Mihailova 22, 11000 Beograd, Srbija
            </span>
          </div>

          {/* Separator */}
          <hr className="border-border" />

          {/* Social */}
          <div className="flex items-center justify-center gap-6">
            <a
              href="https://www.facebook.com/p/Klik-Usluge-61587775497242/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
              Facebook
            </a>
            <a
              href="https://x.com/usluge31592"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kontakt;
