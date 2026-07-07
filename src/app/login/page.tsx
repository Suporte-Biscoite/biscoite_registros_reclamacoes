"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErro(data.error ?? "Não foi possível entrar.");
        return;
      }

      router.push("/board");
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-widest text-caramel-500 font-medium mb-2">
            Biscoitê
          </p>
          <h1 className="font-display text-2xl text-base-900">
            Controle de Reclamações
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-base-200 rounded-card p-6 shadow-sm"
        >
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-base-800 mb-1"
            >
              Usuário
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
              autoComplete="username"
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-base-800 mb-1"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
              autoComplete="current-password"
              required
            />
          </div>

          {erro && (
            <p className="mb-4 text-sm text-brick-500" role="alert">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="focus-ring w-full rounded-md bg-caramel-500 text-white text-sm font-medium py-2 hover:bg-caramel-600 transition-colors disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
