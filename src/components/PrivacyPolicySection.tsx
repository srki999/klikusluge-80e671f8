import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react";

interface PrivacyPolicySectionProps {
  agreed: boolean;
  onAgreeChange: (val: boolean) => void;
}

const PrivacyPolicySection = ({ agreed, onAgreeChange }: PrivacyPolicySectionProps) => {
  const [showPolicy, setShowPolicy] = useState(false);

  return (
    <div className="space-y-2">
      {showPolicy && (
        <div className="max-h-56 overflow-y-auto rounded-xl border border-border bg-muted/50 p-4 text-xs text-muted-foreground space-y-2">
          <h3 className="font-bold text-sm text-foreground">Politika privatnosti – Klik Usluge</h3>
          <p>Poslednje ažuriranje: mart 2026.</p>

          <h4 className="font-semibold text-foreground">1. Uvod</h4>
          <p>Klik Usluge (u daljem tekstu „mi", „naš sajt") posvećen je zaštiti privatnosti svojih korisnika. Ova politika privatnosti opisuje kako prikupljamo, koristimo i štitimo vaše lične podatke prilikom korišćenja naše platforme za oglašavanje usluga i obrade plaćanja.</p>

          <h4 className="font-semibold text-foreground">2. Podaci koje prikupljamo</h4>
          <p>Prilikom registracije i korišćenja platforme prikupljamo: ime i prezime, e-mail adresu, broj telefona, podatke o oglasima koje postavljate ili na koje se prijavljujete, te podatke o pretplatama i transakcijama.</p>

          <h4 className="font-semibold text-foreground">3. Podaci o plaćanju</h4>
          <p>Podaci o platnim karticama (broj kartice, datum isteka, CVV) koriste se isključivo za obradu transakcije i ne čuvaju se na našim serverima. Obrada plaćanja vrši se putem sigurnih, sertifikovanih platnih procesora.</p>

          <h4 className="font-semibold text-foreground">4. Svrha obrade podataka</h4>
          <p>Vaše podatke koristimo za: kreiranje i upravljanje korisničkim nalogom, objavljivanje i prikazivanje oglasa, obradu prijava na oglase, obradu plaćanja i pretplata, slanje obaveštenja vezanih za aktivnosti na platformi, te poboljšanje korisničkog iskustva.</p>

          <h4 className="font-semibold text-foreground">5. Deljenje podataka</h4>
          <p>Vaše lične podatke ne prodajemo niti delimo sa trećim stranama, osim kada je to neophodno za obradu plaćanja ili kada to zahteva zakon. Osnovni podaci (ime, prezime) mogu biti vidljivi drugim korisnicima u kontekstu oglasa.</p>

          <h4 className="font-semibold text-foreground">6. Zaštita podataka</h4>
          <p>Primenjujemo tehničke i organizacione mere zaštite podataka, uključujući enkripciju podataka u prenosu (SSL/TLS), sigurnu autentifikaciju i kontrolu pristupa podacima.</p>

          <h4 className="font-semibold text-foreground">7. Vaša prava</h4>
          <p>Imate pravo na: pristup svojim podacima, ispravku netačnih podataka, brisanje naloga i podataka, ograničenje obrade, kao i pravo na prigovor nadležnom organu za zaštitu podataka.</p>

          <h4 className="font-semibold text-foreground">8. Kolačići</h4>
          <p>Koristimo funkcionalne kolačiće neophodne za rad platforme, kao što su kolačići za autentifikaciju i sesiju korisnika.</p>

          <h4 className="font-semibold text-foreground">9. Kontakt</h4>
          <p>Za sva pitanja u vezi sa privatnošću podataka, možete nas kontaktirati putem e-mail adrese navedene na platformi.</p>
        </div>
      )}

      <div className="flex items-start gap-2">
        <Checkbox
          id="privacy-agree"
          checked={agreed}
          onCheckedChange={(v) => onAgreeChange(v === true)}
          className="mt-0.5"
        />
        <label htmlFor="privacy-agree" className="text-xs text-muted-foreground leading-tight cursor-pointer select-none">
          Pročitao/la sam i slažem se sa{" "}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setShowPolicy((p) => !p); }}
            className="inline-flex items-center gap-0.5 font-semibold text-foreground underline underline-offset-2 hover:opacity-80"
          >
            politikom privatnosti
            {showPolicy ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          .
        </label>
      </div>
    </div>
  );
};

export default PrivacyPolicySection;
