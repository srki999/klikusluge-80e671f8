import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { LogOut, ArrowLeft } from "lucide-react";

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ ime: string; prezime: string; telefon: string; iskustva: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("ime, prezime, telefon, iskustva").eq("user_id", user.id).single()
        .then(({ data }) => { if (data) setProfile(data); });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading || !profile) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Učitavanje...</p></div>;

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: "linear-gradient(135deg, hsl(225 35% 30%), hsl(225 40% 55%))" }}>
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl">
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
    </div>
  );
};

export default Profile;
