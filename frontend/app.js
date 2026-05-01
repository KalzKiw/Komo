import {
  money, escapeHtml, elapsedFrom, formatShiftLabel, formatOrderStatus,
  normalizedText, formatNutrition, computeCutoffCountdown,
  adminProductCategory, productCategory, ingredientPreset,
  getProductImage, getProductImageFallback
} from "./utils.js";
import { allergenVisual, getDefaultAllergens } from "./allergens.js";
import { resolveSanitaryInfo } from "./sanitary.js";

const state = {
  session: null,
  students: [],
  kds: [],
  adminOrders: [],
  products: [],
  allergies: [],
  myOrders: [],
  cart: [],
  category: "ALL",
  ordersFilter: "ALL",
  ordersView: "LIST",
  selectedOrderId: null,
  selectedOrderDetail: null,
  adminSelectedOrderId: null,
  adminSelectedOrderDetail: null,
  adminOrdersSearch: "",
  adminOrdersShift: "ALL",
  activeTab: "HOME",
  adminTab: "FORECAST",
  adminKdsVisible: false,
  customizingProduct: null
};

const ADMIN_REFRESH_MS = 8000;
let adminRefreshTimer = null;

const loginView = document.getElementById("loginView");
const adminView = document.getElementById("adminView");
const consumerView = document.getElementById("consumerView");
const globalTopbar = document.getElementById("globalTopbar");
const logoutBtn = document.getElementById("logoutBtn");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
const consumerLogoutBtn = document.getElementById("consumerLogoutBtn");
const consumerProfileToggle = document.getElementById("consumerProfileToggle");
const consumerProfileDropdown = document.getElementById("consumerProfileDropdown");
const consumerProfileMenu = document.getElementById("consumerProfileMenu");

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const loginMessage = document.getElementById("loginMessage");
const quickAdminBtn = document.getElementById("quickAdminBtn");
const quickFamilyBtn = document.getElementById("quickFamilyBtn");

const activeRoleLabel = document.getElementById("activeRoleLabel");
const studentsTableBody = document.getElementById("studentsTableBody");
const productsTableBody = document.getElementById("productsTableBody");
const kdsLane = document.getElementById("kdsLane");
const goKdsBtn = document.getElementById("goKdsBtn");
const adminTabs = document.getElementById("adminTabs");
const adminBottomNav = document.getElementById("adminBottomNav");
const adminForecastPanel = document.getElementById("adminForecastPanel");
const adminDelegatesPanel = document.getElementById("adminDelegatesPanel");
const adminCalendarPanel = document.getElementById("adminCalendarPanel");
const adminSettingsPanel = document.getElementById("adminSettingsPanel");
const scheduleForm = document.getElementById("scheduleForm");
const cutoffMorningInput = document.getElementById("cutoffMorning");
const cutoffAfternoonInput = document.getElementById("cutoffAfternoon");
const cutoffNightInput = document.getElementById("cutoffNight");
const graceMinutesInput = document.getElementById("graceMinutes");
const scheduleFormMsg = document.getElementById("scheduleFormMsg");
const adminKdsSection = document.getElementById("adminKdsSection");
const adminProductsSection = document.getElementById("adminProductsSection");
const adminOrdersSection = document.getElementById("adminOrdersSection");
const adminOrdersCards = document.getElementById("adminOrdersCards");
const adminOrdersSearchInput = document.getElementById("adminOrdersSearchInput");
const adminOrdersShiftFilter = document.getElementById("adminOrdersShiftFilter");
const pendingCount = document.getElementById("pendingCount");
const inProgressCount = document.getElementById("inProgressCount");
const adminOrderModal = document.getElementById("adminOrderModal");
const closeAdminOrderModalBtn = document.getElementById("closeAdminOrderModalBtn");
const adminOrderModalTitle = document.getElementById("adminOrderModalTitle");
const adminOrderModalMeta = document.getElementById("adminOrderModalMeta");
const adminOrderModalItems = document.getElementById("adminOrderModalItems");
const adminOrderModalActions = document.getElementById("adminOrderModalActions");
const forecastDate = document.getElementById("forecastDate");
const forecastTotalUnits = document.getElementById("forecastTotalUnits");
const forecastCategories = document.getElementById("forecastCategories");
const productionTableBody = document.getElementById("productionTableBody");
const calendarForecastBtn = document.getElementById("calendarForecastBtn");
const createProductForm = document.getElementById("createProductForm");
const productNameInput = document.getElementById("productNameInput");
const productPriceInput = document.getElementById("productPriceInput");
const productOfficialInput = document.getElementById("productOfficialInput");

const consumerName = document.getElementById("consumerName");
const walletBalance = document.getElementById("walletBalance");
const courseName = document.getElementById("courseName");
const cutoffText = document.getElementById("cutoffText");
const countdown = document.getElementById("countdown");
const allergyTags = document.getElementById("allergyTags");
const allergyCard = document.getElementById("allergyCard");
const categoryNav = document.getElementById("categoryNav");
const productGrid = document.getElementById("productGrid");
const ordersPanel = document.getElementById("ordersPanel");
const ordersList = document.getElementById("ordersList");
const ordersFilterNav = document.getElementById("ordersFilterNav");
const ordersSummary = document.getElementById("ordersSummary");
const ordersListView = document.getElementById("ordersListView");
const ordersDetailView = document.getElementById("ordersDetailView");
const ordersBackBtn = document.getElementById("ordersBackBtn");
const ordersDetailHeading = document.getElementById("ordersDetailHeading");
const ordersDetailMeta = document.getElementById("ordersDetailMeta");
const ordersDetailBodyInline = document.getElementById("ordersDetailBodyInline");
const ordersDetailRepeatBtn = document.getElementById("ordersDetailRepeatBtn");
const ordersDetailCancelBtn = document.getElementById("ordersDetailCancelBtn");
const profilePanel = document.getElementById("profilePanel");
const profileWallet = document.getElementById("profileWallet");
const profileCourse = document.getElementById("profileCourse");
const profileFullName = document.getElementById("profileFullName");
const profilePhone = document.getElementById("profilePhone");
const profileAllergyTags = document.getElementById("profileAllergyTags");
const profilePaymentSummary = document.getElementById("profilePaymentSummary");
const profileFamilyStatus = document.getElementById("profileFamilyStatus");
const profileFamilyWallet = document.getElementById("profileFamilyWallet");
const profileFamilyNote = document.getElementById("profileFamilyNote");
const profileStatsOrders = document.getElementById("profileStatsOrders");
const profileStatsInProgress = document.getElementById("profileStatsInProgress");
const profileStatsSpent = document.getElementById("profileStatsSpent");
const profileLogoutBtn = document.getElementById("profileLogoutBtn");
const mobileShell = document.querySelector(".mobile-shell");
const openCartBtn = document.getElementById("openCartBtn");
const cartModal = document.getElementById("cartModal");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartFeedback = document.getElementById("cartFeedback");
const checkoutBtn = document.getElementById("checkoutBtn");
const customizeModal = document.getElementById("customizeModal");
const nutritionModal = document.getElementById("nutritionModal");
const closeCustomizeBtn = document.getElementById("closeCustomizeBtn");
const closeNutritionBtn = document.getElementById("closeNutritionBtn");
const customizeTitle = document.getElementById("customizeTitle");
const customizePrice = document.getElementById("customizePrice");
const customizePopularTag = document.getElementById("customizePopularTag");
const nutritionDescription = document.getElementById("nutritionDescription");
const customizeProductImage = document.getElementById("customizeProductImage");
const customizeAllergenTags = document.getElementById("customizeAllergenTags");
const customizeKcal = document.getElementById("customizeKcal");
const customizeProtein = document.getElementById("customizeProtein");
const customizeSatFat = document.getElementById("customizeSatFat");
const openNutritionBtn = document.getElementById("openNutritionBtn");
const customizeIngredientsText = document.getElementById("customizeIngredientsText");
const customizeConservationText = document.getElementById("customizeConservationText");
const nutritionKcal = document.getElementById("nutritionKcal");
const nutritionFat = document.getElementById("nutritionFat");
const nutritionCarbs = document.getElementById("nutritionCarbs");
const nutritionSugars = document.getElementById("nutritionSugars");
const nutritionProtein = document.getElementById("nutritionProtein");
const nutritionSalt = document.getElementById("nutritionSalt");
const ingredientOptions = document.getElementById("ingredientOptions");
const kitchenNoteInput = document.getElementById("kitchenNoteInput");
const customizeQtyMinus = document.getElementById("customizeQtyMinus");
const customizeQtyPlus = document.getElementById("customizeQtyPlus");
const customizeQtyValue = document.getElementById("customizeQtyValue");
const confirmCustomizeBtn = document.getElementById("confirmCustomizeBtn");
const historyModal = document.getElementById("historyModal");
const closeHistoryBtn = document.getElementById("closeHistoryBtn");
const historyList = document.getElementById("historyList");
const orderDetailModal = document.getElementById("orderDetailModal");
const closeOrderDetailBtn = document.getElementById("closeOrderDetailBtn");
const orderDetailTitle = document.getElementById("orderDetailTitle");
const orderDetailBody = document.getElementById("orderDetailBody");
const navButtons = Array.from(document.querySelectorAll(".nav-btn"));

// Product Form Modal
const productFormModal = document.getElementById("productFormModal");
const openCreateProductModalBtn = document.getElementById("openCreateProductModalBtn");
const closeProductFormBtn = document.getElementById("closeProductFormBtn");
const productFormElement = document.getElementById("productFormElement");
const productFormTitle = document.getElementById("productFormTitle");
const productFormName = document.getElementById("productFormName");
const productFormDescription = document.getElementById("productFormDescription");
const productFormPrice = document.getElementById("productFormPrice");
const productFormAllergens = document.getElementById("productFormAllergens");
const productFormCancel = document.getElementById("productFormCancel");

let editingProductId = null; // Track if we're editing or creating
let availableAllergens = []; // Store available allergens

function showToast(message, type = "success", duration = 4000) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("exit");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, duration);
}

function buildHeaders() {
  if (!state.session) {
    return { "Content-Type": "application/json" };
  }

  return {
    "Content-Type": "application/json",
    "x-user-role": state.session.user.role,
    "x-user-id": state.session.user.id,
    "x-user-beneficiary": state.session.user.isBeneficiary ? "true" : "false"
  };
}

function hideAllViews() {
  loginView.classList.add("hidden");
  adminView.classList.add("hidden");
  consumerView.classList.add("hidden");
}

function logout() {
  if (adminRefreshTimer) {
    clearInterval(adminRefreshTimer);
    adminRefreshTimer = null;
  }

  state.session = null;
  state.students = [];
  state.kds = [];
  state.adminOrders = [];
  state.products = [];
  state.allergies = [];
  state.myOrders = [];
  state.cart = [];
  state.category = "ALL";
  state.ordersFilter = "ALL";
  state.ordersView = "LIST";
  state.selectedOrderId = null;
  state.selectedOrderDetail = null;
  state.adminSelectedOrderId = null;
  state.adminSelectedOrderDetail = null;
  state.adminOrdersSearch = "";
  state.adminOrdersShift = "ALL";
  state.activeTab = "HOME";
  state.adminTab = "FORECAST";
  state.adminKdsVisible = false;
  hideAllViews();
  loginView.classList.remove("hidden");
  document.body.classList.remove("consumer-mode");
  consumerProfileDropdown?.classList.add("hidden");
  globalTopbar?.classList.remove("hidden");
  logoutBtn.classList.add("hidden");
  loginForm.reset();
}

function startAdminAutoRefresh() {
  if (adminRefreshTimer) {
    clearInterval(adminRefreshTimer);
  }

  let running = false;
  adminRefreshTimer = setInterval(async () => {
    if (!state.session || state.session.user.role !== "ADMIN" || running) {
      return;
    }

    running = true;
    try {
      await loadAdminData();
      renderAdmin();
    } catch (_error) {
      // Ignore transient refresh errors; user can keep working.
    } finally {
      running = false;
    }
  }, ADMIN_REFRESH_MS);
}


function buildProductionSnapshot() {
  const map = new Map();

  state.kds.forEach((order) => {
    (order.items || []).forEach((item) => {
      const key = item.name || "Producto";
      const current = map.get(key) || {
        name: key,
        category: adminProductCategory(key),
        quantity: 0
      };
      current.quantity += Number(item.quantity || 0);
      map.set(key, current);
    });
  });

  const items = Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  const totalsByCategory = {
    Bocadillos: 0,
    Bebidas: 0,
    Snacks: 0,
    Fruta: 0,
    Productos: 0
  };

  items.forEach((item) => {
    totalsByCategory[item.category] = (totalsByCategory[item.category] || 0) + item.quantity;
  });

  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, totalsByCategory, totalUnits };
}

function renderAdminPanels() {
  const showForecast = state.adminTab === "FORECAST";
  const showKds = state.adminTab === "KDS";
  const showProducts = state.adminTab === "PRODUCTS";
  const showOrders = state.adminTab === "ORDERS";

  adminForecastPanel?.classList.toggle("hidden", !showForecast);
  adminDelegatesPanel?.classList.toggle("hidden", state.adminTab !== "DELEGATES");
  adminCalendarPanel?.classList.toggle("hidden", state.adminTab !== "CALENDAR");
  adminSettingsPanel?.classList.toggle("hidden", state.adminTab !== "SETTINGS");
  adminProductsSection?.classList.toggle("hidden", !showProducts);
  adminOrdersSection?.classList.toggle("hidden", !showOrders);
  adminKdsSection?.classList.toggle("hidden", !showKds);

  const tabButtons = Array.from(document.querySelectorAll(".admin-tab"));
  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.adminTab === state.adminTab);
  });

  const mobileTabButtons = Array.from(document.querySelectorAll(".admin-mobile-tab"));
  mobileTabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.adminTab === state.adminTab);
  });
}




function initializeDemoProducts() {
  const demoProducts = [
    {
      id: "prod-001",
      name: "Bocadillo Oficial",
      description: "Menú oficial escolar",
      price: 0.00,
      isActive: true,
      isOfficialMenu: true
    },
    {
      id: "prod-002",
      name: "Croissant",
      description: "Croissant artesanal",
      price: 1.00,
      isActive: true,
      isOfficialMenu: false
    },
    {
      id: "prod-003",
      name: "Sandwich Mixto",
      description: "Producto de cafetería escolar",
      price: 2.90,
      isActive: true,
      isOfficialMenu: false
    },
    {
      id: "prod-004",
      name: "Zumo Naranja",
      description: "Zumo natural 250ml",
      price: 1.20,
      isActive: true,
      isOfficialMenu: false
    }
  ];
  
  state.products = demoProducts;
}

function setDemoUserData() {
  if (state.session && state.session.user) {
    state.session.user.fullName = "Alumno Uno";
    state.session.user.walletBalance = 15.50;
    state.session.user.courseName = "2º ESO A";
    state.session.user.phone = state.session.user.phone || "600123123";
    state.session.user.address = state.session.user.address || "Av. del Instituto, 12 · Vecindario";
    state.session.user.paymentMethods = state.session.user.paymentMethods || ["Monedero Cafetería", "Tarjeta tutora"];
  }
}

async function login(email, password) {
  let response;
  try {
    response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
  } catch (_networkError) {
    throw new Error("Error de conexion. Comprueba tu red e intentalo de nuevo.");
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error("Credenciales invalidas");
  }

  if (!response.ok) {
    let message = "No se pudo iniciar sesion";
    try {
      const payload = await response.json();
      message = payload?.message || message;
    } catch (_) {
      // keep default message
    }
    throw new Error(message);
  }

  state.session = await response.json();
}

async function loadScheduleSettings() {
  try {
    const res = await fetch("/api/admin/settings/schedule", { headers: buildHeaders() });
    if (!res.ok) return;
    const s = await res.json();
    const pad = (n) => String(n).padStart(2, "0");
    if (cutoffMorningInput) cutoffMorningInput.value = `${pad(s.morning.hour)}:${pad(s.morning.minute)}`;
    if (cutoffAfternoonInput) cutoffAfternoonInput.value = `${pad(s.afternoon.hour)}:${pad(s.afternoon.minute)}`;
    if (cutoffNightInput) cutoffNightInput.value = `${pad(s.night.hour)}:${pad(s.night.minute)}`;
    if (graceMinutesInput) graceMinutesInput.value = String(s.graceMinutes);
  } catch (_) { /* ignore */ }
}

async function loadAdminData() {
  let studentsResponse, kdsResponse, productsResponse, ordersResponse;
  try {
    [studentsResponse, kdsResponse, productsResponse, ordersResponse] = await Promise.all([
      fetch("/api/admin/students", { headers: buildHeaders() }),
      fetch("/api/admin/kds", { headers: buildHeaders() }),
      fetch("/api/admin/products", { headers: buildHeaders() }),
      fetch("/api/orders?limit=100", { headers: buildHeaders() })
    ]);
  } catch (_networkError) {
    throw new Error("Error de conexion. No se pudo cargar la informacion de administracion.");
  }

  if (!studentsResponse.ok || !kdsResponse.ok || !productsResponse.ok) {
    throw new Error("No se pudo cargar informacion de administracion");
  }

  const studentsPayload = await studentsResponse.json();
  const kdsPayload = await kdsResponse.json();
  const productsPayload = await productsResponse.json();
  let ordersPayload = { data: [] };

  if (ordersResponse.ok) {
    ordersPayload = await ordersResponse.json();
  } else {
    console.warn("No se pudo cargar historial de pedidos", ordersResponse.status);
  }

  state.students = studentsPayload.data || [];
  state.kds = kdsPayload.data || [];
  state.products = productsPayload.data || [];
  state.adminOrders = ordersPayload.data || [];
}

async function loadConsumerData() {
  let profileResponse, productsResponse, allergiesResponse, ordersResponse;
  try {
    [profileResponse, productsResponse, allergiesResponse, ordersResponse] = await Promise.all([
      fetch("/api/me", { headers: buildHeaders() }),
      fetch("/api/products?limit=100", { headers: buildHeaders() }),
      fetch("/api/me/allergies", { headers: buildHeaders() }),
      fetch("/api/me/orders?limit=20", { headers: buildHeaders() })
    ]);
  } catch (_networkError) {
    throw new Error("Error de conexion. No se pudo cargar la vista principal.");
  }

  if (!profileResponse.ok || !productsResponse.ok || !allergiesResponse.ok || !ordersResponse.ok) {
    throw new Error("No se pudo cargar la vista principal");
  }

  const profile = await profileResponse.json();
  const productsPayload = await productsResponse.json();
  const allergiesPayload = await allergiesResponse.json();
  const ordersPayload = await ordersResponse.json();

  state.session.user = {
    ...state.session.user,
    fullName: profile.fullName,
    walletBalance: profile.walletBalance,
    courseName: profile.courseName,
    phone: profile.phone || state.session.user.phone || "",
    address: profile.address || state.session.user.address || "",
    paymentMethods: profile.paymentMethods || state.session.user.paymentMethods || []
  };

  state.products = productsPayload.data || [];
  state.allergies = allergiesPayload.data || [];
  state.myOrders = ordersPayload.data || [];
}

async function loadOrderDetail(orderId) {
  const response = await fetch(`/api/orders/${orderId}`, { headers: buildHeaders() });

  if (!response.ok) {
    throw new Error("No se pudo cargar detalle del pedido");
  }

  return response.json();
}

function renderAdmin() {
  studentsTableBody.innerHTML = "";
  productsTableBody.innerHTML = "";
  if (adminOrdersCards) {
    adminOrdersCards.innerHTML = "";
  }
  productionTableBody.innerHTML = "";
  forecastCategories.innerHTML = "";

  if (adminOrdersSearchInput && adminOrdersSearchInput.value !== state.adminOrdersSearch) {
    adminOrdersSearchInput.value = state.adminOrdersSearch;
  }

  if (adminOrdersShiftFilter && adminOrdersShiftFilter.value !== state.adminOrdersShift) {
    adminOrdersShiftFilter.value = state.adminOrdersShift;
  }

  activeRoleLabel.textContent = `KOMO - Previsión y Control · ${state.session.user.role}`;

  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  const snapshot = buildProductionSnapshot();
  forecastDate.textContent = today.charAt(0).toUpperCase() + today.slice(1);
  forecastTotalUnits.textContent = `${snapshot.totalUnits} unidades`;

  ["Bocadillos", "Bebidas", "Snacks", "Fruta", "Productos"].forEach((label) => {
    const card = document.createElement("article");
    card.className = "forecast-category-card";
    card.innerHTML = `<p>${label}</p><strong>${snapshot.totalsByCategory[label] || 0}</strong>`;
    forecastCategories.appendChild(card);
  });

  if (snapshot.items.length === 0) {
    productionTableBody.innerHTML = '<tr><td colspan="3" class="muted-inline">Aún no hay pedidos activos para previsión.</td></tr>';
  } else {
    snapshot.items.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(item.name)}</td>
        <td><span class="prod-category-pill">${item.category}</span></td>
        <td><strong>${item.quantity}</strong></td>
      `;
      productionTableBody.appendChild(tr);
    });
  }

  state.students.forEach((student) => {
    const tr = document.createElement("tr");
    const actionText = student.isDelegate ? "Delegado" : "Activar";

    tr.innerHTML = `
      <td>${student.fullName}</td>
      <td>${student.email}</td>
      <td>${student.role}</td>
      <td><button class="action-btn delegate-toggle ${student.isDelegate ? "on" : ""}" data-student-id="${student.id}" data-current="${student.isDelegate}">${actionText}</button></td>
    `;

    studentsTableBody.appendChild(tr);
  });

  state.products.forEach((product) => {
    const tr = document.createElement("tr");
    const statusText = product.isActive ? "ACTIVO" : "INACTIVO";
    const actionText = product.isActive ? "Desactivar" : "Activar";
    const sanitizedName = String(product.name || "")
      .trim()
      .toLowerCase() === "caca"
      ? "Bocadillo de Pechuga a la Plancha"
      : product.name;

    tr.innerHTML = `
      <td><span class="prod-name-value">${escapeHtml(sanitizedName)}</span></td>
      <td><span class="prod-price-value">${money(product.price)}</span></td>
      <td><span class="status ${product.isActive ? "READY" : "INACTIVE"}">${statusText}</span></td>
      <td>
        <div class="action-group">
          <button class="action-btn toggle-product-btn" data-product-id="${product.id}" data-product-active="${product.isActive}" type="button">${actionText}</button>
          <button class="action-btn edit-product-btn edit-inline-btn" data-product-id="${product.id}" type="button" title="Editar">
            <span class="edit-icon">✎</span>
            <span class="edit-label">Editar</span>
          </button>
        </div>
      </td>
    `;

    productsTableBody.appendChild(tr);
  });

  const pending = state.adminOrders.filter((order) => order.status === "PENDING").length;
  const inProgress = state.adminOrders.filter((order) => order.status === "IN_PREPARATION").length;

  if (pendingCount) {
    pendingCount.textContent = String(pending);
  }

  if (inProgressCount) {
    inProgressCount.textContent = String(inProgress);
  }

  const filteredAdminOrders = state.adminOrders.filter((order) => {
    const byShift = state.adminOrdersShift === "ALL" || order.shift === state.adminOrdersShift;
    const query = (state.adminOrdersSearch || "").trim().toLowerCase();

    if (!query) {
      return byShift;
    }

    const searchableText = [order.studentName, order.productSummary, order.shift, order.id]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return byShift && searchableText.includes(query);
  });

  filteredAdminOrders.forEach((order) => {
    const adminActions = buildAdminOrderActions(order);
    const createdAt = order.createdAt ? new Date(order.createdAt) : null;
    const hourText = createdAt
      ? createdAt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
      : "--:--";

    if (!adminOrdersCards) {
      return;
    }

    const card = document.createElement("article");
    card.className = "admin-order-card";
    card.setAttribute("data-order-open", order.id);
    card.innerHTML = `
      <div class="admin-order-card-head">
        <div class="order-time-cell">
          <strong>${hourText}</strong>
          <span>${escapeHtml(formatShiftLabel(order.shift))}</span>
        </div>
        <span class="status soft-badge ${order.status || "PENDING"}">${formatOrderStatus(order.status || "PENDING")}</span>
      </div>
      <div class="admin-order-card-body">
        <p><strong>Alumno:</strong> ${escapeHtml(order.studentName || "Alumno")}</p>
        <p><strong>Producto:</strong> ${escapeHtml(order.productSummary || "-")}</p>
      </div>
      <div class="admin-order-card-foot">
        <strong class="order-total-value">${money(order.total || 0)}</strong>
        <div class="action-group admin-order-actions">${adminActions}</div>
      </div>
    `;
    adminOrdersCards.appendChild(card);
  });

  if (adminOrdersCards && filteredAdminOrders.length === 0) {
    adminOrdersCards.innerHTML = '<div class="empty-cart">No hay pedidos para este filtro.</div>';
  }

  renderAdminPanels();

  renderKdsSmooth(state.kds);
}

function buildKdsCardMarkup(order, index) {
    const itemRows = (order.items || [])
      .map((item) => {
        const customizationBadges = (item.customizations || [])
          .map((entry) => `<span class="kds-tag">${escapeHtml(entry)}</span>`)
          .join("");

        const noteBlock = item.kitchenNote
          ? `<div class="kds-note">Nota: ${escapeHtml(item.kitchenNote)}</div>`
          : "";

        return `
          <li class="kds-item-line">
            <div class="kds-item-main"><span class="kds-qty">${item.quantity}</span><strong>${escapeHtml(item.name)}</strong></div>
            ${customizationBadges ? `<div class="kds-item-meta">${customizationBadges}</div>` : ""}
            ${noteBlock}
          </li>
        `;
      })
      .join("");

    const ticketState = order.status === "READY" ? "ready" : order.status === "IN_PREPARATION" ? "working" : "pending";

    const kdsActions = buildAdminOrderActions(order);

    return {
      ticketState,
      animationDelay: `${Math.min(index * 40, 240)}ms`,
      html: `
      <header class="kds-ticket-head">
        <div>
          <strong>ORD-${order.id.slice(0, 5).toUpperCase()}</strong>
          <p>${order.shift}</p>
        </div>
        <div class="kds-ticket-right">
          <span class="kds-time">${elapsedFrom(order.createdAt)}</span>
          <span class="status soft-badge ${order.status}">${formatOrderStatus(order.status)}</span>
        </div>
      </header>
      <ul class="kds-items">${itemRows || "<li class='kds-item-line'>Sin items</li>"}</ul>
      <div class="kds-actions action-group">${kdsActions}</div>
    `
    };
}

function buildAdminOrderActions(order) {
  const orderId = order?.id;
  const status = order?.status || "PENDING";
  if (!orderId) {
    return "";
  }

  const buttons = [];

  if (status === "PENDING") {
    buttons.push(
      `<button class="icon-action primary admin-order-action" data-order-id="${orderId}" data-next-status="IN_PREPARATION" type="button" title="Pasar a preparación" aria-label="Pasar a preparación">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
      </button>`
    );
    buttons.push(
      `<button class="icon-action ghost-danger admin-order-action" data-order-id="${orderId}" data-next-status="CANCELLED" type="button" title="Cancelar" aria-label="Cancelar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
      </button>`
    );
  }

  if (status === "IN_PREPARATION" || status === "READY") {
    buttons.push(
      `<button class="icon-action primary admin-order-action" data-order-id="${orderId}" data-next-status="DELIVERED" type="button" title="Marcar entregado" aria-label="Marcar entregado">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m20 6-11 11-5-5"></path></svg>
      </button>`
    );
    buttons.push(
      `<button class="icon-action ghost-danger admin-order-action" data-order-id="${orderId}" data-next-status="CANCELLED" type="button" title="Cancelar" aria-label="Cancelar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
      </button>`
    );
  }

  if (buttons.length === 0) {
    return '<span class="muted-inline">-</span>';
  }

  return buttons.join("");
}

function buildAdminOrderModalActions(order) {
  const orderId = order?.id;
  const status = order?.status || "PENDING";
  if (!orderId) {
    return "";
  }

  const actions = [];

  if (status === "PENDING") {
    actions.push('<button class="primary-btn" data-order-id="' + orderId + '" data-next-status="IN_PREPARATION" type="button">Pasar a preparación</button>');
    actions.push('<button class="action-btn danger" data-order-id="' + orderId + '" data-next-status="CANCELLED" type="button">Cancelar</button>');
  }

  if (status === "IN_PREPARATION" || status === "READY") {
    actions.push('<button class="primary-btn" data-order-id="' + orderId + '" data-next-status="DELIVERED" type="button">Marcar entregado</button>');
    actions.push('<button class="action-btn danger" data-order-id="' + orderId + '" data-next-status="CANCELLED" type="button">Cancelar</button>');
  }

  return actions.join("");
}

async function openAdminOrderModal(orderId) {
  const summary = state.adminOrders.find((order) => order.id === orderId);
  if (!summary) {
    return;
  }

  let detail = null;
  try {
    detail = await loadOrderDetail(orderId);
  } catch (_error) {
    detail = {
      ...summary,
      items: []
    };
  }

  state.adminSelectedOrderId = orderId;
  state.adminSelectedOrderDetail = detail;
  renderAdminOrderModal(summary, detail);
  adminOrderModal?.classList.remove("hidden");
}

function renderAdminOrderModal(summary, detail) {
  if (!adminOrderModalTitle || !adminOrderModalMeta || !adminOrderModalItems || !adminOrderModalActions) {
    return;
  }

  adminOrderModalTitle.textContent = `Pedido #${String(summary.id || "").slice(0, 8).toUpperCase()}`;
  adminOrderModalMeta.innerHTML = `
    <div class="detail-line"><span>Alumno</span><strong>${escapeHtml(summary.studentName || "Alumno")}</strong></div>
    <div class="detail-line"><span>Turno</span><strong>${escapeHtml(formatShiftLabel(summary.shift))}</strong></div>
    <div class="detail-line"><span>Estado</span><span class="status soft-badge ${summary.status}">${formatOrderStatus(summary.status)}</span></div>
    <div class="detail-line"><span>Total</span><strong>${money(summary.total || 0)}</strong></div>
  `;

  const itemLines = (detail?.items || [])
    .map((item) => {
      const qty = Number(item.quantity || 1);
      const name = escapeHtml(item.name || "Producto");
      const customizations = Array.isArray(item.customizations) && item.customizations.length > 0
        ? `<p class="muted-inline">${escapeHtml(item.customizations.join(", "))}</p>`
        : "";
      const note = item.kitchenNote ? `<p class="muted-inline">Nota: ${escapeHtml(item.kitchenNote)}</p>` : "";

      return `
        <div class="detail-line">
          <div>
            <strong>${qty}x ${name}</strong>
            ${customizations}
            ${note}
          </div>
          <strong>${money(item.lineTotal || 0)}</strong>
        </div>
      `;
    })
    .join("");

  adminOrderModalItems.innerHTML = itemLines || '<div class="empty-cart">No hay detalle de items para este pedido.</div>';
  adminOrderModalActions.innerHTML = buildAdminOrderModalActions(summary);
}

function closeAdminOrderModal() {
  adminOrderModal?.classList.add("hidden");
  state.adminSelectedOrderId = null;
  state.adminSelectedOrderDetail = null;
}

function renderKdsSmooth(orders) {
  if (!kdsLane) {
    return;
  }

  if (!orders || orders.length === 0) {
    kdsLane.innerHTML = '<div class="kds-empty">Sin pedidos en cocina.</div>';
    return;
  }

  const currentCards = Array.from(kdsLane.querySelectorAll(".kds-ticket"));
  const existingMap = new Map(currentCards.map((card) => [card.getAttribute("data-order-id"), card]));
  const seenIds = new Set();

  orders.forEach((order, index) => {
    const orderId = String(order.id);
    const hash = `${order.status}|${(order.items || [])
      .map((item) => `${item.name}:${item.quantity}:${(item.customizations || []).join(",")}:${item.kitchenNote || ""}`)
      .join(";")}`;
    const existingCard = existingMap.get(orderId);
    const next = buildKdsCardMarkup(order, index);
    seenIds.add(orderId);

    if (existingCard) {
      if (existingCard.getAttribute("data-hash") !== hash) {
        existingCard.className = `kds-ticket ${next.ticketState}`;
        existingCard.innerHTML = next.html;
        existingCard.setAttribute("data-hash", hash);
      }
      return;
    }

    const card = document.createElement("article");
    card.className = `kds-ticket ${next.ticketState}`;
    card.style.animationDelay = next.animationDelay;
    card.setAttribute("data-order-id", orderId);
    card.setAttribute("data-hash", hash);
    card.innerHTML = next.html;
    kdsLane.appendChild(card);
  });

  existingMap.forEach((card, orderId) => {
    if (!seenIds.has(orderId)) {
      card.remove();
    }
  });
}

function getFilteredProducts() {
  if (state.category === "ALL") {
    return state.products;
  }

  return state.products.filter((product) => productCategory(product) === state.category);
}

function getFilteredOrders() {
  if (state.ordersFilter === "ALL") {
    return state.myOrders;
  }

  if (state.ordersFilter === "IN_PROGRESS") {
    return state.myOrders.filter((order) => ["PENDING", "IN_PREPARATION"].includes(order.status));
  }

  if (state.ordersFilter === "DONE") {
    return state.myOrders.filter((order) => ["READY", "DELIVERED", "COMPLETED"].includes(order.status));
  }

  if (state.ordersFilter === "CANCELLED") {
    return state.myOrders.filter((order) => order.status === "CANCELLED");
  }

  return state.myOrders;
}

function isCancellableStatus(status) {
  return ["PENDING", "IN_PREPARATION"].includes(status);
}



function setOrdersView(view) {
  const showDetail = view === "DETAIL";
  ordersListView?.classList.toggle("hidden", showDetail);
  ordersDetailView?.classList.toggle("hidden", !showDetail);
}

function renderOrderDetailScreen(detail, orderSummary) {
  if (!ordersDetailHeading || !ordersDetailMeta || !ordersDetailBodyInline) {
    return;
  }

  const orderId = detail.id || orderSummary?.id || "";
  const status = detail.status || orderSummary?.status || "PENDING";
  const shift = detail.shift || orderSummary?.shift || "TURNO";
  const createdAt = detail.createdAt || orderSummary?.createdAt;
  const total = detail.total ?? orderSummary?.total ?? 0;
  const createdText = createdAt ? new Date(createdAt).toLocaleString() : "Sin fecha";

  // Feedback visual y motivo de cancelación
  if (status === "CANCELLED") {
    ordersDetailHeading.innerHTML = `<span style="color:#E53935;display:flex;align-items:center;gap:8px"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E53935" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Cancelado</span>`;
    let motivo = detail.cancelReason || detail.cancel_reason || "Pedido cancelado por el usuario o la administración.";
    ordersDetailMeta.innerHTML = `<span style="color:#E53935">${motivo}</span><br><span class="muted-inline">${shift} · ${createdText}</span>`;
  } else {
    ordersDetailHeading.textContent = `Pedido #${String(orderId).slice(0, 8).toUpperCase()}`;
    ordersDetailMeta.textContent = `${shift} · ${createdText}`;
  }

  const itemLines = (detail.items || [])
    .map((item) => {
      const customizations = (item.customizations || []).join(", ");
      const note = item.kitchenNote ? ` · Nota: ${escapeHtml(item.kitchenNote)}` : "";

      return `
        <div class="detail-line">
          <div>
            <strong>${Number(item.quantity || 1)}x ${escapeHtml(item.name || "Producto")}</strong>
            <p class="muted-inline">${escapeHtml(item.description || "")}</p>
            <p class="muted-inline">${escapeHtml(customizations)}${note}</p>
          </div>
          <strong>${money(item.lineTotal || item.price || 0)}</strong>
        </div>
      `;
    })
    .join("");

  ordersDetailBodyInline.innerHTML = `
    <div class="detail-box">
      <div class="detail-line"><span>Estado</span><span class="status-pill ${status}">${formatOrderStatus(status)}</span></div>
      <div class="detail-line"><span>Turno</span><strong>${shift}</strong></div>
      <div class="detail-line"><span>Total</span><strong>${money(total)}</strong></div>
    </div>
    <div class="detail-box">${itemLines || '<div class="empty-cart">Sin items en este pedido.</div>'}</div>
  `;

  if (ordersDetailRepeatBtn) {
    ordersDetailRepeatBtn.dataset.orderId = orderId;
  }

  // Eliminar botón cancelar completamente
  if (ordersDetailCancelBtn) {
    ordersDetailCancelBtn.classList.add("hidden");
  }

  setOrdersView("DETAIL");
}

async function openOrderDetailScreen(orderId) {
  const summary = state.myOrders.find((order) => order.id === orderId);
  let detail;

  try {
    detail = await loadOrderDetail(orderId);
  } catch (_error) {
    detail = summary || { id: orderId, status: "PENDING", items: [] };
  }

  state.ordersView = "DETAIL";
  state.selectedOrderId = orderId;
  state.selectedOrderDetail = detail;
  renderOrderDetailScreen(detail, summary);
}

function renderOrdersManager() {
  if (!ordersPanel || !ordersList || !ordersSummary) {
    return;
  }

  const total = state.myOrders.length;
  const inProgress = state.myOrders.filter((order) => ["PENDING", "IN_PREPARATION"].includes(order.status)).length;
  const filtered = getFilteredOrders();

  ordersSummary.textContent = `${total} pedidos · ${inProgress} en curso`;

  if (ordersFilterNav) {
    Array.from(ordersFilterNav.querySelectorAll(".chip")).forEach((button) => {
      button.classList.toggle("active", button.dataset.orderFilter === state.ordersFilter);
    });
  }

  ordersList.innerHTML = "";

  if (filtered.length === 0) {
    ordersList.innerHTML = '<div class="empty-cart">No hay pedidos en este filtro.</div>';
    return;
  }

  filtered.forEach((order) => {
    const card = document.createElement("article");
    card.className = "order-manager-card";
    const dateStr = new Date(order.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });

    card.innerHTML = `
      <div class="order-card-summary-row" data-order-action="detail" data-order-id="${order.id}">
        <div class="order-card-left">
          <span class="order-card-id">#${order.id.slice(0, 8).toUpperCase()}</span>
          <p class="order-card-date">${formatShiftLabel(order.shift)} · ${dateStr}</p>
        </div>
        <div class="order-card-center">
          <span class="status-pill ${order.status}">${formatOrderStatus(order.status)}</span>
        </div>
        <div class="order-card-right">
          <strong>${money(order.total)}</strong>
          <span class="order-card-arrow">›</span>
        </div>
      </div>
    `;

    ordersList.appendChild(card);
  });
}

async function repeatOrder(orderId) {
  let detail;

  try {
    detail = await loadOrderDetail(orderId);
  } catch (_error) {
    const fallback = state.myOrders.find((order) => order.id === orderId);
    detail = fallback || { items: [] };
  }

  const lines = detail.items || [];
  if (lines.length === 0) {
    showToast("No se pudo repetir: el pedido no tiene items disponibles.", "error");
    return;
  }

  lines.forEach((item) => {
    const knownProduct = state.products.find((product) => product.id === item.productId) ||
      state.products.find((product) => product.name === item.name);

    if (!knownProduct) {
      return;
    }

    const selectedOptions = item.customizations || [];
    const note = item.kitchenNote || "";
    const signature = `${knownProduct.id}::${selectedOptions.join("|")}::${note}`;
    const existing = state.cart.find((line) => line.signature === signature);
    const qty = Number(item.quantity || 1);

    if (existing) {
      existing.qty += qty;
      return;
    }

    state.cart.push({
      id: knownProduct.id,
      signature,
      name: knownProduct.name,
      price: Number(knownProduct.price),
      qty,
      options: selectedOptions,
      note
    });
  });

  renderCart();
  showToast("Pedido añadido al carrito");
}

async function cancelOrder(orderId) {
  const order = state.myOrders.find((entry) => entry.id === orderId);
  if (!order || !isCancellableStatus(order.status)) {
    return;
  }

  try {
    await fetch(`/api/orders/${orderId}/cancel`, {
      method: "PATCH",
      headers: buildHeaders()
    });
  } catch (_error) {
    // Keep optimistic local update even if backend endpoint is unavailable.
  }

  order.status = "CANCELLED";

  if (state.selectedOrderId === orderId && state.selectedOrderDetail) {
    state.selectedOrderDetail.status = "CANCELLED";
  }

  renderConsumerHome();
}

async function updateAdminOrderStatus(orderId, nextStatus) {
  const response = await fetch(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    headers: buildHeaders(),
    body: JSON.stringify({ status: nextStatus })
  });

  if (!response.ok) {
    let message = "No se pudo actualizar el pedido";
    try {
      const payload = await response.json();
      message = payload?.message || message;
    } catch (_error) {
      // ignore JSON parse failures
    }
    throw new Error(message);
  }

  await loadAdminData();
  renderAdmin();

  if (state.adminSelectedOrderId === orderId) {
    const updated = state.adminOrders.find((entry) => entry.id === orderId);
    if (updated) {
      const detail = state.adminSelectedOrderDetail || { items: [] };
      detail.status = updated.status;
      renderAdminOrderModal(updated, detail);
    }
  }
}

function renderConsumerHome() {
  consumerName.textContent = "CafeApp";
  walletBalance.textContent = money(state.session.user.walletBalance || 0);
  courseName.textContent = state.session.user.courseName || "Curso sin asignar";

  cutoffText.classList.remove("hidden");
  cutoffText.textContent = "Cierre a las 09:05";
  const countdownVal = computeCutoffCountdown();
  countdown.classList.remove("hidden");
  countdown.textContent = countdownVal;
  const isUrgent = /^0h\s*[0-9]m|^0h\s*[01][0-9]m/.test(countdownVal);
  countdown.classList.toggle("urgent", isUrgent);

  const renderTags = (container) => {
    if (!container) {
      return;
    }

    container.innerHTML = "";

    if (state.allergies.length === 0) {
      const empty = document.createElement("span");
      empty.className = "muted-inline";
      empty.textContent = "Sin alérgenos registrados.";
      container.appendChild(empty);
      return;
    }

    state.allergies.forEach((allergy) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = allergy.name;
      container.appendChild(span);
    });
  };

  renderTags(allergyTags);
  renderTags(profileAllergyTags);

  if (profileWallet) {
    profileWallet.textContent = money(state.session.user.walletBalance || 0);
  }

  if (profileCourse) {
    profileCourse.textContent = state.session.user.courseName || "Curso sin asignar";
  }

  if (profileFullName) {
    profileFullName.textContent = state.session.user.fullName || "Alumno";
  }

  if (profilePhone) {
    profilePhone.textContent = state.session.user.phone || "No disponible";
  }

  if (profilePaymentSummary) {
    const methods = state.session.user.paymentMethods || [];
    profilePaymentSummary.textContent = methods.length === 0 ? "No configurado" : methods[0];
  }

  if (profileFamilyStatus || profileFamilyWallet || profileFamilyNote) {
    const linkedFamily = Boolean(state.session.user.parentUserId || state.session.user.familyLinked);

    if (profileFamilyStatus) {
      profileFamilyStatus.textContent = linkedFamily ? "Vinculado" : "Sin vincular";
    }
    if (profileFamilyWallet) {
      profileFamilyWallet.textContent = money(state.session.user.walletBalance || 0);
    }
    if (profileFamilyNote) {
      profileFamilyNote.textContent = linkedFamily
        ? "Tu cuenta familiar puede aprobar pedidos y recargar saldo."
        : "Vincula una cuenta familiar para gestionar recargas y aprobaciones.";
    }
  }

  const totalOrders = state.myOrders.length;
  const inProgressOrders = state.myOrders.filter((order) => ["PENDING", "IN_PREPARATION"].includes(order.status)).length;
  const totalSpent = state.myOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  if (profileStatsOrders) {
    profileStatsOrders.textContent = String(totalOrders);
  }

  if (profileStatsInProgress) {
    profileStatsInProgress.textContent = String(inProgressOrders);
  }

  if (profileStatsSpent) {
    profileStatsSpent.textContent = money(totalSpent);
  }

  const viewingOrders = state.activeTab === "ORDERS";
  const viewingProfile = state.activeTab === "PROFILE";

  allergyCard.classList.toggle("hidden", viewingOrders || viewingProfile || state.allergies.length === 0);
  categoryNav.classList.toggle("hidden", viewingOrders || viewingProfile);
  productGrid.classList.toggle("hidden", viewingOrders || viewingProfile);
  ordersPanel.classList.toggle("hidden", !viewingOrders);
  profilePanel?.classList.toggle("hidden", !viewingProfile);

  if (!viewingOrders && !viewingProfile) {
    productGrid.innerHTML = "";
    const visibleProducts = getFilteredProducts();
    if (visibleProducts.length === 0) {
      productGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <span class="empty-state-icon">🍽️</span>
        <p>No hay productos disponibles en este turno</p>
      </div>`;
    } else {
      visibleProducts.forEach((product) => {
        const card = document.createElement("article");
        card.className = "product-card";
        card.dataset.productId = product.id;
        card.innerHTML = `
          <div class="product-cover" style="background-image:url('${getProductImage(product)}')">
            <span class="product-badge">Popular</span>
          </div>
          <div class="product-body">
            <h4>${product.name}</h4>
            <p>${product.description || "Producto de cafeteria escolar"}</p>
            <div class="price-row">
              <strong class="price">${money(product.price)}</strong>
              <button class="circle-btn" type="button" aria-label="Personalizar y anadir">+</button>
            </div>
          </div>
        `;
        productGrid.appendChild(card);
      });
    }
  }

  if (viewingOrders) {
    if (state.ordersView === "DETAIL" && state.selectedOrderDetail) {
      const summary = state.myOrders.find((order) => order.id === state.selectedOrderId);
      renderOrderDetailScreen(state.selectedOrderDetail, summary);
    } else {
      state.ordersView = "LIST";
      setOrdersView("LIST");
      renderOrdersManager();
    }
  }

  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === state.activeTab);
  });

}

function renderHistory() {
  historyList.innerHTML = "";

  if (state.myOrders.length === 0) {
    historyList.innerHTML = '<div class="empty-cart">Aun no tienes pedidos.</div>';
    return;
  }

  state.myOrders.forEach((order) => {
    const card = document.createElement("article");
    card.className = "history-card";

    card.innerHTML = `
      <div class="history-card-top">
        <strong>#${order.id.slice(0, 8).toUpperCase()}</strong>
        <strong>${money(order.total)}</strong>
      </div>
      <p class="muted-inline">${order.shift} · ${new Date(order.createdAt).toLocaleString()}</p>
      <div class="history-card-top">
        <span class="status-pill ${order.status}">${order.status}</span>
        <button class="action-btn" data-history-id="${order.id}">Ver detalle</button>
      </div>
    `;

    historyList.appendChild(card);
  });
}

function renderOrderDetail(detail) {
  orderDetailTitle.textContent = `Pedido #${detail.id.slice(0, 8).toUpperCase()}`;

  const itemLines = (detail.items || [])
    .map(
      (item) => `
      <div class="detail-line">
        <div>
          <strong>${item.quantity}x ${item.name || "Producto"}</strong>
          <p class="muted-inline">${item.description || ""}</p>
          <p class="muted-inline">${(item.customizations || []).join(", ")}${
            item.kitchenNote ? ` · Nota: ${item.kitchenNote}` : ""
          }</p>
        </div>
        <strong>${money(item.lineTotal || 0)}</strong>
      </div>
    `
    )
    .join("");

  orderDetailBody.innerHTML = `
    <div class="detail-box">
      <div class="detail-line"><span>Fecha</span><strong>${detail.scheduledFor}</strong></div>
      <div class="detail-line"><span>Turno</span><strong>${detail.shift}</strong></div>
      <div class="detail-line"><span>Estado</span><span class="status-pill ${detail.status}">${detail.status}</span></div>
    </div>
    <div class="detail-box">${itemLines || '<div class="empty-cart">Sin items</div>'}</div>
    <div class="detail-box">
      <div class="detail-line"><span>Total</span><strong>${money(detail.total || 0)}</strong></div>
    </div>
  `;
}

function openCustomize(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) {
    return;
  }

  const sanitary = resolveSanitaryInfo(product.name);

  state.customizingProduct = product;
  customizeTitle.textContent = `Personalizar ${product.name}`;
  if (nutritionDescription) {
    nutritionDescription.textContent = product.description || "Sin descripcion adicional del producto.";
  }
  if (customizePrice) {
    customizePrice.textContent = money(product.price || 0);
  }
  if (customizePopularTag) {
    customizePopularTag.classList.toggle("hidden", !product.isOfficialMenu);
  }

  if (customizeAllergenTags) {
    customizeAllergenTags.innerHTML = "";
    (sanitary.alergenos || []).forEach((allergen) => {
      const visual = allergenVisual(allergen);
      const item = document.createElement("div");
      item.className = "allergen-dot-item";

      const dot = document.createElement("span");
      dot.className = "allergen-dot";
      dot.style.backgroundColor = visual.color;
      dot.setAttribute("aria-hidden", "true");
      dot.textContent = visual.icon;

      const label = document.createElement("span");
      label.className = "allergen-label";
      label.textContent = visual.label;

      item.appendChild(dot);
      item.appendChild(label);
      customizeAllergenTags.appendChild(item);
    });
  }

  if (customizeKcal) {
    customizeKcal.textContent = formatNutrition(sanitary.nutricion?.kcal, "kcal", 0);
  }
  if (customizeProtein) {
    customizeProtein.textContent = formatNutrition(sanitary.nutricion?.proteinas, "g");
  }
  if (customizeSatFat) {
    customizeSatFat.textContent = formatNutrition(sanitary.nutricion?.grasasSaturadas, "g");
  }

  if (customizeIngredientsText) {
    customizeIngredientsText.textContent = sanitary.ingredientes;
  }
  if (customizeConservationText) {
    customizeConservationText.textContent = `${sanitary.conservacion}. ${sanitary.caducidad}.`;
  }

  if (nutritionKcal) {
    nutritionKcal.textContent = formatNutrition(sanitary.nutricion?.kcal, "kcal", 0);
  }
  if (nutritionFat) {
    nutritionFat.textContent = formatNutrition(sanitary.nutricion?.grasas, "g");
  }
  if (nutritionCarbs) {
    nutritionCarbs.textContent = formatNutrition(sanitary.nutricion?.hidratos, "g");
  }
  if (nutritionSugars) {
    nutritionSugars.textContent = formatNutrition(sanitary.nutricion?.azucares, "g");
  }
  if (nutritionProtein) {
    nutritionProtein.textContent = formatNutrition(sanitary.nutricion?.proteinas, "g");
  }
  if (nutritionSalt) {
    nutritionSalt.textContent = formatNutrition(sanitary.nutricion?.sal, "g");
  }

  if (customizeProductImage instanceof HTMLImageElement) {
    const remoteSrc = getProductImage(product);
    const fallbackSrc = getProductImageFallback(product);

    customizeProductImage.onerror = () => {
      if (customizeProductImage.src !== fallbackSrc) {
        customizeProductImage.src = fallbackSrc;
      }
    };

    customizeProductImage.src = remoteSrc;
    customizeProductImage.alt = product.name;
  }
  kitchenNoteInput.value = "";
  if (customizeQtyValue) {
    customizeQtyValue.textContent = "1";
  }
  ingredientOptions.innerHTML = "";

  ingredientPreset(product).forEach((option, index) => {
    const id = `opt-${index}`;
    const row = document.createElement("label");
    row.className = "option-row";
    row.innerHTML = `<span class="option-label">${option}</span><input type="checkbox" value="${option}" id="${id}" /><span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>`;
    ingredientOptions.appendChild(row);
  });

  const customizeContent = customizeModal?.querySelector(".customize-content");
  if (customizeContent) {
    customizeContent.scrollTop = 0;
  }

  customizeModal.classList.remove("hidden");
}

function addCustomizedToCart() {
  if (!state.customizingProduct) {
    return;
  }

  const selectedQty = Math.max(1, Number(customizeQtyValue?.textContent || "1"));

  const selectedOptions = Array.from(ingredientOptions.querySelectorAll("input[type='checkbox']:checked")).map(
    (input) => input.value
  );
  const note = kitchenNoteInput.value.trim();

  const signature = `${state.customizingProduct.id}::${selectedOptions.join("|")}::${note}`;
  const existing = state.cart.find((line) => line.signature === signature);

  if (existing) {
    existing.qty += selectedQty;
  } else {
    state.cart.push({
      id: state.customizingProduct.id,
      signature,
      name: state.customizingProduct.name,
      price: Number(state.customizingProduct.price),
      qty: selectedQty,
      options: selectedOptions,
      note
    });
  }

  renderCart();
  customizeModal.classList.add("hidden");
}

function renderCart() {
  cartItems.innerHTML = "";

  if (state.cart.length === 0) {
    cartItems.innerHTML = '<div class="empty-cart">Tu carrito está vacío</div>';
    cartTotal.textContent = money(0);
    return;
  }

  let total = 0;

  state.cart.forEach((line) => {
    total += line.price * line.qty;
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div>
        <strong>${line.name}</strong>
        <p>${money(line.price)}</p>
        <p class="muted-inline">${(line.options || []).join(", ")}${line.note ? ` · Nota: ${line.note}` : ""}</p>
      </div>
      <div class="qty-wrap">
        <button class="qty-btn" data-minus="${line.signature}" type="button">-</button>
        <span>${line.qty}</span>
        <button class="qty-btn" data-plus="${line.signature}" type="button">+</button>
      </div>
    `;

    cartItems.appendChild(row);
  });

  cartTotal.textContent = money(total);
}

function updateQty(signature, delta) {
  const line = state.cart.find((item) => item.signature === signature);
  if (!line) {
    return;
  }

  line.qty += delta;
  if (line.qty <= 0) {
    state.cart = state.cart.filter((item) => item.signature !== signature);
  }

  renderCart();
}

async function checkoutCart() {
  if (state.cart.length === 0) {
    throw new Error("Tu carrito esta vacio");
  }

  const payload = {
    shift: "MORNING",
    scheduledFor: new Date().toISOString().slice(0, 10),
    items: state.cart.map((line) => ({
      productId: line.id,
      quantity: line.qty,
      customizations: line.options || [],
      kitchenNote: line.note || undefined
    }))
  };

  const response = await fetch("/api/orders", {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let apiMessage = "No se pudo crear el pedido";
    try {
      const errorPayload = await response.json();
      apiMessage = errorPayload.message || apiMessage;
    } catch (_error) {
      // Keep default message when response body is not JSON.
    }
    throw new Error(apiMessage);
  }

  state.cart = [];
  await loadConsumerData();
  renderConsumerHome();
  renderCart();
  cartModal.classList.add("hidden");
}

async function setDelegate(studentId, current) {
  const response = await fetch(`/api/admin/students/${studentId}/delegate`, {
    method: "PATCH",
    headers: buildHeaders(),
    body: JSON.stringify({ isDelegate: !current })
  });

  if (!response.ok) {
    throw new Error("No se pudo actualizar delegado");
  }
}

async function createProduct() {
  const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      name: productNameInput.value,
      price: Number(productPriceInput.value),
      isOfficialMenu: productOfficialInput.checked,
      isActive: true
    })
  });

  if (!response.ok) {
    throw new Error("No se pudo crear producto");
  }
}

async function toggleProduct(productId, current) {
  const response = await fetch(`/api/admin/products/${productId}`, {
    method: "PATCH",
    headers: buildHeaders(),
    body: JSON.stringify({ isActive: !current })
  });

  if (!response.ok) {
    throw new Error("No se pudo actualizar producto");
  }
}

async function handlePostLogin() {
  hideAllViews();
  globalTopbar?.classList.add("hidden");
  logoutBtn.classList.remove("hidden");
  document.body.classList.remove("consumer-mode");

  if (state.session.user.role === "ADMIN") {
    adminView.classList.remove("hidden");
    forecastCategories.innerHTML = '<div class="skeleton-spinner-wrap"><div class="skeleton-spinner"></div></div>';
    await loadAdminData();
    renderAdmin();
    startAdminAutoRefresh();
    return;
  }

  consumerView.classList.remove("hidden");
  document.body.classList.add("consumer-mode");
  productGrid.innerHTML = Array.from({ length: 4 }).map(() =>
    `<article class="product-card skeleton-card">
      <div class="skeleton-cover"></div>
      <div class="product-body">
        <div class="skeleton-line long"></div>
        <div class="skeleton-line short"></div>
      </div>
    </article>`
  ).join("");
  await loadConsumerData();
  
  renderConsumerHome();
  renderHistory();
  renderCart();
}

async function quickLogin(email) {
  loginMessage.textContent = "";
  emailInput.value = email;
  passwordInput.value = "demo";
  const btns = [quickAdminBtn, quickFamilyBtn];
  btns.forEach((btn) => { if (btn) btn.disabled = true; });

  try {
    await login(emailInput.value, passwordInput.value);
    await handlePostLogin();
  } catch (error) {
    loginMessage.textContent = error.message || "No se pudo iniciar sesion";
    btns.forEach((btn) => { if (btn) btn.disabled = false; });
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";
  const submitBtn = loginForm.querySelector("button[type='submit']");
  const originalText = submitBtn?.textContent || "Entrar";
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Entrando..."; }

  try {
    await login(emailInput.value, passwordInput.value);
    await handlePostLogin();
  } catch (error) {
    loginMessage.textContent = error.message || "No se pudo iniciar sesion";
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
  }
});

quickAdminBtn?.addEventListener("click", async () => {
  await quickLogin("admin1@cafes.app");
});

quickFamilyBtn?.addEventListener("click", async () => {
  await quickLogin("student1@cafes.app");
});

consumerProfileToggle?.addEventListener("click", () => {
  consumerProfileDropdown?.classList.toggle("hidden");
});

document.addEventListener("click", (event) => {
  if (!consumerProfileMenu || !consumerProfileDropdown) {
    return;
  }

  if (!consumerProfileMenu.contains(event.target)) {
    consumerProfileDropdown.classList.add("hidden");
  }
});

adminTabs?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const nextTab = target.dataset.adminTab;
  if (!nextTab) {
    return;
  }

  state.adminTab = nextTab;

  if (nextTab === "SETTINGS") {
    loadScheduleSettings();
  }

  renderAdminPanels();
});

scheduleForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (scheduleFormMsg) {
    scheduleFormMsg.textContent = "";
    scheduleFormMsg.className = "schedule-msg";
  }
  try {
    const res = await fetch("/api/admin/settings/schedule", {
      method: "PATCH",
      headers: { ...buildHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        morning: cutoffMorningInput?.value,
        afternoon: cutoffAfternoonInput?.value,
        night: cutoffNightInput?.value,
        graceMinutes: Number(graceMinutesInput?.value)
      })
    });
    if (!res.ok) {
      const payload = await res.json();
      throw new Error(payload.message || "Error al guardar");
    }
    if (scheduleFormMsg) scheduleFormMsg.textContent = "✓ Horarios guardados";
  } catch (err) {
    if (scheduleFormMsg) {
      scheduleFormMsg.className = "schedule-msg error";
      scheduleFormMsg.textContent = err instanceof Error ? err.message : "No se pudo guardar";
    }
  }
});

adminBottomNav?.addEventListener("click", (event) => {
  const rawTarget = event.target;
  const target = rawTarget instanceof Element ? rawTarget.closest("button") : null;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const nextTab = target.dataset.adminTab;
  if (!nextTab) {
    return;
  }

  state.adminTab = nextTab;
  renderAdminPanels();
});

adminOrdersSearchInput?.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  state.adminOrdersSearch = target.value || "";
  renderAdmin();
});

adminOrdersShiftFilter?.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) {
    return;
  }

  state.adminOrdersShift = target.value || "ALL";
  renderAdmin();
});

goKdsBtn?.addEventListener("click", () => {
  state.adminTab = "KDS";
  renderAdminPanels();
  document.getElementById("adminKdsSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

calendarForecastBtn?.addEventListener("click", () => {
  state.adminTab = "FORECAST";
  renderAdminPanels();
});

studentsTableBody.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const studentId = target.dataset.studentId;
  const current = target.dataset.current === "true";
  if (!studentId) {
    return;
  }

  try {
    await setDelegate(studentId, current);
    await loadAdminData();
    renderAdmin();
  } catch (error) {
    showToast(error.message || "No se pudo actualizar delegado", "error");
  }
});

productsTableBody.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const productId = target.dataset.productId;
  if (!productId) {
    return;
  }

  // Handle edit button
  if (target.classList.contains("edit-product-btn")) {
    const product = state.products.find((p) => p.id === productId);
    if (product) {
      openProductFormModal(product);
    }
    return;
  }

  // Handle toggle active/inactive
  if (target.classList.contains("toggle-product-btn")) {
    const current = target.dataset.productActive === "true";
    try {
      await toggleProduct(productId, current);
      await loadAdminData();
      renderAdmin();
    } catch (error) {
      showToast(error.message || "No se pudo actualizar producto", "error");
    }
  }
});

adminOrdersCards?.addEventListener("click", async (event) => {
  const rawTarget = event.target;
  const target = rawTarget instanceof Element ? rawTarget.closest(".admin-order-action") : null;
  if (target instanceof HTMLButtonElement) {
    const orderId = target.dataset.orderId;
    const nextStatus = target.dataset.nextStatus;
    if (!orderId || !nextStatus) {
      return;
    }

    try {
      await updateAdminOrderStatus(orderId, nextStatus);
    } catch (error) {
      showToast(error.message || "No se pudo actualizar estado", "error");
    }
    return;
  }

  const openTarget = rawTarget instanceof Element ? rawTarget.closest("[data-order-open]") : null;
  if (openTarget instanceof HTMLElement) {
    const orderId = openTarget.dataset.orderOpen;
    if (orderId) {
      await openAdminOrderModal(orderId);
    }
  }
});

kdsLane?.addEventListener("click", async (event) => {
  const rawTarget = event.target;
  const target = rawTarget instanceof Element ? rawTarget.closest(".admin-order-action") : null;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const orderId = target.dataset.orderId;
  const nextStatus = target.dataset.nextStatus;
  if (!orderId || !nextStatus) {
    return;
  }

  try {
    await updateAdminOrderStatus(orderId, nextStatus);
  } catch (error) {
    showToast(error.message || "No se pudo actualizar estado", "error");
  }
});

adminOrderModalActions?.addEventListener("click", async (event) => {
  const rawTarget = event.target;
  const target = rawTarget instanceof Element ? rawTarget.closest("button[data-next-status]") : null;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const orderId = target.dataset.orderId;
  const nextStatus = target.dataset.nextStatus;
  if (!orderId || !nextStatus) {
    return;
  }

  try {
    await updateAdminOrderStatus(orderId, nextStatus);
  } catch (error) {
    showToast(error.message || "No se pudo actualizar estado", "error");
  }
});

closeAdminOrderModalBtn?.addEventListener("click", () => {
  closeAdminOrderModal();
});

adminOrderModal?.addEventListener("click", (event) => {
  if (event.target === adminOrderModal) {
    closeAdminOrderModal();
  }
});

// Product form modal handlers
openCreateProductModalBtn?.addEventListener("click", () => {
  openProductFormModal();
});

closeProductFormBtn?.addEventListener("click", () => {
  closeProductFormModal();
});

productFormCancel?.addEventListener("click", () => {
  closeProductFormModal();
});

productFormElement?.addEventListener("submit", async (event) => {
  event.preventDefault();
  
  try {
    // Get selected allergens from pills
    const selectedAllergenButtons = Array.from(document.querySelectorAll('.allergen-pill.selected'));
    const selectedAllergenIds = selectedAllergenButtons.map((btn) => btn.dataset.allergenId);

    const formData = {
      name: productFormName.value.trim(),
      description: productFormDescription.value.trim(),
      price: parseFloat(productFormPrice.value),
      allergens: selectedAllergenIds
    };

    if (!formData.name || isNaN(formData.price)) {
      throw new Error("Nombre y precio son requeridos");
    }

    if (editingProductId) {
      // Update existing product
      await fetch(`/api/admin/products/${editingProductId}`, {
        method: "PATCH",
        headers: buildHeaders("application/json"),
        body: JSON.stringify(formData)
      }).then((res) => {
        if (!res.ok) throw new Error("No se pudo actualizar el producto");
        return res.json();
      });
    } else {
      // Create new product
      await fetch("/api/admin/products", {
        method: "POST",
        headers: buildHeaders("application/json"),
        body: JSON.stringify(formData)
      }).then((res) => {
        if (!res.ok) throw new Error("No se pudo crear el producto");
        return res.json();
      });
    }

    // Attach allergens if this was a create operation or we need to update them
    if (formData.allergens.length > 0) {
      const productId = editingProductId; // Should come from response if creating
      const res = await fetch(`/api/admin/products/${productId}/allergens`, {
        method: "POST",
        headers: buildHeaders("application/json"),
        body: JSON.stringify({ allergens: formData.allergens })
      });
      if (!res.ok) console.warn("Could not attach allergens");
    }

    closeProductFormModal();
    await loadAdminData();
    renderAdmin();
  } catch (error) {
    alert(error.message || "Error al guardar el producto");
  }
});

function openProductFormModal(product = null) {
  editingProductId = product?.id || null;
  productFormTitle.textContent = product ? "Editar producto" : "Crear producto";

  productFormName.value = product?.name || "";
  productFormDescription.value = product?.description || "";
  productFormPrice.value = product?.price || "";

  renderAllergenCheckboxes([]);

  productFormModal?.classList.remove("hidden");
}

function closeProductFormModal() {
  productFormModal?.classList.add("hidden");
  productFormElement?.reset();
  editingProductId = null;
}

function renderAllergenCheckboxes(selectedAllergenIds = []) {
  productFormAllergens.innerHTML = "";

  // Fetch allergens from state if available
  const allergens = availableAllergens.length > 0 ? availableAllergens : getDefaultAllergens();

  allergens.forEach((allergen) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "allergen-pill";
    button.dataset.allergenId = allergen.id;
    button.textContent = allergen.name;
    
    // Mark as selected if it was previously selected
    if (selectedAllergenIds.includes(allergen.id)) {
      button.classList.add("selected");
    }

    // Toggle selection on click
    button.addEventListener("click", (e) => {
      e.preventDefault();
      button.classList.toggle("selected");
    });

    productFormAllergens.appendChild(button);
  });
}

// Hide modal when clicking outside
productFormModal?.addEventListener("click", (event) => {
  if (event.target === productFormModal) {
    closeProductFormModal();
  }
});

// Keep the old form submission only if it exists (old flow)
if (document.getElementById("createProductForm")) {
  document.getElementById("createProductForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    // This is now handled by the modal
  });
}

categoryNav.addEventListener("click", (event) => {
  const rawTarget = event.target;
  const target = rawTarget instanceof Element ? rawTarget.closest("button") : null;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  state.category = target.dataset.category || "ALL";
  Array.from(categoryNav.querySelectorAll(".chip")).forEach((button) => {
    button.classList.toggle("active", button.dataset.category === state.category);
  });

  renderConsumerHome();
});

ordersFilterNav?.addEventListener("click", (event) => {
  const rawTarget = event.target;
  const target = rawTarget instanceof Element ? rawTarget.closest("button") : null;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  state.ordersFilter = target.dataset.orderFilter || "ALL";
  renderOrdersManager();
});

ordersList?.addEventListener("click", async (event) => {
  const rawTarget = event.target;
  const target = rawTarget instanceof Element ? rawTarget.closest("button") : null;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const orderId = target.dataset.orderId;
  const action = target.dataset.orderAction;

  if (!orderId || !action) {
    return;
  }

  if (action === "detail") {
    await openOrderDetailScreen(orderId);
    return;
  }

  if (action === "repeat") {
    await repeatOrder(orderId);
    return;
  }

  if (action === "cancel") {
    await cancelOrder(orderId);
  }
});

ordersBackBtn?.addEventListener("click", () => {
  state.ordersView = "LIST";
  state.selectedOrderId = null;
  state.selectedOrderDetail = null;
  setOrdersView("LIST");
  renderOrdersManager();
});

ordersDetailRepeatBtn?.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const orderId = target.dataset.orderId;
  if (!orderId) {
    return;
  }

  await repeatOrder(orderId);
});

ordersDetailCancelBtn?.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const orderId = target.dataset.orderId;
  if (!orderId) {
    return;
  }

  await cancelOrder(orderId);
});

productGrid.addEventListener("click", (event) => {
  const rawTarget = event.target;
  const target = rawTarget instanceof Element ? rawTarget.closest(".product-card") : null;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const id = target.dataset.productId;
  if (!id) {
    return;
  }

  openCustomize(id);
});

customizeQtyMinus?.addEventListener("click", () => {
  const current = Math.max(1, Number(customizeQtyValue?.textContent || "1"));
  const next = Math.max(1, current - 1);
  if (customizeQtyValue) {
    customizeQtyValue.textContent = String(next);
  }
});

customizeQtyPlus?.addEventListener("click", () => {
  const current = Math.max(1, Number(customizeQtyValue?.textContent || "1"));
  const next = Math.min(99, current + 1);
  if (customizeQtyValue) {
    customizeQtyValue.textContent = String(next);
  }
});

cartItems.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  if (target.dataset.plus) {
    updateQty(target.dataset.plus, 1);
  }

  if (target.dataset.minus) {
    updateQty(target.dataset.minus, -1);
  }
});

checkoutBtn.addEventListener("click", async () => {
  if (!(checkoutBtn instanceof HTMLButtonElement)) {
    return;
  }

  if (cartFeedback) {
    cartFeedback.textContent = "";
  }

  const originalText = checkoutBtn.textContent || "Continuar al pago";
  checkoutBtn.disabled = true;
  checkoutBtn.textContent = "Procesando...";

  try {
    await checkoutCart();
    if (cartFeedback) {
      cartFeedback.textContent = "Pedido creado correctamente.";
    }
  } catch (error) {
    if (cartFeedback) {
      cartFeedback.textContent = error.message || "No se pudo procesar el pago";
    }
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = originalText;
  }
});

openCartBtn.addEventListener("click", () => {
  renderCart();
  if (cartFeedback) {
    cartFeedback.textContent = "";
  }
  cartModal.classList.remove("hidden");
});

openNutritionBtn?.addEventListener("click", () => {
  nutritionModal?.classList.remove("hidden");
});

closeNutritionBtn?.addEventListener("click", () => {
  nutritionModal?.classList.add("hidden");
});

closeCartBtn.addEventListener("click", () => {
  cartModal.classList.add("hidden");
});

closeCustomizeBtn.addEventListener("click", () => {
  customizeModal.classList.add("hidden");
  nutritionModal?.classList.add("hidden");
});

confirmCustomizeBtn.addEventListener("click", () => {
  addCustomizedToCart();
});

closeHistoryBtn.addEventListener("click", () => {
  historyModal.classList.add("hidden");
});

closeOrderDetailBtn.addEventListener("click", () => {
  orderDetailModal.classList.add("hidden");
});

profileLogoutBtn?.addEventListener("click", () => {
  logout();
});

historyList.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const id = target.dataset.historyId;
  if (!id) {
    return;
  }

  try {
    const detail = await loadOrderDetail(id);
    renderOrderDetail(detail);
    orderDetailModal.classList.remove("hidden");
  } catch (error) {
    showToast(error.message || "No se pudo abrir el detalle", "error");
  }
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.activeTab = button.dataset.tab || "HOME";

    if (state.activeTab !== "ORDERS") {
      state.ordersFilter = "ALL";
      state.ordersView = "LIST";
      state.selectedOrderId = null;
      state.selectedOrderDetail = null;
    }

    renderConsumerHome();
    mobileShell?.scrollTo({ top: 0, behavior: "smooth" });
  });
});

logoutBtn.addEventListener("click", logout);
adminLogoutBtn?.addEventListener("click", logout);
consumerLogoutBtn.addEventListener("click", logout);
