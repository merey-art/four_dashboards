import { getServerSession } from "next-auth";
import type { AppRole } from "@/lib/constants";
import { authOptions } from "@/lib/auth";

export async function getSessionStrict() {
  return getServerSession(authOptions);
}

export function hasApiAccess(role: string | undefined, allowed: AppRole[]): boolean {
  if (!role) return false;
  if (role === "DIRECTOR") return true;
  return allowed.includes(role as AppRole);
}
