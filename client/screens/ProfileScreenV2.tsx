import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import AllergenPickerScreen from "./AllergenPickerScreen";
import BankCardModal from "../components/BankCardModal";
import StudentFamilyLink from "../components/family/StudentFamilyLink";
import { allergenVisual } from "../lib/allergens";

export default function ProfileScreenV2() {
  const { logout, state } = useAuth();
  const { apiFetch } = useApi();

  const [profile, setProfile] = useState<null | {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isBeneficiary: boolean;
    walletBalance: number;
    phone?: string | null;
    paymentCardLast4?: string | null;
    courseName: string | null;
  }>(null);
  const [allergies, setAllergies] = useState<Array<{ code: string; name: string }>>([]);
  const [phone, setPhone] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allergyModalOpen, setAllergyModalOpen] = useState(false);
  const [bankCardModalOpen, setBankCardModalOpen] = useState(false);
  const [savedCard, setSavedCard] = useState<{ lastFourDigits: string } | null>(null);
  const userId = state.status === "authenticated" ? state.user.id : "anonymous";
  const phoneStorageKey = `cafes-profile-phone:${userId}`;
  const cardStorageKey = `cafes-payment-card-last4:${userId}`;

  useEffect(() => {
    Promise.all([
      apiFetch<{
        id: string;
        email: string;
        fullName: string;
        role: string;
        isBeneficiary: boolean;
        walletBalance: number;
        phone?: string | null;
        paymentCardLast4?: string | null;
        courseName: string | null;
      }>(
        "/api/me"
      ),
      apiFetch<{ data: Array<{ code: string; name: string }> }>("/api/me/allergies"),
    ])
      .then(([me, allergiesRes]) => {
        setProfile(me);
        const localPhone = localStorage.getItem(phoneStorageKey);
        const localCard = localStorage.getItem(cardStorageKey);
        setPhone(me.phone ?? localPhone ?? null);
        setSavedCard(me.paymentCardLast4 || localCard ? { lastFourDigits: me.paymentCardLast4 ?? localCard! } : null);
        const items = allergiesRes.data ?? [];
        setAllergies(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiFetch, cardStorageKey, phoneStorageKey]);

  async function handleSaveCard(cardData: {
    cardNumber: string;
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  }) {
    try {
      const lastFour = cardData.cardNumber.slice(-4);
      try {
        await apiFetch("/api/me", {
          method: "PATCH",
          body: JSON.stringify({ paymentCardLast4: lastFour }),
        });
      } catch {
        localStorage.setItem(cardStorageKey, lastFour);
      }
      setSavedCard({ lastFourDigits: lastFour });
      window.dispatchEvent(new Event("profileChanged"));
    } catch (error) {
      throw new Error("Error al guardar la tarjeta");
    }
  }

  async function reloadAllergies() {
    try {
      const result = await apiFetch<{ data: Array<{ code: string; name: string }> }>("/api/me/allergies");
      const items = result.data ?? [];
      setAllergies(items);
    } catch {
      // ignore reload failures silently
    }
  }

  function handleOpenPhoneModal() {
    setPhoneInput(phone ?? "");
    setPhoneModalOpen(true);
  }

  async function handleSavePhone() {
    const cleaned = phoneInput.trim();
    try {
      await apiFetch("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ phone: cleaned.length > 0 ? cleaned : null }),
      });
      if (cleaned.length > 0) localStorage.setItem(phoneStorageKey, cleaned);
      else localStorage.removeItem(phoneStorageKey);
      setPhone(cleaned.length > 0 ? cleaned : null);
      window.dispatchEvent(new Event("profileChanged"));
      setPhoneModalOpen(false);
    } catch {
      if (cleaned.length > 0) localStorage.setItem(phoneStorageKey, cleaned);
      else localStorage.removeItem(phoneStorageKey);
      setPhone(cleaned.length > 0 ? cleaned : null);
      setPhoneModalOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pb-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#92dbc8] border-t-[#1C9690]" />
      </div>
    );
  }

  const isStudent = profile?.role === "STUDENT";
  const isParent = profile?.role === "PARENT";

  return (
    <div className="bg-surface text-on-surface antialiased h-[100dvh] overflow-hidden flex flex-col">
      <header className="shrink-0 bg-white px-4 pt-5 pb-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <img src="/logotipo-transparente.png" alt="KOMO" className="h-10 w-auto" />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 transition active:scale-95 hover:bg-red-100"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M16 17l5-5-5-5v3H9v4h7v3Zm-2 2H6V5h8v2H8v10h6v2Z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="pb-24 px-4 max-w-md mx-auto flex-1 overflow-y-auto w-full pt-4">
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

        <section className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-100 mb-6">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Cuenta</h2>
          </div>
          {!isStudent && (
            <>
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
            </>
          )}
          {!isParent && (
            <button
              type="button"
              onClick={() => setAllergyModalOpen(true)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{isStudent ? "Alérgenos registrados" : "Mis alérgenos"}</p>
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
                {isStudent && (
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    Esta información se usa para avisarte antes de pedir productos con riesgo.
                  </p>
                )}
              </div>
              <span className="text-slate-400 text-sm">Editar</span>
            </button>
          )}
          {isStudent && (
            <div className="px-5 py-4 text-sm text-slate-500">
              Tu cuenta de alumno usa solo monedero escolar. No necesita teléfono ni tarjeta bancaria.
            </div>
          )}
        </section>

        {profile?.role === "STUDENT" && (
          <section className="mb-6">
            <StudentFamilyLink />
          </section>
        )}

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
        onSaved={() => {
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
