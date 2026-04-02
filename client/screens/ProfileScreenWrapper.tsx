import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import ProfileScreen, { type ProfileUser, type FamilyState } from "../components/ProfileScreen";
import StudentFamilyLink from "../components/family/StudentFamilyLink";
import ParentFamilyManager from "../components/family/ParentFamilyManager";
import AllergenPickerScreen from "./AllergenPickerScreen";
import ChildProfileScreen from "./ChildProfileScreen";

// ─── API response shape ───────────────────────────────────────────────────────

type ApiProfile = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isBeneficiary: boolean;
  walletBalance: number;
  courseName: string | null;
};

type ApiOrdersResponse = {
  data: Array<{ status: string; total: number }>;
};

type ApiAllergiesResponse = {
  data: Array<{ code: string; name: string }>;
};

type SubView = "PROFILE" | "FAMILY" | "ALLERGENS" | "CHILD_PROFILE";

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreenWrapper() {
  const { logout } = useAuth();
  const { apiFetch } = useApi();

  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [orders, setOrders] = useState<ApiOrdersResponse["data"]>([]);
  const [allergies, setAllergies] = useState<ApiAllergiesResponse["data"]>([]);
  const [loading, setLoading] = useState(true);
  const [subView, setSubView] = useState<SubView>("PROFILE");
  const [allergensLabelOverride, setAllergensLabelOverride] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<ApiProfile>("/api/me"),
      apiFetch<ApiOrdersResponse>("/api/me/orders?limit=200"),
      apiFetch<ApiAllergiesResponse>("/api/me/allergies"),
    ])
      .then(([prof, ords, alrg]) => {
        setProfile(prof);
        setOrders(ords.data ?? []);
        setAllergies(alrg.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiFetch]);

  // ── Sub-view wrappers ────────────────────────────────────────────────────
  if (subView === "ALLERGENS") {
    return (
      <AllergenPickerScreen
        onBack={() => setSubView("PROFILE")}
        onSaved={(label) => {
          setAllergensLabelOverride(label);
          setSubView("PROFILE");
        }}
      />
    );
  }

  if (subView === "CHILD_PROFILE" && selectedChild) {
    return (
      <ChildProfileScreen
        studentId={selectedChild.id}
        studentName={selectedChild.name}
        onBack={() => setSubView("FAMILY")}
      />
    );
  }

  if (subView === "FAMILY") {
    const isParent = profile?.role === "PARENT";
    return (
      <div className="flex h-full flex-col bg-gray-50">
        {/* Sub-view header */}
        <div className="shrink-0 flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
          <button
            type="button"
            onClick={() => setSubView("PROFILE")}
            aria-label="Volver"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-slate-500 transition-all active:scale-90 hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="font-bold text-slate-900">
            {isParent ? "Gestión familiar" : "Vincular cuenta familiar"}
          </h2>
        </div>

        {/* Sub-view content */}
        <div className="flex-1 overflow-hidden">
          {isParent ? (
            <ParentFamilyManager
              onViewChildProfile={(id, name) => {
                setSelectedChild({ id, name });
                setSubView("CHILD_PROFILE");
              }}
            />
          ) : (
            <StudentFamilyLink />
          )}
        </div>
      </div>
    );
  }

  // ── Profile view ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pb-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 pb-20 text-slate-400">
        <p className="text-sm">No se pudo cargar el perfil.</p>
        <button type="button" onClick={logout} className="text-sm font-semibold text-red-500">
          Cerrar sesión
        </button>
      </div>
    );
  }

  const activeOrders = orders.filter((o) =>
    ["PENDING", "IN_PREPARATION", "READY"].includes(o.status)
  ).length;

  const totalSpentCents = Math.round(
    orders
      .filter((o) => o.status === "DELIVERED")
      .reduce((acc, o) => acc + (o.total ?? 0), 0) * 100
  );

  const user: ProfileUser = {
    fullName: profile.fullName,
    initials: profile.fullName
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase(),
    walletBalanceCents: Math.round(profile.walletBalance * 100),
    totalOrders: orders.length,
    activeOrders,
    totalSpentCents,
    allergensLabel:
      allergensLabelOverride ??
      (allergies.length > 0
        ? allergies
            .slice(0, 3)
            .map((a) => a.name)
            .join(", ") + (allergies.length > 3 ? ` +${allergies.length - 3}` : "")
        : "Sin configurar"),
  };

  const family: FamilyState = { status: "UNLINKED" };

  const showFamilyButton = profile.role === "STUDENT" || profile.role === "PARENT";

  return (
    <ProfileScreen
      user={user}
      family={family}
      onLogout={logout}
      onEditAllergens={profile.role === "STUDENT" ? () => setSubView("ALLERGENS") : undefined}
      onEditPayment={() => alert("💳 Métodos de pago")}
      onLinkFamily={showFamilyButton ? () => setSubView("FAMILY") : undefined}
    />
  );
}

