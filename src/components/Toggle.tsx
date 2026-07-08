// 開關樣式的核取控制：外觀是滑動 toggle，底層仍是隱藏的原生 checkbox
// （保住鍵盤操作、label 關聯與測試的 check()/uncheck() 語意）
export default function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="relative flex cursor-pointer select-none items-center gap-2 text-sm text-muted">
      {/* 透明的原生 checkbox 精準覆蓋在軌道上：不露原生外觀，但保住可點性與鍵盤/測試語意 */}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer absolute left-0 top-1/2 z-10 h-5 w-9 -translate-y-1/2 cursor-pointer opacity-0"
      />
      <span className="relative h-5 w-9 shrink-0 rounded-full bg-edge transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-accent peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50" />
      {label}
    </label>
  );
}
