import { Bell, ClipboardList, House, Search, UserRound, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

type BottomTab = "home" | "pedidos" | "billetera" | "perfil";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  badge?: string;
};

const products: Product[] = [
  {
    id: "1",
    name: "Bocadillo Oficial",
    description: "Menu oficial escolar",
    price: 0,
    badge: "Popular"
  },
  {
    id: "2",
    name: "Croissant",
    description: "Recien horneado",
    price: 1,
    badge: "Top"
  },
  {
    id: "3",
    name: "Sandwich Mixto",
    description: "Jamon y queso",
    price: 2.2
  },
  {
    id: "4",
    name: "Zumo Naranja",
    description: "Natural 250ml",
    price: 1.2
  },
  {
    id: "5",
    name: "Batido Chocolate",
    description: "Frio",
    price: 1.8
  },
  {
    id: "6",
    name: "Fruta del Dia",
    description: "Pieza fresca",
    price: 0.9
  }
];

export default function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<BottomTab>("home");
  const [query, setQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return products;
    }

    return products.filter((product) => {
      const text = `${product.name} ${product.description}`.toLowerCase();
      return text.includes(q);
    });
  }, [query]);

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      <header className="h-16 shrink-0 bg-white shadow-sm z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white grid place-items-center font-bold">C</div>
          <div>
            <p className="text-slate-800 font-semibold leading-tight">CafeAP</p>
            <p className="text-xs text-slate-500 leading-tight">Alumno / Padre</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-10 w-10 rounded-full bg-slate-100 text-slate-500 grid place-items-center transition-all active:scale-95"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center font-semibold transition-all active:scale-95"
            aria-label="Perfil"
          >
            AU
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-6">
        <section className="rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-4 shadow-sm">
          <p className="text-sm/5 text-emerald-50">Monedero virtual</p>
          <p className="mt-1 text-3xl font-bold">5,00 EUR</p>
          <p className="mt-1 text-xs text-emerald-100">Curso: 3 ESO A</p>
        </section>

        <section className="mt-4 rounded-2xl bg-white p-3 shadow-sm border border-slate-100">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar productos"
              className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
            />
          </label>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="h-24 bg-gradient-to-br from-slate-200 via-slate-100 to-emerald-100 relative">
                {product.badge ? (
                  <span className="absolute top-2 left-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {product.badge}
                  </span>
                ) : null}
              </div>

              <div className="p-3">
                <h3 className="text-slate-800 font-semibold text-sm leading-tight">{product.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{product.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-emerald-600 text-xl font-bold">{product.price.toFixed(2)} EUR</span>
                  <button
                    type="button"
                    className="h-9 w-9 rounded-full bg-emerald-600 text-white text-lg leading-none grid place-items-center transition-all active:scale-95"
                    aria-label={`Agregar ${product.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      <nav className="h-16 shrink-0 bg-white border-t border-slate-200 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <ul className="h-full grid grid-cols-4">
          <li className="h-full">
            <button
              type="button"
              onClick={() => setActiveTab("home")}
              className={`h-full w-full flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                activeTab === "home" ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              <House className="h-5 w-5" />
              <span className="text-[11px] font-medium">Home</span>
            </button>
          </li>
          <li className="h-full">
            <button
              type="button"
              onClick={() => setActiveTab("pedidos")}
              className={`h-full w-full flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                activeTab === "pedidos" ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              <ClipboardList className="h-5 w-5" />
              <span className="text-[11px] font-medium">Pedidos</span>
            </button>
          </li>
          <li className="h-full">
            <button
              type="button"
              onClick={() => setActiveTab("billetera")}
              className={`h-full w-full flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                activeTab === "billetera" ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              <Wallet className="h-5 w-5" />
              <span className="text-[11px] font-medium">Billetera</span>
            </button>
          </li>
          <li className="h-full">
            <button
              type="button"
              onClick={() => setActiveTab("perfil")}
              className={`h-full w-full flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                activeTab === "perfil" ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              <UserRound className="h-5 w-5" />
              <span className="text-[11px] font-medium">Perfil</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
