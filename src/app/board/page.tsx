import { Header } from "@/components/Header";
import { Board } from "@/components/Board";

export default function BoardPage() {
  return (
    <div className="min-h-screen bg-base-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Board />
      </main>
    </div>
  );
}
