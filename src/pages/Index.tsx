import { Search, UserCircle, Loader2, ArrowUp, MapPin, Calendar, Banknote, User, X, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import badgeBronza from "@/assets/badge-bronza.png";
import badgeSrebro from "@/assets/badge-srebro.png";
import badgeZlato from "@/assets/badge-zlato.png";
import badgePlatina from "@/assets/badge-platina.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PAGE_SIZE = 10;

interface Ad {
  id: string;
  category: string;
  location: string;
  price: number;
  currency: string;
  start_date: string;
  end_date: string;
  description: string;
  created_at: string;
  user_id: string;
}

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userSub, setUserSub] = useState<{ plan_name: string; end_date: string } | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [adOwner, setAdOwner] = useState<{ ime: string; prezime: string; telefon: string } | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0);
  const searchRef = useRef("");

  // Fetch user name
  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("ime, prezime").eq("user_id", user.id).single()
        .then(({ data }) => {
          if (data) setUserName(`${data.ime} ${data.prezime}`.trim());
        });
      supabase.from("subscriptions").select("plan_name, end_date").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false }).limit(1).single()
        .then(({ data }) => { if (data) setUserSub(data); else setUserSub(null); });
    } else {
      setUserName("");
      setUserSub(null);
    }
  }, [user]);

  // Track scroll for header shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch ads
  const fetchAds = useCallback(async (reset = false) => {
    if (loading) return;
    const currentOffset = reset ? 0 : offsetRef.current;
    if (!reset && !hasMore) return;
    setLoading(true);

    let query = supabase
      .from("ads")
      .select("id, category, location, price, currency, start_date, end_date, description, created_at, user_id")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(currentOffset, currentOffset + PAGE_SIZE - 1);

    const term = searchRef.current.trim();
    if (term) {
      query = query.or(`category.ilike.%${term}%,location.ilike.%${term}%,description.ilike.%${term}%`);
    }

    const { data, error } = await query;

    if (!error && data) {
      if (reset) {
        setAds(data);
        offsetRef.current = data.length;
      } else {
        setAds((prev) => [...prev, ...data]);
        offsetRef.current += data.length;
      }
      setHasMore(data.length >= PAGE_SIZE);
    }
    setLoading(false);
    setInitialLoad(false);
  }, [loading, hasMore]);

  // Search handler
  const handleSearch = useCallback(() => {
    searchRef.current = searchTerm;
    offsetRef.current = 0;
    setHasMore(true);
    setAds([]);
    setInitialLoad(true);
    fetchAds(true);
  }, [searchTerm, fetchAds]);

  // Initial fetch
  useEffect(() => {
    fetchAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchAds();
        }
      },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [fetchAds, hasMore, loading]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const openAdDetails = async (ad: Ad) => {
    setSelectedAd(ad);
    setAdOwner(null);
    const { data } = await supabase
      .from("profiles")
      .select("ime, prezime, telefon")
      .eq("user_id", ad.user_id)
      .single();
    if (data) setAdOwner(data);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 transition-shadow duration-300 ${scrolled ? "shadow-lg" : ""}`}
        style={{
          background: "linear-gradient(135deg, hsl(225 35% 42%), hsl(225 40% 62%))",
        }}
      >
        <img
          src={logo}
          alt="Klik Usluge"
          className="h-24 w-auto cursor-pointer"
          onClick={() => navigate("/")}
        />
        <button
          onClick={() => navigate(user ? "/profile" : "/auth")}
          className="flex items-center gap-2 rounded-full border-2 border-primary-foreground/30 bg-primary-foreground/15 px-3 py-2 transition hover:bg-primary-foreground/25"
        >
          <UserCircle size={24} className="text-primary-foreground" />
          {userName && (
            <span className="text-sm font-medium text-primary-foreground">{userName}</span>
          )}
        </button>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[104px]" />

      {/* Body */}
      <div className="flex w-full max-w-[1300px] mx-auto">
        {/* Sidebar */}
        <aside
          className="sticky top-[104px] hidden h-[calc(100vh-104px)] w-64 shrink-0 p-5 md:block ml-0"
          style={{
            background: "linear-gradient(180deg, hsl(30 100% 50%), hsl(30 95% 60%))",
          }}
        >
          <button
            onClick={() => navigate(user ? "/dodaj-oglas" : "/auth")}
            className="w-full rounded-xl border border-secondary-foreground/30 px-5 py-3 text-base font-semibold text-secondary-foreground shadow-md transition hover:-translate-y-[2px] hover:bg-secondary-foreground/10"
          >
            DODAJ OGLAS
          </button>
          <button
            onClick={() => navigate(user ? "/pretplata" : "/auth")}
            className="mt-3 w-full rounded-xl border border-secondary-foreground/30 px-5 py-3 text-base font-semibold text-secondary-foreground shadow-md transition hover:-translate-y-[2px] hover:bg-secondary-foreground/10"
          >
            MODEL PRETPLATE
          </button>
          {userSub && (
            <div className="mt-3 rounded-xl border border-secondary-foreground/20 bg-secondary-foreground/10 px-4 py-3 flex flex-col items-center">
              <img
                src={{ bronza: badgeBronza, srebro: badgeSrebro, zlato: badgeZlato, platina: badgePlatina }[userSub.plan_name] || badgeBronza}
                alt={userSub.plan_name}
                className="h-12 w-auto rounded-lg object-contain mb-1"
              />
              <p className="text-xs font-bold uppercase text-secondary-foreground tracking-wider">{userSub.plan_name}</p>
              <p className="mt-0.5 text-[11px] text-secondary-foreground/80">
                do {new Date(userSub.end_date).toLocaleDateString("sr-Latn-RS")}
              </p>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="min-h-[calc(100vh-104px)] flex-1 bg-muted p-6 md:p-8">
          {/* Search bar */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="mx-auto mb-8 flex max-w-2xl overflow-hidden rounded-xl border border-border bg-popover shadow-sm"
          >
            <input
              type="text"
              placeholder="Pretraži po kategoriji, mestu ili opisu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button type="submit" className="flex w-12 items-center justify-center bg-primary/90 text-primary-foreground transition hover:bg-primary">
              <Search size={18} />
            </button>
          </form>

          {/* Ad cards */}
          <div className="space-y-4">
            {ads.map((ad) => (
              <div
                key={ad.id}
                onClick={() => openAdDetails(ad)}
                className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card px-6 py-5 shadow-sm transition-all duration-200 hover:-translate-y-[3px] hover:shadow-md"
                style={{
                  background: "linear-gradient(135deg, hsl(220 15% 96%), hsl(220 15% 93%))",
                }}
              >
                <div className="space-y-1">
                  <span className="text-lg font-semibold text-foreground tracking-wide">
                    {ad.category}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{ad.location}</span>
                    <span className="font-medium text-foreground">
                      {ad.price} {ad.currency}
                    </span>
                    <span>
                      {formatDate(ad.start_date)} – {formatDate(ad.end_date)}
                    </span>
                  </div>
                </div>
                <button className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/80">
                  PRIJAVI SE
                </button>
              </div>
            ))}
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Empty state */}
          {!initialLoad && ads.length === 0 && !loading && (
            <p className="py-16 text-center text-muted-foreground">
              Trenutno nema dostupnih oglasa.
            </p>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />
        </main>
      </div>

      {/* Scroll to top */}
      {scrolled && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/80"
        >
          <ArrowUp size={20} />
        </button>
      )}

      {/* Ad detail dialog */}
      <Dialog open={!!selectedAd} onOpenChange={(open) => !open && setSelectedAd(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedAd?.category}</DialogTitle>
          </DialogHeader>
          {selectedAd && (
            <div className="space-y-4 pt-2">
              <div className="flex gap-2 text-sm text-muted-foreground">
                <FileText size={16} className="mt-0.5 shrink-0" />
                <p className="text-foreground break-words whitespace-pre-wrap">{selectedAd.description}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={16} className="shrink-0" />
                <span>{selectedAd.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Banknote size={16} className="shrink-0" />
                <span className="font-medium text-foreground">{selectedAd.price} {selectedAd.currency}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar size={16} className="shrink-0" />
                <span>{formatDate(selectedAd.start_date)} – {formatDate(selectedAd.end_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User size={16} className="shrink-0" />
                {adOwner ? (
                  <span>{adOwner.ime} {adOwner.prezime}{adOwner.telefon ? ` • ${adOwner.telefon}` : ""}</span>
                ) : (
                  <span className="animate-pulse">Učitavanje...</span>
                )}
              </div>
              <button className="mt-2 w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/80">
                PRIJAVI SE
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
