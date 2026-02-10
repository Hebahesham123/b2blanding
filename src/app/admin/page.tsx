import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Submission } from "@/lib/supabase";

async function getSubmissions(): Promise<Submission[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key);
  const { data } = await supabase
    .from("submissions")
    .select("id, full_name, phone_number, promo_code, created_at")
    .order("created_at", { ascending: false });
  return (data as Submission[]) || [];
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default async function AdminPage() {
  const submissions = await getSubmissions();

  return (
    <div dir="ltr" lang="en" className="min-h-screen bg-stone-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-stone-800">Admin Dashboard</h1>
          <Link
            href="/"
            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            ← Back to landing
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow border border-stone-200 overflow-hidden">
          {submissions.length === 0 ? (
            <div className="p-12 text-center text-stone-500">
              No submissions yet. They will appear here when customers submit the form.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-stone-700">Full name</th>
                    <th className="py-3 px-4 font-semibold text-stone-700">Phone number</th>
                    <th className="py-3 px-4 font-semibold text-stone-700">Promo code</th>
                    <th className="py-3 px-4 font-semibold text-stone-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-stone-100 hover:bg-stone-50"
                    >
                      <td className="py-3 px-4 text-stone-800">{row.full_name}</td>
                      <td className="py-3 px-4 text-stone-700">{row.phone_number}</td>
                      <td className="py-3 px-4 font-mono text-amber-600">{row.promo_code}</td>
                      <td className="py-3 px-4 text-stone-500 text-sm">
                        {formatDate(row.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
