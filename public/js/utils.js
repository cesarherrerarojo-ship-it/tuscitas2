// Simple UI utilities used across the app

export function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 4000);
}

export function formatDate(dateInput) {
  try {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(d);
  } catch {
    return "—";
  }
}