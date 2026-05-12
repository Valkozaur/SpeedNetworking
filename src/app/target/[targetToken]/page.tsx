import { notFound } from "next/navigation";
import { QrCode } from "@/components/qr-code";
import { absoluteUrl } from "@/lib/app-url";
import { roomThemeStyle } from "@/lib/customization";
import { getTargetByToken } from "@/lib/rooms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TargetPageProps = {
  params: Promise<{
    targetToken: string;
  }>;
};

export default async function TargetPage({ params }: TargetPageProps) {
  const { targetToken } = await params;
  const data = await getTargetByToken(targetToken);

  if (!data) {
    notFound();
  }

  const targetUrl = absoluteUrl(`/target/${data.target.scannerToken}`);

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-slate-50 px-4 py-5 text-slate-950"
      style={roomThemeStyle(data.room)}
    >
      <div
        className="mx-auto grid min-w-0 max-w-xl gap-5"
        style={{ width: "min(100%, calc(100vw - 2rem))" }}
      >
        <section className="min-w-0 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
          <p className="break-words text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
            {data.room.title}
          </p>
          {data.room.hostName ? (
            <p className="mt-2 break-words text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              {data.room.hostName}
            </p>
          ) : null}
          <h1 className="mt-2 break-words text-3xl font-black tracking-tight text-slate-950">
            {data.target.name}
          </h1>
          {data.room.subtitle ? (
            <p className="mt-2 break-words text-lg font-semibold leading-7 text-slate-800">
              {data.room.subtitle}
            </p>
          ) : null}
          <p className="mt-2 text-base leading-7 text-slate-600">
            Participants should open their passport and scan this QR after a
            conversation to collect this stamp.
          </p>

          <div className="mt-5">
            <QrCode
              value={targetUrl}
              alt={`Target QR for ${data.target.name}`}
              size={300}
            />
          </div>

          <div className="mt-4 rounded-md bg-slate-50 p-4 text-center">
            <p className="text-sm font-semibold text-slate-500">Fallback code</p>
            <p className="mt-1 break-words text-3xl font-black tracking-[0.18em] text-slate-950 sm:tracking-[0.24em]">
              {data.target.fallbackCode}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
