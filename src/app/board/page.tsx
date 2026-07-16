import { Header } from "@/components/Header";
import { Board } from "@/components/Board";
import { ComplaintTable } from "@/components/ComplaintTable";

export default function BoardPage() {
  return (
    <div className="min-h-screen bg-base-50">
      <Header />
      <main className="mx-auto max-w-[1400px] px-4 py-8 space-y-8">
        <Board />
        <ComplaintTable />
      </main>
    </div>
  );
}
