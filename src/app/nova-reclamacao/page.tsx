import { Header } from "@/components/Header";
import { ComplaintForm } from "@/components/ComplaintForm";

export default function NovaReclamacaoPage() {
  return (
    <div className="min-h-screen bg-base-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h2 className="font-display text-xl text-base-900 mb-6">
          Nova reclamação
        </h2>
        <ComplaintForm />
      </main>
    </div>
  );
}
