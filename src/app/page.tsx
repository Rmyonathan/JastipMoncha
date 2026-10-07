import { Dashboard } from "@/components/Dashboard";
import { fetchOrdersWithItems, fetchProfitSummary } from "@/lib/queries";

export const instant = false;

export default async function HomePage() {
  let orders: Awaited<ReturnType<typeof fetchOrdersWithItems>> = [];
  let summary: Awaited<ReturnType<typeof fetchProfitSummary>> = {
    totalRevenue: 0,
    totalCost: 0,
    grossProfit: 0,
    totalOngkir: 0,
    netProfit: 0,
    paidRevenue: 0,
    paidGrossProfit: 0,
    paidOngkir: 0,
    paidNetProfit: 0,
  };
  let dbError: string | null = null;

  try {
    [orders, summary] = await Promise.all([
      fetchOrdersWithItems(),
      fetchProfitSummary(),
    ]);
  } catch (e) {
    dbError =
      e instanceof Error
        ? e.message
        : "Database unavailable. Run npm run db:init and set DATABASE_URL.";
  }

  return (
    <main className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col gap-8 px-4 py-10 lg:px-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Jastip Moncha
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Simple jastip tracker: one form for customer info, shipping, multi-item
          orders, and live profit — backed by Neon Postgres, ready for Vercel.
        </p>
      </header>

      {dbError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Setup needed</p>
          <p className="mt-1">{dbError}</p>
          <ol className="mt-2 list-inside list-decimal space-y-1">
            <li>Copy <code className="rounded bg-amber-100 px-1">.env.example</code> to{" "}
              <code className="rounded bg-amber-100 px-1">.env.local</code> and set{" "}
              <code className="rounded bg-amber-100 px-1">DATABASE_URL</code>
            </li>
            <li>Run <code className="rounded bg-amber-100 px-1">npm run db:init</code></li>
          </ol>
        </div>
      ) : (
        <Dashboard initialOrders={orders} initialSummary={summary} />
      )}
    </main>
  );
}
