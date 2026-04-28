import { DefaultSession, DefaultUser } from "next-auth";
import type { AppRole } from "@/lib/constants";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      role: AppRole;
    };
  }

  interface User extends DefaultUser {
    role?: AppRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AppRole;
  }
}
