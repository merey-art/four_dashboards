import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { defaultPostLoginHref } from "@/lib/constants";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role) {
    redirect(defaultPostLoginHref(session.user.role));
  }
  redirect("/login");
}
