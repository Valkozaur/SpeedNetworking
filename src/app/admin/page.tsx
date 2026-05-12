import Link from "next/link";
import { ArrowRight, Database, Plus } from "lucide-react";

import { AdminRoomLibrary } from "@/components/admin-room-library";

export default function AdminLibraryPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_18%_12%,rgba(5,150,105,0.18),transparent_28%),linear-gradient(135deg,#f8fafc,#eefdf7_48%,#f8fafc)] px-4 py-6 text-slate-950">
      <section className="mx-auto grid w-full max-w-4xl gap-5">
        <header className="rounded-md border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                <Database className="h-4 w-4" />
                On this device
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                Admin room library
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Rooms you open as admin are stored locally in this phone browser
                so you can get back to them without searching for the secret link.
              </p>
            </div>
            <Link
              href="/admin/new"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              New room
            </Link>
          </div>
        </header>

        <AdminRoomLibrary />

        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-slate-950"
        >
          Back home
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
