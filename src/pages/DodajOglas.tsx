import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = [
  "Popravka",
  "Čišćenje",
  "Nabavka",
  "Online poslovi",
  "Selidba",
  "Botanika",
  "Krečenje",
  "Drugo",
];

const currencies = [
  { code: "RSD", label: "🇷🇸 RSD" },
  { code: "EUR", label: "🇪🇺 EUR" },
  { code: "USD", label: "🇺🇸 USD" },
  { code: "GBP", label: "🇬🇧 GBP" },
  { code: "CHF", label: "🇨🇭 CHF" },
  { code: "BAM", label: "🇧🇦 BAM" },
];

const serbianCities = [
  "Beograd", "Novi Sad", "Niš", "Kragujevac", "Subotica", "Zrenjanin", "Pančevo",
  "Čačak", "Novi Pazar", "Kraljevo", "Smederevo", "Leskovac", "Užice", "Vranje",
  "Valjevo", "Šabac", "Sombor", "Požarevac", "Pirot", "Zaječar", "Kruševac",
  "Kikinda", "Sremska Mitrovica", "Jagodina", "Vršac", "Bor", "Prokuplje",
  "Loznica", "Prijepolje", "Aranđelovac", "Gornji Milanovac", "Paraćin",
  "Trstenik", "Aleksinac", "Bečej", "Ruma", "Inđija", "Stara Pazova",
  "Temerin", "Bačka Palanka", "Apatin", "Kula", "Senta", "Kanjiža",
  "Ada", "Titel", "Srbobran", "Vrbas", "Bačka Topola", "Mali Iđoš",
  "Kovačica", "Opovo", "Alibunar", "Plandište", "Bela Crkva",
  "Knjaževac", "Negotin", "Kladovo", "Majdanpek", "Žagubica",
  "Petrovac na Mlavi", "Kučevo", "Malo Crniće", "Veliko Gradište",
  "Golubac", "Žabari", "Svilajnac", "Despotovac", "Ćuprija", "Rekovac",
  "Batočina", "Knić", "Lapovo", "Topola", "Rača",
  "Bajina Bašta", "Kosjerić", "Čajetina", "Arilje", "Ivanjica", "Lučani",
  "Tutin", "Sjenica", "Raška", "Vrnjačka Banja", "Aleksandrovac", "Brus",
  "Ćićevac", "Varvarin", "Blace", "Žitorađa", "Kuršumlija",
  "Doljevac", "Gadžin Han", "Merošina", "Svrljig", "Sokobanja",
  "Dimitrovgrad", "Babušnica", "Bela Palanka", "Vlasotince", "Lebane",
  "Medveđa", "Bojnik", "Crna Trava", "Bosilegrad", "Surdulica",
  "Vladičin Han", "Trgovište", "Bujanovac", "Preševo",
];

const adSchema = z.object({
  title: z.string().trim().min(1, "Naslov je obavezan").max(20, "Naslov može imati najviše 20 karaktera"),
  category: z.string().min(1, "Kategorija je obavezna"),
  location: z.string().trim().min(1, "Mesto je obavezno").max(100),
  startDate: z.date({ required_error: "Datum početka je obavezan" }),
  endDate: z.date({ required_error: "Datum završetka je obavezan" }),
  price: z.number({ required_error: "Cena je obavezna" }).positive("Cena mora biti pozitivna"),
  description: z.string().trim().min(20, "Opis mora imati najmanje 20 karaktera").max(2000),
}).refine(d => d.endDate >= d.startDate, {
  message: "Završni datum ne može biti pre početnog",
  path: ["endDate"],
});

const DodajOglas = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("RSD");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      toast.info("Morate biti prijavljeni da biste dodali oglas");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = adSchema.safeParse({
      title,
      category,
      location,
      startDate,
      endDate,
      price: price ? Number(price) : undefined,
      description,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(err => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { data: adData, error } = await supabase.from("ads").insert({
        user_id: user!.id,
        title: parsed.data.title,
        category: parsed.data.category,
        location: parsed.data.location,
        start_date: format(parsed.data.startDate, "yyyy-MM-dd"),
        end_date: format(parsed.data.endDate, "yyyy-MM-dd"),
        price: parsed.data.price,
        currency,
        description: parsed.data.description,
        status: "pending_payment",
      }).select().single();

      if (error) {
        toast.error("Greška pri čuvanju oglasa");
        console.error(error);
        setLoading(false);
        return;
      }

      toast.success("Oglas je sačuvan!");
      navigate("/placanje", { state: { ad: adData } });
    } catch {
      toast.error("Došlo je do greške");
    }
    setLoading(false);
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-popover px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition";
  const errorClass = "text-xs text-destructive mt-1";

  if (authLoading) return null;

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, hsl(30 100% 50%), hsl(30 95% 60%))",
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-card p-8 shadow-2xl">
        {/* Back arrow */}
        <button
          onClick={() => navigate("/")}
          className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Nazad na početnu"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Logo */}
        <div className="mb-4 flex justify-center">
          <img src={logo} alt="Klik Usluge" className="h-24 w-auto" />
        </div>

        <h1 className="mb-6 text-center text-2xl font-bold text-foreground">
          Prijavite oglas
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Naslov */}
          <div>
            <input
              placeholder="Naslov oglasa (maks. 20 karaktera)"
              value={title}
              onChange={e => { if (e.target.value.length <= 20) { setTitle(e.target.value); setErrors(p => ({ ...p, title: "" })); } }}
              className={inputClass}
              maxLength={20}
            />
            <div className="flex justify-between mt-1">
              {errors.title && <p className={errorClass}>{errors.title}</p>}
              <span className="text-xs text-muted-foreground ml-auto">{title.length}/20</span>
            </div>
          </div>

          {/* Kategorija */}
          <div>
            <Select value={category} onValueChange={v => { setCategory(v); setErrors(p => ({ ...p, category: "" })); }}>
              <SelectTrigger className="w-full rounded-xl border-border bg-popover py-3 text-sm">
                <SelectValue placeholder="Izaberite kategoriju zahteva" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className={errorClass}>{errors.category}</p>}
          </div>

          {/* Mesto */}
          <div className="relative">
            <input
              placeholder="Mesto gde treba da se odradi posao"
              value={location}
              onChange={e => {
                const val = e.target.value;
                setLocation(val);
                setErrors(p => ({ ...p, location: "" }));
                if (val.trim().length >= 3) {
                  const filtered = serbianCities.filter(c =>
                    c.toLowerCase().startsWith(val.trim().toLowerCase())
                  );
                  setLocationSuggestions(filtered.slice(0, 6));
                  setShowSuggestions(filtered.length > 0);
                } else {
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => {
                if (location.trim().length >= 3 && locationSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className={inputClass}
            />
            {showSuggestions && (
              <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                {locationSuggestions.map(city => (
                  <button
                    key={city}
                    type="button"
                    onMouseDown={() => {
                      setLocation(city);
                      setShowSuggestions(false);
                    }}
                    className="flex w-full px-4 py-2.5 text-sm text-foreground transition hover:bg-muted"
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
            {errors.location && <p className={errorClass}>{errors.location}</p>}
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      inputClass,
                      "flex items-center justify-between text-left",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate ? format(startDate, "dd.MM.yyyy") : "Datum početka"}
                    <CalendarIcon size={16} className="ml-2 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={d => { setStartDate(d); setErrors(p => ({ ...p, startDate: "" })); }}
                    disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && <p className={errorClass}>{errors.startDate}</p>}
            </div>
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      inputClass,
                      "flex items-center justify-between text-left",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    {endDate ? format(endDate, "dd.MM.yyyy") : "Datum završetka"}
                    <CalendarIcon size={16} className="ml-2 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={d => { setEndDate(d); setErrors(p => ({ ...p, endDate: "" })); }}
                    disabled={date => date < (startDate || new Date(new Date().setHours(0, 0, 0, 0)))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {errors.endDate && <p className={errorClass}>{errors.endDate}</p>}
            </div>
          </div>

          {/* Cena */}
          <div>
            <div className="flex overflow-hidden rounded-xl border border-border bg-popover">
              <input
                type="number"
                placeholder="Unesite cifru za izvršavanje zadatka"
                value={price}
                onChange={e => { setPrice(e.target.value); setErrors(p => ({ ...p, price: "" })); }}
                className="flex-1 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                min="0"
              />
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-24 shrink-0 border-0 border-l border-border rounded-none bg-transparent text-sm font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.price && <p className={errorClass}>{errors.price}</p>}
          </div>

          {/* Opis */}
          <div>
            <textarea
              placeholder="Unesite opis zadatka…"
              value={description}
              onChange={e => { setDescription(e.target.value); setErrors(p => ({ ...p, description: "" })); }}
              rows={4}
              className={cn(inputClass, "resize-none")}
            />
            {errors.description && <p className={errorClass}>{errors.description}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-bold text-secondary-foreground shadow-md transition hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, hsl(30 100% 50%), hsl(30 95% 55%))",
            }}
          >
            {loading ? "Molimo sačekajte..." : "Nastavi na plaćanje"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DodajOglas;
