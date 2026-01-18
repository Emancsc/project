const TOKEN_KEY = "cst_token";
const ROLE_KEY = "cst_role";

export function saveAuth(token, role) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

export function isCitizen() {
  return getRole() === "citizen";
}

export function isStaff() {
  return getRole() === "staff";
}
