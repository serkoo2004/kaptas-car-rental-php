"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-[#d5ab31] hover:bg-[#fff8df] hover:text-[#6f5510] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5ab31] focus-visible:ring-offset-2",
        className,
      )}
      onClick={() => signOut({ callbackUrl: "/" })}
      type="button"
    >
      <LogOut aria-hidden="true" className="h-4 w-4" />
      <span className="hidden sm:inline">Çıkış Yap</span>
    </button>
  );
}
