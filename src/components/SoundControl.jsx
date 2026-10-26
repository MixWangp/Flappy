import { useEffect, useState } from "react";
import { audio } from "../lib/sound";
import { setLang, useLang, useT } from "../lib/i18n";

/** Speaker button in the corner that opens music / effects volume sliders. */
/** Top-right corner: language switch + speaker button that opens the volume panel. */
export default function SoundControl() {
  const t = useT();
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const [vol, setVol] = useState(audio.volumes);
  useEffect(() => audio.onChange(setVol), []);

  const icon = vol.muted || (vol.music === 0 && vol.sfx === 0) ? "🔇" : "🔊";
  // keep taps on the panel from making the bird flap
  const stop = (e) => e.stopPropagation();

  return (
    <div className="absolute top-3 right-3 z-30 flex flex-col items-end gap-2" onPointerDown={stop} onKeyDown={stop}>
      <div className="flex items-center gap-2">
      <div role="group" aria-label={t("language")} className="flex h-10 items-center rounded-full bg-slate-900/70 p-1 text-xs font-extrabold text-white shadow ring-1 ring-white/15 backdrop-blur">
        {[["th", "ไทย"], ["en", "EN"]].map(([code, label]) => (
          <button
            key={code}
            type="button"
            aria-pressed={lang === code}
            onClick={() => setLang(code)}
            className={`h-8 rounded-full px-3 transition ${lang === code ? "bg-amber-400 text-amber-950" : "text-white/80 hover:text-white"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label={t("soundSettings")}
        aria-expanded={open}
        onClick={() => { audio.unlock(); setOpen((o) => !o); }}
        className="grid h-10 w-10 place-items-center rounded-full bg-slate-900/70 text-lg text-white shadow ring-1 ring-white/15 backdrop-blur"
      >
        {icon}
      </button>
      </div>
      {open && (
        <div className="w-56 rounded-2xl bg-slate-900/90 p-4 text-sm text-white shadow-xl ring-1 ring-white/10 backdrop-blur">
          <label className="flex items-center justify-between font-bold">
            <span>{t("muteAll")}</span>
            <input type="checkbox" checked={vol.muted} onChange={(e) => audio.setMuted(e.target.checked)} className="h-4 w-4 accent-amber-400" />
          </label>
          <Slider label={t("music")} value={vol.music} onChange={(v) => audio.setMusic(v)} disabled={vol.muted} />
          <Slider label={t("jumpSfx")} value={vol.sfx} onChange={(v) => audio.setSfx(v)} disabled={vol.muted} />
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
