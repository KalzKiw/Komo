type DemoRole = "STUDENT" | "PARENT" | "ADMIN";

const now = new Date();
const iso = (daysAgo = 0) => new Date(now.getTime() - daysAgo * 86400000).toISOString();

export const demoUsers = {
  "student1@cafes.app": { id: "demo-student", email: "student1@cafes.app", fullName: "Álex García", role: "STUDENT" as const, isBeneficiary: true },
  "parent1@cafes.app": { id: "demo-parent", email: "parent1@cafes.app", fullName: "Carmen García", role: "PARENT" as const, isBeneficiary: false },
  "admin1@cafes.app": { id: "demo-admin", email: "admin1@cafes.app", fullName: "Administración KOMO", role: "ADMIN" as const, isBeneficiary: false },
};

const allergens = [
  { id: "a1", code: "GLUTEN", name: "Gluten" },
  { id: "a2", code: "MILK", name: "Leche" },
  { id: "a3", code: "EGGS", name: "Huevos" },
  { id: "a4", code: "PEANUTS", name: "Cacahuetes" },
];

const products = [
  { id: "p1", name: "Bocadillo de tortilla", description: "Tortilla española recién hecha", price: 2.8, isActive: true, allergens: [allergens[0], allergens[2]], isOfficialMenu: true },
  { id: "p2", name: "Sándwich de jamón y queso", description: "Pan integral, jamón cocido y queso", price: 2.5, isActive: true, allergens: [allergens[0], allergens[1]] },
  { id: "p3", name: "Croissant artesanal", description: "Horneado cada mañana", price: 1.5, isActive: true, allergens: [allergens[0], allergens[1], allergens[2]] },
  { id: "p4", name: "Zumo de naranja", description: "Zumo natural, 250 ml", price: 1.4, isActive: true, allergens: [] },
  { id: "p5", name: "Agua mineral", description: "Botella de 500 ml", price: 1, isActive: true, allergens: [] },
  { id: "p6", name: "Galleta de avena", description: "Avena, plátano y canela", price: 1.2, isActive: true, allergens: [allergens[0]] },
];

const orders = [
  { id: "ord-1042", status: "IN_PREPARATION", shift: "MORNING", total: 4.2, createdAt: iso(0), scheduledFor: iso(0).slice(0, 10), creditedToWallet: false, productSummary: "Bocadillo de tortilla · Zumo", studentName: "Álex García", items: [{ productId: "p1", name: "Bocadillo de tortilla", quantity: 1, price: 2.8, lineTotal: 2.8, customizations: ["Sin cebolla"] }, { productId: "p4", name: "Zumo de naranja", quantity: 1, price: 1.4, lineTotal: 1.4 }] },
  { id: "ord-1031", status: "DELIVERED", shift: "MORNING", total: 3.7, createdAt: iso(2), scheduledFor: iso(2).slice(0, 10), creditedToWallet: false, productSummary: "Sándwich · Galleta", studentName: "Álex García", items: [{ productId: "p2", name: "Sándwich de jamón y queso", quantity: 1, price: 2.5, lineTotal: 2.5 }, { productId: "p6", name: "Galleta de avena", quantity: 1, price: 1.2, lineTotal: 1.2 }] },
  { id: "ord-1018", status: "DELIVERED", shift: "BREAKFAST", total: 2.9, createdAt: iso(5), scheduledFor: iso(5).slice(0, 10), creditedToWallet: false, productSummary: "Croissant · Zumo", studentName: "Lucía García", items: [{ productId: "p3", name: "Croissant artesanal", quantity: 1, price: 1.5, lineTotal: 1.5 }, { productId: "p4", name: "Zumo de naranja", quantity: 1, price: 1.4, lineTotal: 1.4 }] },
];

const movements = [
  ...orders,
  { id: "topup-1", status: "TOPUP", shift: "", total: 20, createdAt: iso(7), scheduledFor: iso(7).slice(0, 10), creditedToWallet: true, concept: "Recarga familiar" },
];

function role(): DemoRole {
  try {
    return JSON.parse(sessionStorage.getItem("cafes_auth") ?? "{}").user?.role ?? "STUDENT";
  } catch { return "STUDENT"; }
}

function me() {
  const user = Object.values(demoUsers).find((item) => item.role === role()) ?? demoUsers["student1@cafes.app"];
  return { ...user, walletBalance: user.role === "PARENT" ? 0 : 12.6, phone: "+34 600 123 456", paymentCardLast4: user.role === "PARENT" ? "4242" : null, courseName: user.role === "STUDENT" ? "1º ESO A" : null };
}

const child = { linkId: "link-demo", studentId: "demo-student", studentName: "Álex García", walletBalance: 12.6 };

export async function demoApi<T>(input: string, init: RequestInit = {}): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 120));
  const url = new URL(input, window.location.origin);
  const path = url.pathname;
  const method = (init.method ?? "GET").toUpperCase();
  let result: unknown;

  if (path === "/api/products" || path === "/api/admin/products") result = { data: products };
  else if (path === "/api/allergens") result = { data: allergens };
  else if (path === "/api/me") result = me();
  else if (path === "/api/me/allergies" || path.endsWith("/allergies")) result = method === "GET" ? { data: [allergens[0]] } : { ok: true };
  else if (path === "/api/me/orders") result = { data: orders.slice(0, 2) };
  else if (path === "/api/me/wallet-movements") result = { data: movements };
  else if (path === "/api/orders") result = method === "GET" ? { data: orders } : { id: `demo-${Date.now()}`, status: "PENDING", simulated: true };
  else if (/^\/api\/orders\/[^/]+$/.test(path)) result = orders.find((item) => item.id === path.split("/").pop()) ?? orders[0];
  else if (path.startsWith("/api/orders/")) result = { ok: true, simulated: true };
  else if (path === "/api/family/children") result = { data: [child, { linkId: "link-demo-2", studentId: "demo-student-2", studentName: "Lucía García", walletBalance: 8.4 }] };
  else if (/\/api\/family\/children\/[^/]+\/profile/.test(path)) result = { id: path.split("/")[4], fullName: path.includes("student-2") ? "Lucía García" : "Álex García", email: "alumno.demo@komo.app", walletBalance: 12.6, courseName: "1º ESO A", isBeneficiary: true, allergens: [allergens[0]] };
  else if (/\/api\/family\/children\/[^/]+\/orders/.test(path)) result = { data: orders };
  else if (path === "/api/family/token") result = { tokenCode: "KOMO-4821", expiresAt: new Date(Date.now() + 15 * 60000).toISOString() };
  else if (path === "/api/family/my-parent") result = { linked: true, linkId: "link-demo", parentId: "demo-parent", parentName: "Carmen García" };
  else if (path === "/api/admin/students") result = { data: [{ id: "demo-student", fullName: "Álex García", email: "alex@demo.komo.app", role: "STUDENT", isDelegate: false }, { id: "demo-student-2", fullName: "Lucía García", email: "lucia@demo.komo.app", role: "DELEGATE", isDelegate: true }] };
  else if (path === "/api/admin/kds") result = { data: orders.filter((item) => item.status !== "DELIVERED") };
  else if (path === "/api/admin/family") result = { data: [{ linkId: "link-demo", status: "ACTIVE", parentId: "demo-parent", parentName: "Carmen García", parentWallet: 0, studentId: "demo-student", studentName: "Álex García", studentWallet: 12.6 }] };
  else if (path === "/api/admin/settings/schedule") result = method === "GET" ? { morning: { hour: 9, minute: 30 }, afternoon: { hour: 13, minute: 30 }, night: { hour: 20, minute: 0 }, graceMinutes: 10, disabled: false } : { ok: true };
  else if (path === "/api/payments/profile/cards") result = { data: [{ id: "card-demo", brand: "visa", lastFourDigits: "4242", expMonth: 12, expYear: 2030, isDefault: true }] };
  else if (path === "/api/payments/family/topup-saved-card") result = { newBalance: 17.6, amount: 5, lastFourDigits: "4242" };
  else if (path === "/api/payments/config") result = { publishableKey: "demo" };
  else if (method !== "GET") result = { ok: true, simulated: true };
  else result = { data: [] };

  return structuredClone(result) as T;
}
