import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";

import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";

const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");

createRoot(container).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  </StrictMode>
);

if (Capacitor.isNativePlatform() && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .then(() => window.caches?.keys())
    .then((keys) => Promise.all((keys ?? []).map((key) => window.caches.delete(key))))
    .catch(() => {
      // Native apps should always use the bundled assets; stale SW caches are safe to ignore once cleanup fails.
    });
}

if (!Capacitor.isNativePlatform() && "serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installation remains available through the manifest when SW registration fails.
    });
  });
}
