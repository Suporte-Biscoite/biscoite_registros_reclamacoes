import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Remove todas as reclamações (e o histórico de status junto, por cascade) e
// reinicia o contador de protocolo do zero. NÃO afeta a tabela de Lojas.
async function main() {
  const { count: totalReclamacoes } = await prisma.reclamacao.deleteMany();

  // Reinicia a sequência do número de protocolo para o próximo registro
  // começar em 000001 de novo.
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "Reclamacao_numeroProtocolo_seq" RESTART WITH 1`
  );

  console.log(`${totalReclamacoes} reclamação(ões) removida(s).`);
  console.log("Contador de protocolo reiniciado para 000001.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
