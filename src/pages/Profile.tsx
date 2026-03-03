import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { LogOut, ArrowLeft, Pencil, Trash2, MapPin, Banknote, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface Ad {
  id: string;
  title: string;
  category: string;
  location: string;
  price: number;
  currency: string;
  start_date: string;
  end_date: string;
  description: string;
  status: string;
}

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ ime: string; prezime: string; telefon: string; iskustva: string } | null>(null);
  const [myAds, setMyAds] = useState<Ad[]>([]);
  const [editAd, setEditAd] = useState<Ad | null>(null);
  const [editForm, setEditForm] = useState({ title: "", category: "", location: "", price: "", description: "" });

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("ime, prezime, telefon, iskustva").eq("user_id", user.id).single()
        .then(({ data }) => { if (data) setProfile(data); });
      fetchMyAds();
    }
  }, [user]);

  const fetchMyAds = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ads")
      .select("id, title, category, location, price, currency, start_date, end_date, description, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setMyAds(data);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleDelete = async (adId: string) => {
    const { error } = await supabase.from("ads").update({ status: "deleted" }).eq("id", adId);
    if (error) {
      toast.error("Greška pri brisanju oglasa");
    } else {
      toast.success("Oglas je uklonjen");
      setMyAds((prev) => prev.filter((a) => a.id !== adId));
    }
  };

  const openEdit = (ad: Ad) => {
    setEditAd(ad);
    setEditForm({ title: ad.title, category: ad.category, location: ad.location, price: String(ad.price), description: ad.description });
  };

  const handleEditSave = async () => {
    if (!editAd) return;
    const { error } = await supabase.from("ads").update({
      title: editForm.title,
      category: editForm.category,
      location: editForm.location,
      price: Number(editForm.price),
      description: editForm.description,
    }).eq("id", editAd.id);
    if (error) {
      toast.error("Greška pri izmeni oglasa");
    } else {
      toast.success("Oglas je izmenjen");
      setEditAd(null);
      fetchMyAds();
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric" });

  if (loading || !profile) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Učitavanje...</p></div>;

  const activeAds = myAds.filter((a) => a.status !== "deleted");

  return (
    <div className="min-h-screen p-4" style={{ background: "linear-gradient(135deg, hsl(225 35% 30%), hsl(225 40% 55%))" }}>
      <div className="mx-auto w-full max-w-2xl">
        {/* Profile card */}
        <div className="relative rounded-2xl bg-card p-8 shadow-2xl">
          <button
            onClick={() => navigate("/")}
            className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Nazad na početnu"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="mb-6 flex justify-center">
            <img src={logo} alt="Klik Usluge" className="h-20 w-auto" />
          </div>
          <h1 className="mb-6 text-center text-2xl font-bold text-foreground">Moj profil</h1>
          <div className="space-y-3 text-sm text-foreground">
            <div className="rounded-xl bg-muted px-4 py-3"><span className="font-semibold">Ime:</span> {profile.ime}</div>
            <div className="rounded-xl bg-muted px-4 py-3"><span className="font-semibold">Prezime:</span> {profile.prezime}</div>
            <div className="rounded-xl bg-muted px-4 py-3"><span className="font-semibold">Email:</span> {user?.email}</div>
            <div className="rounded-xl bg-muted px-4 py-3"><span className="font-semibold">Telefon:</span> {profile.telefon}</div>
            {profile.iskustva && <div className="rounded-xl bg-muted px-4 py-3"><span className="font-semibold">Iskustva:</span> {profile.iskustva}</div>}
          </div>
          <button onClick={handleSignOut} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-secondary-foreground shadow-md transition hover:opacity-90" style={{ background: "linear-gradient(135deg, hsl(30 100% 50%), hsl(30 95% 55%))" }}>
            <LogOut size={16} /> Odjavite se
          </button>
        </div>

        {/* My Ads */}
        <div className="mt-6 rounded-2xl bg-card p-6 shadow-2xl">
          <h2 className="mb-4 text-lg font-bold text-foreground">Moji oglasi</h2>
          {activeAds.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nemate postavljenih oglasa.</p>
          ) : (
            <div className="space-y-3">
              {activeAds.map((ad) => (
                <div key={ad.id} className="rounded-xl border border-border bg-muted/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{ad.title || ad.category}</p>
                      <p className="text-xs text-muted-foreground">{ad.category}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin size={12} />{ad.location}</span>
                        <span className="flex items-center gap-1"><Banknote size={12} />{ad.price} {ad.currency}</span>
                        <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(ad.start_date)} – {formatDate(ad.end_date)}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground break-words line-clamp-2">{ad.description}</p>
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${ad.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {ad.status === "active" ? "Aktivan" : ad.status === "pending_payment" ? "Čeka uplatu" : ad.status}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => openEdit(ad)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                        title="Izmeni"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        title="Ukloni"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editAd} onOpenChange={(open) => !open && setEditAd(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Izmeni oglas</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Kategorija</label>
              <input value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} className="w-full rounded-xl border border-border bg-popover px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Lokacija</label>
              <input value={editForm.location} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} className="w-full rounded-xl border border-border bg-popover px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Cena</label>
              <input type="number" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} className="w-full rounded-xl border border-border bg-popover px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Opis</label>
              <textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full resize-none rounded-xl border border-border bg-popover px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button onClick={handleEditSave} className="w-full rounded-xl py-2.5 text-sm font-bold text-secondary-foreground shadow-md transition hover:opacity-90" style={{ background: "linear-gradient(135deg, hsl(30 100% 50%), hsl(30 95% 55%))" }}>
              Sačuvaj izmene
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
