"use client";

import { useActionState } from "react";
import { Image as ImageIcon, Loader2, Palette, Save } from "lucide-react";

import { updateRoomCustomizationAction, type ActionState } from "@/app/actions";
import { ROOM_OVERLAYS, ROOM_THEMES } from "@/lib/customization";
import type { Room } from "@/lib/rooms";

type RoomCustomizationFormProps = {
  room: Room;
};

const initialState: ActionState = {};

export function RoomCustomizationForm({ room }: RoomCustomizationFormProps) {
  const [state, action, pending] = useActionState(
    updateRoomCustomizationAction.bind(null, room.id, room.adminToken),
    initialState,
  );

  return (
    <form action={action} className="grid gap-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-950 text-white">
          <Palette className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            Customize room
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Tune the passport tone before people join. These settings affect the
            participant room, target QR pages, and admin dashboard.
          </p>
        </div>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-900">Room title</span>
        <input
          name="title"
          defaultValue={room.title}
          className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[var(--room-accent)] focus:ring-4 focus:ring-emerald-100"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-900">Subtitle</span>
        <input
          name="subtitle"
          defaultValue={room.subtitle}
          placeholder="Meet the people building the next thing."
          className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[var(--room-accent)] focus:ring-4 focus:ring-emerald-100"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-900">Host label</span>
        <input
          name="hostName"
          defaultValue={room.hostName}
          placeholder="Hosted by Sofia Builders Club"
          className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[var(--room-accent)] focus:ring-4 focus:ring-emerald-100"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-900">Theme</span>
          <select
            name="themePreset"
            defaultValue={room.themePreset}
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-[var(--room-accent)] focus:ring-4 focus:ring-emerald-100"
          >
            {ROOM_THEMES.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-900">Accent</span>
          <input
            name="accentColor"
            type="color"
            defaultValue={room.accentColor}
            className="h-11 rounded-md border border-slate-200 bg-white p-1"
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ImageIcon className="h-4 w-4" />
          Background image URL
        </span>
        <input
          name="backgroundImageUrl"
          defaultValue={room.backgroundImageUrl}
          placeholder="https://..."
          inputMode="url"
          className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[var(--room-accent)] focus:ring-4 focus:ring-emerald-100"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-900">Image treatment</span>
        <select
          name="backgroundOverlay"
          defaultValue={room.backgroundOverlay}
          className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-[var(--room-accent)] focus:ring-4 focus:ring-emerald-100"
        >
          {ROOM_OVERLAYS.map((overlay) => (
            <option key={overlay.id} value={overlay.id}>
              {overlay.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-900">Example questions</span>
        <textarea
          name="questions"
          rows={5}
          defaultValue={room.questions.join("\n")}
          className="rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-[var(--room-accent)] focus:ring-4 focus:ring-emerald-100"
        />
      </label>

      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save customization
      </button>
    </form>
  );
}
