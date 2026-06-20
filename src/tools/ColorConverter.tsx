import { useState } from 'react';
import {
  parseColor,
  rgbToHex,
  rgbToHsl,
  formatRgb,
  formatHsl,
  readableTextColor,
  type RGB,
} from '../lib/color';
import CopyButton from '../components/CopyButton';

const DEFAULT: RGB = { r: 217, g: 119, b: 87 }; // Tiglet accent

export default function ColorConverter() {
  const [text, setText] = useState('#D97757');
  const [rgb, setRgb] = useState<RGB>(DEFAULT);
  const valid = parseColor(text) !== null;

  function commitText(value: string) {
    setText(value);
    const parsed = parseColor(value);
    if (parsed) setRgb(parsed);
  }

  function commitPicker(hex: string) {
    const parsed = parseColor(hex);
    if (parsed) {
      setRgb(parsed);
      setText(hex);
    }
  }

  const hex = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);
  const outputs = [
    { label: 'HEX', value: hex },
    { label: 'RGB', value: formatRgb(rgb) },
    { label: 'HSL', value: formatHsl(hsl) },
  ];

  return (
    <div className="mx-auto max-w-lg">
      <div
        className="mb-5 flex h-32 items-end justify-between rounded-[var(--radius-card)] border border-edge p-4 transition-colors duration-300"
        style={{ backgroundColor: hex, color: readableTextColor(rgb) }}
      >
        <span className="font-mono text-sm opacity-80">預覽</span>
        <span className="font-mono text-lg">{hex}</span>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <label className="relative h-12 w-14 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-edge">
          <input
            type="color"
            value={hex}
            onChange={(e) => commitPicker(e.target.value)}
            className="absolute -left-2 -top-2 h-16 w-20 cursor-pointer border-0 bg-transparent p-0"
            aria-label="選擇顏色"
          />
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => commitText(e.target.value)}
          placeholder="#D97757、rgb(217,119,87) 或 hsl(16,63%,60%)"
          spellCheck={false}
          className={`w-full rounded-lg border bg-surface px-3 py-3 font-mono text-sm text-ink outline-none transition-colors focus:border-accent ${valid ? 'border-edge' : 'border-red-500'}`}
        />
      </div>
      {!valid && <p className="-mt-3 mb-4 text-sm text-red-500">無法辨識的顏色格式。</p>}

      <div className="space-y-2">
        {outputs.map((o) => (
          <div key={o.label} className="flex items-center gap-3 rounded-lg border border-edge bg-surface px-4 py-3">
            <span className="w-12 shrink-0 text-sm text-muted">{o.label}</span>
            <span className="flex-1 font-mono text-sm tabular-nums text-ink break-all">{o.value}</span>
            <CopyButton value={o.value} />
          </div>
        ))}
      </div>
    </div>
  );
}
