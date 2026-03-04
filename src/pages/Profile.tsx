import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { LogOut, ArrowLeft, Pencil, Trash2, MapPin, Banknote, Calendar, Save, Lock, Eye, EyeOff } from "lucide-react";
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

const countryCodes = [
  { code: "+381", country: "🇷🇸 Srbija", flag: "🇷🇸" },
  { code: "+382", country: "🇲🇪 Crna Gora", flag: "🇲🇪" },
  { code: "+385", country: "🇭🇷 Hrvatska", flag: "🇭🇷" },
  { code: "+387", country: "🇧🇦 BiH", flag: "🇧🇦" },
  { code: "+389", country: "🇲🇰 S. Makedonija", flag: "🇲🇰" },
  { code: "+386", country: "🇸🇮 Slovenija", flag: "🇸🇮" },
  { code: "+43", country: "🇦🇹 Austrija", flag: "🇦🇹" },
  { code: "+49", country: "🇩🇪 Nemačka", flag: "🇩🇪" },
  { code: "+41", country: "🇨🇭 Švajcarska", flag: "🇨🇭" },
  { code: "+44", country: "🇬🇧 UK", flag: "🇬🇧" },
  { code: "+1", country: "🇺🇸 SAD", flag: "🇺🇸" },
];

const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)];
    return parts.filter(Boolean).join(" ").trim();
  } else {
    const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 9)];
    return parts.filter(Boolean).join(" ").trim();
  }
};

const getMaxDigits = (value: string): number => {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("0") ? 10 : 9;
};

const parseStoredPhone = (stored: string) => {
  for (const c of countryCodes) {
    if (stored.startsWith(c.code + " ")) {
      return { countryCode: c.code, phone: stored.slice(c.code.length + 1) };
    }
  }
  return { countryCode: "+381", phone: stored };
};

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

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ ime: "", prezime: "", telefon: "" });
  const [profileCountryCode, setProfileCountryCode] = useState("+381");
  const [showProfileCountryDropdown, setShowProfileCountryDropdown] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

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

  const handleProfileSave = async () => {
    if (!user) return;
    const fullPhone = `${profileCountryCode} ${profileForm.telefon.trim()}`;
    const { error } = await supabase.from("profiles").update({
      ime: profileForm.ime.trim(),
      prezime: profileForm.prezime.trim(),
      telefon: fullPhone,
    }).eq("user_id", user.id);
    if (error) {
      toast.error("Greška pri čuvanju podataka");
    } else {
      toast.success("Podaci su sačuvani");
      setProfile((prev) => prev ? { ...prev, ime: profileForm.ime.trim(), prezime: profileForm.prezime.trim(), telefon: fullPhone } : prev);
      setEditingProfile(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast.error("Lozinka mora imati najmanje 6 karaktera");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      toast.error("Lozinka mora sadržati barem jedan broj");
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      toast.error("Lozinka mora sadržati barem jedan specijalan karakter");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Lozinke se ne poklapaju");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error("Greška pri promeni lozinke");
    } else {
      toast.success("Lozinka je uspešno promenjena!");
      setChangingPassword(false);
      setNewPassword("");
      setConfirmNewPassword("");
    }
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
          {editingProfile ? (
            <div className="space-y-3 text-sm text-foreground">
              <div>
                <label className="mb-1 block font-semibold">Ime</label>
                <input value={profileForm.ime} onChange={(e) => setProfileForm((f) => ({ ...f, ime: e.target.value }))} className="w-full rounded-xl border border-border bg-popover px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Prezime</label>
                <input value={profileForm.prezime} onChange={(e) => setProfileForm((f) => ({ ...f, prezime: e.target.value }))} className="w-full rounded-xl border border-border bg-popover px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="rounded-xl bg-muted px-4 py-3"><span className="font-semibold">Email:</span> {user?.email}</div>
              <div className="relative">
                <label className="mb-1 block font-semibold">Telefon</label>
                <div className="flex overflow-hidden rounded-xl border border-border bg-popover">
                  <button
                    type="button"
                    onClick={() => setShowProfileCountryDropdown(!showProfileCountryDropdown)}
                    className="flex shrink-0 items-center gap-1 border-r border-border px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                  >
                    {countryCodes.find(c => c.code === profileCountryCode)?.flag} {profileCountryCode}
                    <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <input
                    value={profileForm.telefon}
                    placeholder="Broj telefona"
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      const max = getMaxDigits(raw);
                      if (raw.length <= max) {
                        setProfileForm((f) => ({ ...f, telefon: formatPhoneNumber(raw) }));
                      }
                    }}
                    className="flex-1 px-4 py-2.5 text-sm outline-none bg-transparent"
                  />
                </div>
                {showProfileCountryDropdown && (
                  <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
                    {countryCodes.map(c => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => { setProfileCountryCode(c.code); setShowProfileCountryDropdown(false); }}
                        className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-muted ${profileCountryCode === c.code ? "bg-muted font-semibold" : ""}`}
                      >
                        <span>{c.flag}</span>
                        <span className="text-foreground">{c.country}</span>
                        <span className="ml-auto text-muted-foreground">{c.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {profile.iskustva && <div className="rounded-xl bg-muted px-4 py-3"><span className="font-semibold">Iskustva:</span> {profile.iskustva}</div>}
              <div className="flex gap-2">
                <button onClick={handleProfileSave} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-secondary-foreground shadow-md transition hover:opacity-90" style={{ background: "linear-gradient(135deg, hsl(30 100% 50%), hsl(30 95% 55%))" }}>
                  <Save size={16} /> Sačuvaj
                </button>
                <button onClick={() => setEditingProfile(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-foreground transition hover:bg-muted">
                  Otkaži
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-foreground">
              <div className="rounded-xl bg-muted px-4 py-3"><span className="font-semibold">Ime:</span> {profile.ime}</div>
              <div className="rounded-xl bg-muted px-4 py-3"><span className="font-semibold">Prezime:</span> {profile.prezime}</div>
              <div className="rounded-xl bg-muted px-4 py-3"><span className="font-semibold">Email:</span> {user?.email}</div>
              <div className="rounded-xl bg-muted px-4 py-3"><span className="font-semibold">Telefon:</span> {profile.telefon}</div>
              {profile.iskustva && <div className="rounded-xl bg-muted px-4 py-3"><span className="font-semibold">Iskustva:</span> {profile.iskustva}</div>}
              <button onClick={() => { const parsed = parseStoredPhone(profile.telefon); setProfileForm({ ime: profile.ime, prezime: profile.prezime, telefon: parsed.phone }); setProfileCountryCode(parsed.countryCode); setEditingProfile(true); }} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-bold text-foreground transition hover:bg-muted">
                <Pencil size={16} /> Izmeni podatke
              </button>
            </div>
          )}
          {/* Change password section */}
          <div className="mt-6 border-t border-border pt-5">
            <h2 className="mb-3 text-sm font-bold text-foreground">Promena lozinke</h2>
            {changingPassword ? (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Nova lozinka"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-popover px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Min. 6 karaktera, jedan broj i jedan specijalan karakter.</p>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    placeholder="Potvrda nove lozinke"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-popover px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button type="button" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                    {showConfirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={handlePasswordChange} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-secondary-foreground shadow-md transition hover:opacity-90" style={{ background: "linear-gradient(135deg, hsl(30 100% 50%), hsl(30 95% 55%))" }}>
                    <Save size={16} /> Sačuvaj
                  </button>
                  <button onClick={() => { setChangingPassword(false); setNewPassword(""); setConfirmNewPassword(""); }} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-foreground transition hover:bg-muted">
                    Otkaži
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setChangingPassword(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-bold text-foreground transition hover:bg-muted">
                <Lock size={16} /> Promeni lozinku
              </button>
            )}
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
              <label className="mb-1 block text-sm font-medium text-foreground">Naslov</label>
              <input maxLength={20} value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-xl border border-border bg-popover px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
              <p className="mt-1 text-xs text-muted-foreground">{editForm.title.length}/20</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Kategorija</label>
              <Select value={editForm.category} onValueChange={(v) => setEditForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="w-full rounded-xl border-border bg-popover py-2.5 text-sm">
                  <SelectValue placeholder="Izaberite kategoriju" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
