import { Header } from "@/components/Header";
import { BoardComTabela } from "@/components/BoardComTabela";

export default function BoardPage() {
  return (
    <div className="min-h-screen bg-base-50">
      <Header />
      <main className="mx-auto max-w-[1400px] px-4 py-8">
        <BoardComTabela />
      </main>
    </div>
  );
}
