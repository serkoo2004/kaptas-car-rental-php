import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { canAccessAdmin } from "@/lib/permissions/rbac";

type AuthenticatedSession = Session & {
  user: NonNullable<Session["user"]> & {
    id: string;
  };
};

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireUserSession(): Promise<AuthenticatedSession> {
  const session = await getCurrentSession();

  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    redirect("/login");
  }

  return session as AuthenticatedSession;
}

export async function requireAdminSession(): Promise<AuthenticatedSession> {
  const session = await requireUserSession();

  if (!canAccessAdmin(session.user.role, session.user.status)) {
    redirect("/");
  }

  return session;
}
