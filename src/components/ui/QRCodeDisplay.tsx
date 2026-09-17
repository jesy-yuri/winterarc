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
      { width: size, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } },
      (err) => {
        setError(Boolean(err));
      },
    );
  }, [value, size]);

  if (error) {
    return <p className="text-xs text-red-400">QR unavailable.</p>;
  }

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg border border-white/10 bg-white p-2"
      aria-label="Room invite QR code"
    />
  );
}
