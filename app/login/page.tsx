import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { defaultPostLoginHref } from "@/lib/constants";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role) {
    redirect(defaultPostLoginHref(session.user.role));
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
      <LoginForm />
      <p className="mt-6 max-w-md text-center text-xs text-muted-foreground">
        Демо: director@logistics.kz или отделный пользователь • пароль demo123456
      </p>
    </div>
  );
}
