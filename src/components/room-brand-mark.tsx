import { Building2 } from "lucide-react";

type RoomBrandMarkProps = {
  organizationName?: string;
  logoUrl?: string;
  compact?: boolean;
};

export function RoomBrandMark({
  organizationName = "",
  logoUrl = "",
  compact = false,
}: RoomBrandMarkProps) {
  const hasBranding = Boolean(organizationName || logoUrl);

  if (!hasBranding) {
    return null;
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={
          compact
            ? "grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md border border-slate-200 bg-white"
            : "grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md border border-slate-200 bg-white"
        }
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={organizationName ? `${organizationName} logo` : "Organization logo"}
            className="h-full w-full object-contain p-1.5"
          />
        ) : (
          <Building2 className="h-5 w-5 text-slate-500" />
        )}
      </div>
      {organizationName ? (
        <p className="min-w-0 break-words text-sm font-black uppercase tracking-[0.14em] text-slate-600">
          {organizationName}
        </p>
      ) : null}
    </div>
  );
}
