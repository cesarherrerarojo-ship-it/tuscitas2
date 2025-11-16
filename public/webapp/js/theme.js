// Toggle de tema simple usando localStorage
const KEY = 'tcs:theme';
export function toggleTheme() {
  const current = localStorage.getItem(KEY) || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  localStorage.setItem(KEY, next);
  document.documentElement.dataset.theme = next;
}
export function applyTheme() {
  const t = localStorage.getItem(KEY) || 'light';
  document.documentElement.dataset.theme = t;
}

