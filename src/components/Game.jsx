import { useEffect, useRef, useState } from "react";
import { MAX_LEVEL, createGame, difficulty } from "../game/engine";
import { audio } from "../lib/sound";
import { useT } from "../lib/i18n";

/**
 * Mounts the canvas engine. When `interactive` is false it just idles as an animated
 * backdrop (used behind the menus).
 */
export default function Game({ interactive, onDeath }) {
  const t = useT();
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const onDeathRef = useRef(onDeath);
  onDeathRef.current = onDeath;
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState("ready");

  useEffect(() => {
    const game = createGame(canvasRef.current, {
      onScore: (s) => { setScore(s); audio.score(); },
      onFlap: () => audio.jump(),
      onStart: () => setPhase("playing"),
      onDeath: (s) => { setPhase("dead"); audio.death(); onDeathRef.current?.(s); },
    });
    gameRef.current = game;
    return () => game.destroy();
  }, []);

  useEffect(() => {
    if (!interactive) return;
    const onKey = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        if (!e.repeat) gameRef.current?.flap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [interactive]);

  return (
    <div
      className="absolute inset-0 touch-none select-none"
      onPointerDown={interactive ? (e) => { e.preventDefault(); gameRef.current?.flap(); } : undefined}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      {interactive && phase !== "dead" && (
        <div className="pointer-events-none absolute inset-x-0 top-[6%] flex flex-col items-center gap-2">
          <div className="text-6xl font-black text-white [text-shadow:0_4px_0_#7c2d12,0_0_12px_rgba(0,0,0,.35)]">{score}</div>
          <LevelBadge level={difficulty(score).level} />
        </div>
      )}
      {interactive && phase === "ready" && (
        <div className="pointer-events-none absolute inset-x-0 top-[55%] flex flex-col items-center gap-2 text-white">
          <div className="animate-bounce text-4xl">👆</div>
          <p className="rounded-full bg-black/35 px-4 py-1.5 text-lg font-bold">{t("hint")}</p>
        </div>
      )}
    </div>
  );
}

function LevelBadge({ level }) {
  const t = useT();
  const max = level >= MAX_LEVEL;
  return (
    <div
      key={level} // remount on level change to replay the pop animation
      className={`animate-[pop_.6s_ease-out] rounded-full px-3 py-0.5 text-[13px] font-extrabold tracking-[1.5px] uppercase ${
        max ? "bg-rose-400 text-rose-950" : "bg-black/30 text-white"
      }`}
    >
      {max ? t("maxLevel") : t("level", { n: level })}
    </div>
  );
}
