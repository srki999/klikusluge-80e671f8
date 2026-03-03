import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApplyModalProps {
  open: boolean;
  onClose: () => void;
  adId: string;
  userId: string;
  adTitle: string;
  currency?: string;
  maxPrice: number;
}

const ApplyModal = ({ open, onClose, adId, userId, adTitle, currency = "RSD", maxPrice }: ApplyModalProps) => {
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const priceNum = Number(price);
  const valid = priceNum > 0 && priceNum <= maxPrice && message.trim().length >= 30;

  const handleSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);

    const { error } = await supabase.from("applications").insert({
      ad_id: adId,
      user_id: userId,
      price_rsd: priceNum,
      message: message.trim(),
    });

    setSubmitting(false);

    if (error) {
      toast.error("Greška pri slanju prijave. Pokušajte ponovo.");
      return;
    }

    toast.success("Prijava uspešno poslata!");
    setPrice("");
    setMessage("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Pošaljite ponudu</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground truncate">
          Oglas: <span className="font-medium text-foreground">{adTitle}</span>
        </p>

        <div className="space-y-4 pt-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Ponuda cene ({currency}) <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              min={1}
              placeholder="Unesite vašu ponudu"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            {price && priceNum <= 0 && (
              <p className="mt-1 text-xs text-destructive">Cena mora biti veća od 0</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Kratka poruka <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="Napišite kratku poruku poslodavcu…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            {message.length > 0 && message.trim().length < 30 && (
              <p className="mt-1 text-xs text-destructive">Poruka mora imati najmanje 30 karaktera</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Otkaži
          </Button>
          <Button onClick={handleSubmit} disabled={!valid || submitting}>
            {submitting ? "Slanje…" : "Pošalji prijavu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyModal;
