import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

export function QRCodeDisplay({ value, size = 160 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    QRCode.toCanvas(
      canvas,
      value,
      { width: size, margin: 2, color: { dark: '#44382c', light: '#fffdf8' } },
      (err) => {
        setError(Boolean(err));
      },
    );
  }, [value, size]);

  if (error) {
    return <p className="text-xs text-danger">QR unavailable.</p>;
  }

  return (
    <canvas
      ref={canvasRef}
      className="rounded-xl border border-line bg-[#fffdf8] p-3 shadow-[0_1px_2px_rgb(68_56_44/0.06)]"
      aria-label="Room invite QR code"
    />
  );
}
