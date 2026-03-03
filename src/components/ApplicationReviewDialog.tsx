import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Banknote, FileText, CheckCircle, XCircle, Loader2, Mail, Phone } from "lucide-react";

interface ApplicationData {
  id: string;
  message: string;
  price_rsd: number;
  created_at: string;
  applicant_name: string;
}

interface AcceptedInfo {
  ime: string;
  prezime: string;
  email: string;
  telefon: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  notificationId: string;
  application: ApplicationData | null;
  currency: string;
  adTitle: string;
  onActionComplete: () => void;
}

const ApplicationReviewDialog = ({
  open,
  onClose,
  notificationId,
  application,
  currency,
  adTitle,
  onActionComplete,
}: Props) => {
  const [processing, setProcessing] = useState(false);
  const [acceptedInfo, setAcceptedInfo] = useState<AcceptedInfo | null>(null);

  const handleAccept = async () => {
    if (!application) return;
    setProcessing(true);
    const { data, error } = await supabase.rpc("accept_application", {
      p_application_id: application.id,
      p_notification_id: notificationId,
    });
    setProcessing(false);
    if (!error && data) {
      setAcceptedInfo(data as unknown as AcceptedInfo);
      onActionComplete();
    }
  };

  const handleReject = async () => {
    if (!application) return;
    setProcessing(true);
    const { error } = await supabase.rpc("reject_application", {
      p_application_id: application.id,
      p_notification_id: notificationId,
    });
    setProcessing(false);
    if (!error) {
      onActionComplete();
      onClose();
    }
  };

  const handleClose = () => {
    setAcceptedInfo(null);
    onClose();
  };

  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {acceptedInfo ? "Prijava prihvaćena!" : `Prijava za "${adTitle}"`}
          </DialogTitle>
        </DialogHeader>

        {acceptedInfo ? (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Kontakt informacije korisnika čija je prijava prihvaćena:
            </p>
            <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User size={16} className="shrink-0 text-primary" />
                <span className="font-medium">{acceptedInfo.ime} {acceptedInfo.prezime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail size={16} className="shrink-0 text-primary" />
                <span>{acceptedInfo.email}</span>
              </div>
              {acceptedInfo.telefon && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={16} className="shrink-0 text-primary" />
                  <span>{acceptedInfo.telefon}</span>
                </div>
              )}
            </div>
            <button
              onClick={handleClose}
              className="mt-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80"
            >
              Zatvori
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User size={16} className="shrink-0" />
              <span className="font-medium text-foreground">{application.applicant_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Banknote size={16} className="shrink-0" />
              <span className="font-medium text-foreground">{application.price_rsd} {currency}</span>
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <FileText size={16} className="mt-0.5 shrink-0" />
              <p className="text-foreground break-words whitespace-pre-wrap" style={{ overflowWrap: "anywhere" }}>
                {application.message}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                disabled={processing}
                onClick={handleAccept}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Prihvati
              </button>
              <button
                disabled={processing}
                onClick={handleReject}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition hover:bg-destructive/90 disabled:opacity-50"
              >
                {processing ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Odbij
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationReviewDialog;
