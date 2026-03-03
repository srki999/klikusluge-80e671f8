import { Search } from "lucide-react";
import logo from "@/assets/logo.png";

const ads = [
  { id: 1, title: "OGLAS 1" },
  { id: 2, title: "OGLAS 2" },
  { id: 3, title: "OGLAS 3" },
  { id: 4, title: "OGLAS 4" },
];

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[1300px] overflow-hidden rounded-2xl shadow-2xl">
        {/* Header */}
        <header
          className="flex items-center justify-between px-6 py-4"
          style={{
            background:
              "linear-gradient(135deg, hsl(225 35% 42%), hsl(225 40% 62%))",
          }}
        >
          <img src={logo} alt="Klik Usluge" className="h-12 w-auto" />
          <div className="h-10 w-10 rounded-full border-2 border-primary-foreground/30 bg-primary-foreground/15" />
        </header>

        {/* Body */}
        <div className="flex min-h-[520px]">
          {/* Sidebar */}
          <aside
            className="hidden w-64 shrink-0 p-5 md:block"
            style={{
              background:
                "linear-gradient(180deg, hsl(30 100% 50%), hsl(30 95% 60%))",
            }}
          >
            <button className="w-full rounded-xl border border-secondary-foreground/30 px-5 py-3 text-sm font-semibold text-secondary-foreground shadow-md transition hover:bg-secondary-foreground/10">
              Prijavi novi oglas
            </button>
          </aside>

          {/* Main content */}
          <main className="flex-1 bg-muted p-6 md:p-8">
            {/* Search bar */}
            <div className="mx-auto mb-8 flex max-w-2xl overflow-hidden rounded-xl border border-border bg-popover shadow-sm">
              <input
                type="text"
                placeholder="Search"
                className="flex-1 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                readOnly
              />
              <button className="flex w-12 items-center justify-center bg-primary/90 text-primary-foreground transition hover:bg-primary">
                <Search size={18} />
              </button>
            </div>

            {/* Ad cards */}
            <div className="space-y-4">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card px-6 py-5 shadow-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(220 15% 96%), hsl(220 15% 93%))",
                  }}
                >
                  <span className="text-lg font-semibold text-foreground tracking-wide">
                    {ad.title}
                  </span>
                  <button className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90">
                    PRIJAVI SE
                  </button>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
