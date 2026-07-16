"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const linkClass = (path: string) =>
    `text-sm px-3 py-1.5 rounded-md transition-colors ${
      pathname === path
        ? "bg-caramel-500 text-white"
        : "text-base-800 hover:bg-base-100"
    }`;

  return (
    <header className="border-b border-base-200 bg-white">
      <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-caramel-500 font-medium leading-none">
            Biscoitê
          </p>
          <h1 className="font-display text-lg text-base-900 leading-tight">
            Controle de Reclamações
          </h1>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/board" className={linkClass("/board")}>
            Board
          </Link>
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            Análises
          </Link>
          <Link href="/nova-reclamacao" className={linkClass("/nova-reclamacao")}>
            Nova reclamação
          </Link>
          <button
            onClick={handleLogout}
            className="focus-ring text-sm px-3 py-1.5 rounded-md text-base-800 hover:bg-base-100 transition-colors"
          >
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}
