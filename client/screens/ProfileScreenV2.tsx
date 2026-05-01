import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import AllergenPickerScreen from "./AllergenPickerScreen";
import BankCardModal from "../components/BankCardModal";
import StudentFamilyLink from "../components/family/StudentFamilyLink";
import { allergenVisual } from "../lib/allergens";

const currency = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export default function ProfileScreenV2() {
  const { logout } = useAuth();
  const { apiFetch } = useApi();

  const [profile, setProfile] = useState<null | {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isBeneficiary: boolean;
    walletBalance: number;
    courseName: string | null;
  }>(null);
  const [orders, setOrders] = useState<Array<{ status: string; total: number }>>([]);
  const [allergies, setAllergies] = useState<Array<{ code: string; name: string }>>([]);
  const [allergyLabel, setAllergyLabel] = useState("Sin configurar");
  const [phone, setPhone] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allergyModalOpen, setAllergyModalOpen] = useState(false);
  const [bankCardModalOpen, setBankCardModalOpen] = useState(false);
  const [savedCard, setSavedCard] = useState<{ lastFourDigits: string } | null>(null);

  useEffect(() => {
    const savedPhone = localStorage.getItem("cafes-profile-phone");
    if (savedPhone) {
      setPhone(savedPhone);
    }

    Promise.all([
      apiFetch<{ id: string; email: string; fullName: string; role: string; isBeneficiary: boolean; walletBalance: number; courseName: string | null }>(
        "/api/me"
      ),
      apiFetch<{ data: Array<{ status: string; total: number }> }>("/api/me/orders?limit=100"),
      apiFetch<{ data: Array<{ code: string; name: string }> }>("/api/me/allergies"),
    ])
      .then(([me, ordersRes, allergiesRes]) => {
        setProfile(me);
        setOrders(ordersRes.data ?? []);
        const items = allergiesRes.data ?? [];
        setAllergies(items);
        setAllergyLabel(items.length === 0 ? "Sin configurar" : items.map((a) => a.name).join(", "));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiFetch]);

  const activeOrders = useMemo(
    () => orders.filter((o) => ["PENDING", "IN_PREPARATION", "READY"].includes(o.status)).length,
    [orders]
  );

  const totalSpent = useMemo(
    () => orders.filter((o) => o.status === "DELIVERED").reduce((sum, o) => sum + (o.total ?? 0), 0),
    [orders]
  );

  async function handleSaveCard(cardData: {
    cardNumber: string;
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  }) {
    try {
      // In a real app, you would send this to a secure backend endpoint
      // For now, we'll just save the last 4 digits for display
      const lastFour = cardData.cardNumber.slice(-4);
      setSavedCard({ lastFourDigits: lastFour });
    } catch (error) {
      throw new Error("Error al guardar la tarjeta");
    }
  }

  async function reloadAllergies() {
    try {
      const result = await apiFetch<{ data: Array<{ code: string; name: string }> }>("/api/me/allergies");
      const items = result.data ?? [];
      setAllergies(items);
      setAllergyLabel(items.length === 0 ? "Sin configurar" : items.map((a) => a.name).join(", "));
    } catch {
      // ignore reload failures silently
    }
  }

  function handleOpenPhoneModal() {
    setPhoneInput(phone ?? "");
    setPhoneModalOpen(true);
  }

  function handleSavePhone() {
    const cleaned = phoneInput.trim();
    if (cleaned.length > 0) {
      setPhone(cleaned);
      localStorage.setItem("cafes-profile-phone", cleaned);
    } else {
      setPhone(null);
      localStorage.removeItem("cafes-profile-phone");
    }
    setPhoneModalOpen(false);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pb-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#92dbc8] border-t-#1C9690" />
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface antialiased h-[100dvh] overflow-hidden flex flex-col">
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-white border-b border-slate-200">
        <span className="text-[#2D3748] font-bold tracking-tight text-lg">KOMO</span>
      </header>

      <main className="pt-20 pb-24 px-4 max-w-md mx-auto flex-1 overflow-y-auto w-full">
        <section className="mb-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
            <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-[#d9f4ee] shadow-inner">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80"
                alt="Perfil"
                className="h-full w-full object-cover"
              />
            </div>
            <h1 className="text-xl font-bold text-slate-900">{profile?.fullName ?? "Usuario"}</h1>
            <p className="mt-2 text-sm text-slate-500">{profile?.courseName ?? "Curso no asignado"}</p>
          </div>
        </section>

        <section className="flex justify-center mb-6">
          <div className="flex items-center gap-3 rounded-full bg-[#1C9690] px-6 py-3 text-white shadow-md">
            <span className="text-sm font-semibold">Saldo</span>
            <span className="text-lg font-bold">{currency.format(profile?.walletBalance ?? 0)}</span>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-3xl bg-white p-4 text-center shadow-sm border border-slate-100">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Pedidos</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{orders.length}</p>
          </div>
          <div className="rounded-3xl bg-white p-4 text-center shadow-sm border border-slate-100">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">En curso</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{activeOrders}</p>
          </div>
          <div className="rounded-3xl bg-white p-4 text-center shadow-sm border border-slate-100">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Gastado</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{currency.format(totalSpent)}</p>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-100 mb-6">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Cuenta</h2>
          </div>
          <button
            type="button"
            onClick={handleOpenPhoneModal}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">Teléfono</p>
              <p className="text-xs text-slate-500">{phone ?? "Sin añadir"}</p>
            </div>
            <span className="text-slate-400 text-sm">Editar</span>
          </button>
          <button
            type="button"
            onClick={() => setBankCardModalOpen(true)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">Métodos de pago</p>
              <p className="text-xs text-slate-500">
                {savedCard ? `Tarjeta ****${savedCard.lastFourDigits}` : "Agregar tarjeta"}
              </p>
            </div>
            <span className="text-slate-400 text-sm">
              {savedCard ? "Cambiar" : "Agregar"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAllergyModalOpen(true)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">Mis alérgenos</p>
              {allergies.length === 0 ? (
                <p className="text-xs text-slate-500">Sin configurar</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {allergies.map((allergen) => {
                    const visual = allergenVisual(allergen.name);
                    return (
                      <span
                        key={allergen.code}
                        title={allergen.name}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-lg"
                      >
                        {visual.icon}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <span className="text-slate-400 text-sm">Editar</span>
          </button>
        </section>

        <section className="mb-6">
          {profile?.role === "STUDENT" ? (
            <StudentFamilyLink />
          ) : (
            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Cuenta familiar</p>
                  <p className="mt-2 text-sm font-semibold">Gestiona tus hijos desde el panel familiar.</p>
                </div>
                <span className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-white">
                  Solo estudiantes
                </span>
              </div>
            </div>
          )}
        </section>

        <section className="flex justify-center mt-8">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-3xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-red-700">
              <path d="M16 17l5-5-5-5v3H9v4h7v3Zm-2 2H6V5h8v2H8v10h6v2Z" />
            </svg>
            Cerrar sesión
          </button>
        </section>
      </main>

      {phoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Editar teléfono</h2>
                <p className="text-sm text-slate-500">Actualiza tu teléfono de contacto.</p>
              </div>
              <button
                type="button"
                onClick={() => setPhoneModalOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
              >
                ×
              </button>
            </div>
            <input
              type="tel"
              value={phoneInput}
              onChange={(event) => setPhoneInput(event.target.value)}
              placeholder="+34 612 345 678"
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2da38f]"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPhoneModalOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePhone}
                className="rounded-2xl bg-[#1C9690] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#169486]"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <AllergenPickerScreen
        open={allergyModalOpen}
        onClose={() => setAllergyModalOpen(false)}
        onSaved={(label) => {
          setAllergyLabel(label);
          reloadAllergies();
          setAllergyModalOpen(false);
        }}
      />

      <BankCardModal
        open={bankCardModalOpen}
        onClose={() => setBankCardModalOpen(false)}
        onSave={handleSaveCard}
      />
    </div>
  );
}
