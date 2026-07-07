import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// Esta rota NÃO recebe o arquivo em si — ela só autoriza o navegador a subir
// o arquivo diretamente para o Vercel Blob (upload direto, sem passar pelo
// nosso servidor). Por isso funciona mesmo com arquivos grandes.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "application/pdf"
          ],
          maximumSizeInBytes: 15 * 1024 * 1024 // 15 MB por arquivo
        };
      },
      onUploadCompleted: async () => {
        // Não usamos esse callback: em desenvolvimento local ele não é
        // acionado (a Vercel precisa conseguir chamar de volta essa rota, o
        // que não funciona com localhost). Em vez disso, o próprio navegador
        // registra o anexo chamando /api/reclamacoes/[id]/anexos depois que
        // o upload termina — veja src/components/AnexosPanel.tsx.
      }
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
