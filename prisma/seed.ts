import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Dados extraídos da aba "CONTATO LÍDERES" da planilha atual.
// Ajuste/complete conforme necessário — isso é só um ponto de partida.
const lojas = [
  { nome: "Alphaville", lider: "Marcella Isis", telefoneLider: "11 93485-8547", telefoneLoja: "11 93429-8490" },
  { nome: "Anália Franco", lider: "Elaísa", telefoneLider: "11 94669-9305", telefoneLoja: "11 94731-9714" },
  { nome: "Bahia", lider: "Carol", telefoneLider: "71 8794-1693", telefoneLoja: null },
  { nome: "Barra Shopping", lider: null, telefoneLider: null, telefoneLoja: "21 99883-4600" },
  { nome: "Belém", lider: null, telefoneLider: null, telefoneLoja: "91 9113-4774" },
  { nome: "Bourbon", lider: null, telefoneLider: null, telefoneLoja: "11 93046-8326" },
  { nome: "Butantã", lider: "Thays", telefoneLider: "11 99559-7409", telefoneLoja: "11 98976-2153" },
  { nome: "Cambuí", lider: null, telefoneLider: null, telefoneLoja: "19 99616-8800" },
  { nome: "Casa Cultura", lider: "Mariah", telefoneLider: "11 98619-3331", telefoneLoja: "11 94732-5823" },
  { nome: "Catarina", lider: null, telefoneLider: null, telefoneLoja: "11 99199-8927" },
  { nome: "Center Norte", lider: "Renan", telefoneLider: "11 99803-3318", telefoneLoja: "11 94443-0139" },
  { nome: "Cidade São Paulo", lider: null, telefoneLider: null, telefoneLoja: "11 97486-4319" },
  { nome: "Collinas", lider: "Anielle", telefoneLider: "12 98817-1298", telefoneLoja: null },
  { nome: "Dom Pedro", lider: null, telefoneLider: null, telefoneLoja: "19 99868-4357" },
  { nome: "Eldorado", lider: "Regina", telefoneLider: "11 98986-9299", telefoneLoja: "11 91060-1251" },
  { nome: "Iguatemi Campinas", lider: null, telefoneLider: null, telefoneLoja: "19 99751-2122" },
  { nome: "Internacional Guarulhos", lider: null, telefoneLider: null, telefoneLoja: "11 91427-3375" },
  { nome: "Jardim Sul", lider: "Veronika", telefoneLider: "11 93751-9945", telefoneLoja: "11 99839-8719" },
  { nome: "Jundiaí", lider: "Agda", telefoneLider: "11 97748-7993", telefoneLoja: "11 96175-2274" },
  { nome: "Leblon", lider: "Talita", telefoneLider: "21 97200-7459", telefoneLoja: "21 99071-3020" },
  { nome: "Maceió", lider: null, telefoneLider: null, telefoneLoja: "82 9181-2384" },
  { nome: "Metrópole", lider: "Grazy", telefoneLider: "11 98232-3690", telefoneLoja: "11 98898-5520" },
  { nome: "Mooca", lider: "Mariana", telefoneLider: "11 96163-9962", telefoneLoja: "11 97226-9645" },
  { nome: "Morumbi", lider: null, telefoneLider: null, telefoneLoja: "11 93373-7912" },
  { nome: "Morumbi Quiosque", lider: null, telefoneLider: null, telefoneLoja: "11 91146-0519" },
  { nome: "Morumbi Town", lider: null, telefoneLider: null, telefoneLoja: "11 93298-3589" },
  { nome: "Niterói", lider: "Esthefanny", telefoneLider: "21 97517-5282", telefoneLoja: null },
  { nome: "Norte Shopping", lider: null, telefoneLider: null, telefoneLoja: "21 96893-4297" },
  { nome: "Nova América", lider: null, telefoneLider: null, telefoneLoja: "21 97682-9055" },
  { nome: "Pamplona", lider: "Whenia", telefoneLider: "11 94402-8809", telefoneLoja: null },
  { nome: "Pátio Paulista", lider: "Aniele", telefoneLider: "11 96377-4086", telefoneLoja: "11 91131-3816" },
  { nome: "Penha", lider: null, telefoneLider: null, telefoneLoja: "11 91515-8609" },
  { nome: "Plaza Niterói", lider: "Esthef", telefoneLider: "21 97517-5282", telefoneLoja: "21 99368-4844" },
  { nome: "Plaza Sul", lider: "Luiz", telefoneLider: "11 98529-4303", telefoneLoja: "11 93339-6513" },
  { nome: "Rio Design Barra", lider: "Brenda", telefoneLider: "21 98606-2807", telefoneLoja: null },
  { nome: "Senior", lider: "Karen", telefoneLider: "11 91717-0365", telefoneLoja: null },
  { nome: "São Bernardo Plaza", lider: "Giovana", telefoneLider: "11 95891-7624", telefoneLoja: "11 99001-5978" },
  { nome: "Shopping ABC", lider: null, telefoneLider: null, telefoneLoja: "11 99470-9001" },
  { nome: "Sorocaba", lider: null, telefoneLider: null, telefoneLoja: "15 99695-7213" },
  { nome: "SP Market", lider: null, telefoneLider: null, telefoneLoja: "11 97762-9567" },
  { nome: "CD", lider: null, telefoneLider: null, telefoneLoja: null }
];

async function main() {
  for (const loja of lojas) {
    await prisma.loja.upsert({
      where: { nome: loja.nome },
      update: {},
      create: loja
    });
  }
  console.log(`${lojas.length} lojas inseridas/atualizadas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
