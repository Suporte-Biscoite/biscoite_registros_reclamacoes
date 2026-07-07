import { Header } from "@/components/Header";
import { Dashboard } from "@/components/Dashboard";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-base-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Dashboard />
      </main>
    </div>
  );
}
