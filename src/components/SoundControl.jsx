import { useEffect, useState } from "react";
import { audio } from "../lib/sound";

/** Speaker button in the corner that opens music / effects volume sliders. */
export default function SoundControl() {
  const [open, setOpen] = useState(false);
  const [vol, setVol] = useState(audio.volumes);
  useEffect(() => audio.onChange(setVol), []);

  const icon = vol.muted || (vol.music === 0 && vol.sfx === 0) ? "🔇" : "🔊";
  // keep taps on the panel from making the bird flap
  const stop = (e) => e.stopPropagation();

  return (
    <div className="absolute top-3 right-3 z-30 flex flex-col items-end gap-2" onPointerDown={stop} onKeyDown={stop}>
      <button
        type="button"
        aria-label="Sound settings"
        aria-expanded={open}
        onClick={() => { audio.unlock(); setOpen((o) => !o); }}
        className="grid h-10 w-10 place-items-center rounded-full bg-slate-900/70 text-lg text-white shadow ring-1 ring-white/15 backdrop-blur"
      >
        {icon}
      </button>
      {open && (
        <div className="w-56 rounded-2xl bg-slate-900/90 p-4 text-sm text-white shadow-xl ring-1 ring-white/10 backdrop-blur">
          <label className="flex items-center justify-between font-bold">
            <span>ปิดเสียงทั้งหมด</span>
            <input type="checkbox" checked={vol.muted} onChange={(e) => audio.setMuted(e.target.checked)} className="h-4 w-4 accent-amber-400" />
          </label>
          <Slider label="🎵 เพลง" value={vol.music} onChange={(v) => audio.setMusic(v)} disabled={vol.muted} />
          <Slider label="🐤 เสียงกระโดด" value={vol.sfx} onChange={(v) => audio.setSfx(v)} disabled={vol.muted} />
        </div>
      )}
    </div>
  );
}

function Slider({ label, value, onChange, disabled }) {
  return (
    <label className={`mt-3 block ${disabled ? "opacity-40" : ""}`}>
      <span className="flex justify-between text-xs font-bold text-slate-300">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value * 100)}%</span>
      </span>
      <input
        type="range" min="0" max="1" step="0.05" value={value} disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-amber-400"
      />
    </label>
  );
}
