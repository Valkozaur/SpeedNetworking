"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";

import {
  deleteAdminRoom,
  listAdminRooms,
  type LocalAdminRoom,
} from "@/lib/local-admin-rooms";

export function AdminRoomLibrary() {
  const [rooms, setRooms] = useState<LocalAdminRoom[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function refreshRooms() {
    const savedRooms = await listAdminRooms();

    setRooms(savedRooms);
    setLoaded(true);
  }

  useEffect(() => {
    let active = true;

    listAdminRooms().then((savedRooms) => {
      if (!active) {
        return;
      }

      setRooms(savedRooms);
      setLoaded(true);
    });

    return () => {
      active = false;
    };
  }, []);

  async function removeRoom(roomId: string) {
    await deleteAdminRoom(roomId);
    await refreshRooms();
  }

  if (!loaded) {
    return (
      <div className="rounded-md border border-slate-200 bg-white/90 p-5 text-sm text-slate-500 shadow-sm">
        Loading rooms stored on this device...
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="rounded-md border border-slate-200 bg-white/90 p-5 shadow-sm">
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          No rooms saved on this phone yet
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Open an admin dashboard from this device and it will appear here for
          quick access later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {rooms.map((room) => (
        <article
          key={room.roomId}
          className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm"
        >
          <div
            className="h-2"
            style={{
              backgroundColor: room.accentColor,
            }}
          />
          <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-black tracking-tight text-slate-950">
                {room.title}
              </h2>
              {room.organizationName ? (
                <p className="mt-1 truncate text-sm font-semibold text-slate-600">
                  {room.organizationName}
                </p>
              ) : null}
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Join code {room.joinCode}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Saved {new Date(room.updatedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/${room.roomId}?token=${encodeURIComponent(room.adminToken)}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </Link>
              <button
                type="button"
                onClick={() => void removeRoom(room.roomId)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-red-600"
                aria-label={`Remove ${room.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
