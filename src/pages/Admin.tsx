import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trash2, Eye, ShieldCheck, ShieldPlus, Loader2, Search, UserCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import logo from "@/assets/logo.png";

interface ProfileRow {
  id: string;
  user_id: string;
  ime: string;
  prezime: string;
  telefon: string;
  iskustva: string;
  email?: string;
  is_admin?: boolean;
}

interface AdRow {
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

const Admin = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Selected profile ads
  const [selectedProfile, setSelectedProfile] = useState<ProfileRow | null>(null);
  const [profileAds, setProfileAds] = useState<AdRow[]>([]);
  const [adsLoading, setAdsLoading] = useState(false);

  // Admin email input
  const [adminEmail, setAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
    }
  }, [adminLoading, isAdmin, navigate]);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, ime, prezime, telefon, iskustva")
      .order("created_at", { ascending: false });

    if (data) {
      // Check which are admins
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const adminUserIds = new Set(
        (roles || []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id)
      );

      setProfiles(
        data.map((p) => ({
          ...p,
          is_admin: adminUserIds.has(p.user_id),
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchProfiles();
  }, [isAdmin]);

  const openProfileAds = async (profile: ProfileRow) => {
    setSelectedProfile(profile);
    setAdsLoading(true);
    const { data } = await supabase
      .from("ads")
      .select("id, title, category, location, price, currency, start_date, end_date, description, status")
      .eq("user_id", profile.user_id)
      .order("created_at", { ascending: false });
    setProfileAds(data || []);
    setAdsLoading(false);
  };

  const handleDeleteAd = async (ad: AdRow) => {
    if (!selectedProfile) return;

    // Delete ad
    const { error } = await supabase.from("ads").delete().eq("id", ad.id);
    if (error) {
      toast({ title: "Greška", description: "Nije moguće obrisati oglas.", variant: "destructive" });
      return;
    }

    // Send in-app notification
    await supabase.from("notifications").insert({
      user_id: selectedProfile.user_id,
      applicant_id: user!.id,
      message: `Vaš oglas "${ad.title || ad.category}" je uklonjen od strane administratora.`,
    });

    // Send email notification
    try {
      await supabase.functions.invoke("admin-notify", {
        body: {
          target_user_id: selectedProfile.user_id,
          type: "ad_deleted",
          ad_title: ad.title || ad.category,
        },
      });
    } catch (e) {
      console.error("Email notification failed", e);
    }

    setProfileAds((prev) => prev.filter((a) => a.id !== ad.id));
    toast({ title: "Oglas obrisan", description: `Oglas "${ad.title || ad.category}" je uspešno uklonjen.` });
  };

  const handleDeleteProfile = async (profile: ProfileRow) => {
    // Send email notification first (before deletion)
    try {
      await supabase.functions.invoke("admin-notify", {
        body: {
          target_user_id: profile.user_id,
          type: "profile_deleted",
        },
      });
    } catch (e) {
      console.error("Email notification failed", e);
    }

    // Delete profile (cascade will handle related data via auth.users)
    const { error } = await supabase.from("profiles").delete().eq("user_id", profile.user_id);
    if (error) {
      toast({ title: "Greška", description: "Nije moguće obrisati profil.", variant: "destructive" });
      return;
    }

    // Also delete the user from auth via edge function
    try {
      await supabase.functions.invoke("admin-notify", {
        body: {
          target_user_id: profile.user_id,
          type: "delete_auth_user",
        },
      });
    } catch (e) {
      console.error("Auth user deletion failed", e);
    }

    setProfiles((prev) => prev.filter((p) => p.user_id !== profile.user_id));
    if (selectedProfile?.user_id === profile.user_id) {
      setSelectedProfile(null);
      setProfileAds([]);
    }
    toast({ title: "Profil obrisan", description: `Profil je uspešno uklonjen iz sistema.` });
  };

  const handleAddAdmin = async () => {
    if (!adminEmail.trim()) return;
    setAddingAdmin(true);

    // Find user by email via edge function
    try {
      const { data, error } = await supabase.functions.invoke("admin-notify", {
        body: {
          type: "find_user_by_email",
          email: adminEmail.trim(),
        },
      });

      if (error || !data?.user_id) {
        toast({ title: "Greška", description: "Korisnik sa ovom email adresom nije pronađen.", variant: "destructive" });
        setAddingAdmin(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: data.user_id, role: "admin" as any });

      if (insertError) {
        if (insertError.message.includes("duplicate")) {
          toast({ title: "Info", description: "Ovaj korisnik je već administrator." });
        } else {
          toast({ title: "Greška", description: "Nije moguće dodeliti ulogu.", variant: "destructive" });
        }
      } else {
        toast({ title: "Uspeh", description: `${adminEmail} je sada administrator.` });
        setAdminEmail("");
        fetchProfiles();
      }
    } catch (e) {
      toast({ title: "Greška", description: "Došlo je do greške.", variant: "destructive" });
    }
    setAddingAdmin(false);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const filteredProfiles = profiles.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.ime.toLowerCase().includes(term) ||
      p.prezime.toLowerCase().includes(term) ||
      p.telefon.includes(term)
    );
  });

  if (adminLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-50 flex items-center gap-4 px-4 py-3 shadow-lg"
        style={{ background: "linear-gradient(135deg, hsl(225 35% 42%), hsl(225 40% 62%))" }}
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 rounded-full border-2 border-primary-foreground/30 bg-primary-foreground/15 px-3 py-2 text-primary-foreground transition hover:bg-primary-foreground/25"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Nazad</span>
        </button>
        <div className="flex items-center gap-2">
          <ShieldCheck size={24} className="text-primary-foreground" />
          <h1 className="text-lg font-bold uppercase tracking-wider text-primary-foreground">
            Admin Panel
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-5xl p-6 space-y-8">
        {/* Add admin section */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <ShieldPlus size={18} />
            Dodeli administratorsku ulogu
          </h2>
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="Email adresa korisnika..."
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-popover px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleAddAdmin}
              disabled={addingAdmin || !adminEmail.trim()}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/80 disabled:opacity-50"
            >
              {addingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : "Dodeli"}
            </button>
          </div>
        </div>

        {/* Search profiles */}
        <div className="flex overflow-hidden rounded-xl border border-border bg-popover shadow-sm">
          <input
            type="text"
            placeholder="Pretraži profile po imenu ili telefonu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <div className="flex w-12 items-center justify-center bg-primary/90 text-primary-foreground">
            <Search size={18} />
          </div>
        </div>

        {/* Profiles list */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            Svi profili ({filteredProfiles.length})
          </h2>
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="group flex items-center justify-between rounded-2xl border border-border bg-card px-6 py-4 shadow-sm transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md"
              style={{ background: "linear-gradient(135deg, hsl(220 15% 96%), hsl(220 15% 93%))" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <UserCircle size={32} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-foreground">
                      {profile.ime} {profile.prezime}
                    </span>
                    {profile.is_admin && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{profile.telefon || "Nema telefona"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openProfileAds(profile)}
                  className="rounded-lg bg-accent/20 px-3 py-2 text-xs font-semibold text-accent-foreground transition hover:bg-accent/40"
                  title="Pogledaj oglase"
                >
                  <Eye size={16} />
                </button>
                {profile.user_id !== user?.id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/20"
                        title="Obriši profil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Brisanje profila</AlertDialogTitle>
                        <AlertDialogDescription>
                          Da li ste sigurni da želite da obrišete profil korisnika {profile.ime} {profile.prezime}? Ova akcija se ne može poništiti.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Ne</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDeleteProfile(profile)}
                        >
                          Obriši
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
          {filteredProfiles.length === 0 && (
            <p className="py-12 text-center text-lg font-bold uppercase tracking-wide text-muted-foreground/60">
              Nema profila
            </p>
          )}
        </div>
      </div>

      {/* Profile ads dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={(open) => !open && setSelectedProfile(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Oglasi korisnika: {selectedProfile?.ime} {selectedProfile?.prezime}
            </DialogTitle>
          </DialogHeader>
          {adsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : profileAds.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Ovaj korisnik nema oglasa.
            </p>
          ) : (
            <div className="space-y-3">
              {profileAds.map((ad) => (
                <div
                  key={ad.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-5 py-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{ad.title || ad.category}</p>
                    <p className="text-xs text-muted-foreground">{ad.category} · {ad.location}</p>
                    <p className="text-xs text-muted-foreground">
                      {ad.price} {ad.currency} · {formatDate(ad.start_date)} – {formatDate(ad.end_date)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{ad.description}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ad.status === "active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {ad.status}
                    </span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="ml-3 shrink-0 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/20">
                        <Trash2 size={16} />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Brisanje oglasa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Da li ste sigurni da želite da obrišete oglas "{ad.title || ad.category}"?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Ne</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDeleteAd(ad)}
                        >
                          Obriši
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
