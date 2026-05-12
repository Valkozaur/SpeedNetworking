import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";

import { QrCode } from "@/components/qr-code";
import { absoluteUrl } from "@/lib/app-url";
import { roomThemeStyle } from "@/lib/customization";
import { getAdminRoom } from "@/lib/rooms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type BadgePageProps = {
  params: Promise<{
    roomId: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function TargetBadgesPage({ params, searchParams }: BadgePageProps) {
  const { roomId } = await params;
  const { token } = await searchParams;
  const data = await getAdminRoom(roomId, token);

  if (!data) {
    notFound();
  }

  return (
    <main
      className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 print:bg-white print:px-0 print:py-0"
      style={roomThemeStyle(data.room)}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-5 print:max-w-none">
        <header className="flex flex-col gap-4 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur print:hidden sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href={`/admin/${data.room.id}?token=${encodeURIComponent(data.room.adminToken)}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Target QR sheets</h1>
          </div>
          <div className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white">
            <Printer className="h-4 w-4" />
            Use browser print
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 print:grid-cols-2 print:gap-0">
          {data.targets.map((target) => {
            const targetUrl = absoluteUrl(`/target/${target.scannerToken}`);

            return (
              <article
                key={target.id}
                className="break-inside-avoid rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur print:rounded-none print:border-slate-300 print:bg-white print:shadow-none"
              >
                <div className="mb-4">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
                    Target QR badge
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                    {target.name}
                  </h2>
                </div>

                <QrCode value={targetUrl} alt={`Target QR for ${target.name}`} size={250} />

                <div className="mt-4 grid gap-2 text-sm leading-6 text-slate-600">
                  <p>
                    Participants open their passport, scan this QR after a
                    conversation, and collect this stamp.
                  </p>
                  <p
                    className="rounded-md bg-emerald-50 p-3 text-center text-lg font-black tracking-[0.2em] text-emerald-800"
                    style={{ color: data.room.accentColor }}
                  >
                    {target.fallbackCode}
                  </p>
                  <p className="break-all rounded-md bg-slate-50 p-3 font-mono text-xs text-slate-700">
                    {targetUrl}
                  </p>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
