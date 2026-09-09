import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "copa_admin_session";
const SESSION_CONTEXT = "copa-apdes-admin-session-v1";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function configuredPassword() {
  const value = process.env.ADMIN_PASSWORD;
  if (!value) throw new Error("Falta configurar ADMIN_PASSWORD.");
  return value;
}

function expectedToken() {
  return createHmac("sha256", configuredPassword())
    .update(SESSION_CONTEXT)
    .digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyAdminPasswordInput(password: string | null) {
  if (!password) return false;
  return safeEqual(password, configuredPassword());
}

function cookieValue(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const prefix = `${ADMIN_SESSION_COOKIE}=`;
  const found = cookies.find((item) => item.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : null;
}

export function hasValidAdminSession(request: Request) {
  const value = cookieValue(request);
  if (!value) return false;
  return safeEqual(value, expectedToken());
}

export function hasAdminAccess(request: Request) {
  return (
    hasValidAdminSession(request) ||
    verifyAdminPasswordInput(request.headers.get("x-admin-password"))
  );
}

export function adminSessionCookie() {
  const secure =
    process.env.NODE_ENV === "production" ? "; Secure" : "";

  return [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(expectedToken())}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE_SECONDS}`,
    secure.replace(/^; /, ""),
  ]
    .filter(Boolean)
    .join("; ");
}
