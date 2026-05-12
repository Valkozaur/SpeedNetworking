import QRCode from "qrcode";

type QrCodeProps = {
  value: string;
  alt: string;
  size?: number;
};

export async function QrCode({ value, alt, size = 280 }: QrCodeProps) {
  const dataUrl = await QRCode.toDataURL(value, {
    width: size,
    margin: 2,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className="mx-auto aspect-square h-auto w-full rounded-md border border-slate-200 bg-white p-3 shadow-sm"
      style={{ maxWidth: size }}
    />
  );
}
