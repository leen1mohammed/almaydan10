import MatchesList from "@/components/matches/MatchesList";

export default function MatchesPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">جدول المباريات</h1>
      <p className="mt-2 text-sm opacity-80">
        مثال ستاندرد: صفحة (Server Component) + قائمة (Client Component) تجيب بيانات من API.
      </p>
      <div className="mt-6">
        <MatchesList />
      </div>
    </main>
  );
}
