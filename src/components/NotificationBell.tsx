import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import ApplicationReviewDialog from "./ApplicationReviewDialog";

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  ad_id: string | null;
  applicant_id: string;
}

interface ApplicationData {
  id: string;
  message: string;
  price_rsd: number;
  created_at: string;
  applicant_name: string;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [reviewNotif, setReviewNotif] = useState<Notification | null>(null);
  const [reviewApp, setReviewApp] = useState<ApplicationData | null>(null);
  const [reviewCurrency, setReviewCurrency] = useState("RSD");
  const [reviewAdTitle, setReviewAdTitle] = useState("");

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, message, is_read, created_at, ad_id, applicant_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      markAllRead();
    }
  };

  const isActionable = (n: Notification) => {
    // Actionable if someone applied to the user's ad (applicant_id is NOT the current user)
    return n.ad_id && n.applicant_id !== user?.id;
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!isActionable(n) || !n.ad_id) return;

    // Fetch the application
    const { data: apps } = await supabase
      .from("applications")
      .select("id, message, price_rsd, created_at, user_id")
      .eq("ad_id", n.ad_id)
      .eq("user_id", n.applicant_id)
      .limit(1);

    if (!apps || apps.length === 0) return;

    const app = apps[0];

    // Get applicant name
    const { data: profile } = await supabase
      .from("profiles")
      .select("ime, prezime")
      .eq("user_id", app.user_id)
      .single();

    // Get ad info for currency and title
    const { data: ad } = await supabase
      .from("ads")
      .select("currency, title, category")
      .eq("id", n.ad_id)
      .single();

    setReviewApp({
      id: app.id,
      message: app.message,
      price_rsd: app.price_rsd,
      created_at: app.created_at,
      applicant_name: profile ? `${profile.ime} ${profile.prezime}`.trim() : "Korisnik",
    });
    setReviewCurrency(ad?.currency || "RSD");
    setReviewAdTitle(ad?.title || ad?.category || "Oglas");
    setReviewNotif(n);
    setOpen(false);
  };

  const handleActionComplete = () => {
    fetchNotifications();
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "upravo";
    if (mins < 60) return `pre ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `pre ${hours}h`;
    const days = Math.floor(hours / 24);
    return `pre ${days}d`;
  };

  if (!user) return null;

  return (
    <>
      <Popover open={open} onOpenChange={handleOpen}>
        <PopoverTrigger asChild>
          <button className="relative flex items-center justify-center rounded-full border-2 border-primary-foreground/30 bg-primary-foreground/15 p-2 transition hover:bg-primary-foreground/25">
            <Bell size={20} className="text-primary-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Obaveštenja</h3>
          </div>
          <ScrollArea className="max-h-72">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nemate obaveštenja
              </p>
            ) : (
              <div className="divide-y">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`px-4 py-3 text-sm ${!n.is_read ? "bg-accent/40" : ""} ${isActionable(n) ? "cursor-pointer hover:bg-accent/60 transition" : ""}`}
                  >
                    <p className="text-foreground">{n.message}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(n.created_at)}
                      </p>
                      {isActionable(n) && (
                        <span className="text-xs font-medium text-primary">Pregledaj →</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <ApplicationReviewDialog
        open={!!reviewNotif}
        onClose={() => { setReviewNotif(null); setReviewApp(null); }}
        notificationId={reviewNotif?.id || ""}
        application={reviewApp}
        currency={reviewCurrency}
        adTitle={reviewAdTitle}
        onActionComplete={handleActionComplete}
      />
    </>
  );
};

export default NotificationBell;
