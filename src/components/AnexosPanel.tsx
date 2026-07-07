"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import type { Anexo } from "@/lib/types";

function formatarTamanho(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AnexosPanel({
  reclamacaoId,
  anexosIniciais
}: {
  reclamacaoId: string;
  anexosIniciais: Anexo[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [anexos, setAnexos] = useState<Anexo[]>(anexosIniciais);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleArquivosSelecionados(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = e.target.files;
    if (!arquivos || arquivos.length === 0) return;

    setEnviando(true);
    setErro(null);

    for (const arquivo of Array.from(arquivos)) {
      try {
        const blob = await upload(arquivo.name, arquivo, {
          access: "public",
          handleUploadUrl: "/api/anexos/upload"
        });

        const res = await fetch(`/api/reclamacoes/${reclamacaoId}/anexos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nomeArquivo: arquivo.name,
            url: blob.url,
            tipoArquivo: blob.contentType ?? arquivo.type,
            tamanho: arquivo.size
          })
        });

        const data = await res.json();
        if (res.ok) {
          setAnexos((prev) => [...prev, data.anexo]);
        } else {
          setErro(data.error ?? `Não foi possível salvar o anexo "${arquivo.name}".`);
        }
      } catch (err) {
        setErro(`Erro ao enviar "${arquivo.name}": ${(err as Error).message}`);
      }
    }

    setEnviando(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemover(anexoId: string) {
    if (!confirm("Remover este anexo? Essa ação não pode ser desfeita.")) return;
    const res = await fetch(`/api/anexos/${anexoId}`, { method: "DELETE" });
    if (res.ok) {
      setAnexos((prev) => prev.filter((a) => a.id !== anexoId));
    } else {
      setErro("Não foi possível remover o anexo.");
    }
  }

  return (
    <div className="bg-white border border-base-200 rounded-card p-6">
      <p className="text-sm font-medium text-base-800 mb-3">Anexos</p>

      <label className="focus-ring inline-block rounded-md border border-base-300 px-4 py-2 text-sm cursor-pointer hover:border-caramel-400 transition-colors">
        {enviando ? "Enviando..." : "Adicionar anexo(s)"}
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleArquivosSelecionados}
          disabled={enviando}
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
        />
      </label>
      <p className="text-xs text-base-800 mt-1">
        Imagens ou PDF, até 15 MB por arquivo. Pode selecionar mais de um.
      </p>

      {erro && (
        <p className="text-xs text-brick-500 mt-2" role="alert">
          {erro}
        </p>
      )}

      {anexos.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {anexos.map((anexo) => (
            <li
              key={anexo.id}
              className="flex items-center justify-between gap-2 text-sm border border-base-100 rounded-md px-3 py-2"
            >
              <a
                href={anexo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring text-caramel-600 hover:text-caramel-500 underline truncate"
              >
                {anexo.nomeArquivo}
              </a>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-base-800">
                  {formatarTamanho(anexo.tamanho)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemover(anexo.id)}
                  className="focus-ring text-xs text-brick-500 hover:text-brick-600"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-base-800 mt-3">Nenhum anexo ainda.</p>
      )}
    </div>
  );
}
