import { useEffect, useRef, useState } from "react";
import { createGame } from "../game/engine";

/**
 * Mounts the canvas engine. When `interactive` is false it just idles as an animated
 * backdrop (used behind the menus).
 */
export default function Game({ interactive, onDeath }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const onDeathRef = useRef(onDeath);
  onDeathRef.current = onDeath;
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState("ready");

  useEffect(() => {
    const game = createGame(canvasRef.current, {
      onScore: setScore,
      onStart: () => setPhase("playing"),
      onDeath: (s) => { setPhase("dead"); onDeathRef.current?.(s); },
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
        <div className="pointer-events-none absolute inset-x-0 top-[6%] text-center text-6xl font-black text-white [text-shadow:0_4px_0_#7c2d12,0_0_12px_rgba(0,0,0,.35)]">
          {score}
        </div>
      )}
      {interactive && phase === "ready" && (
        <div className="pointer-events-none absolute inset-x-0 top-[55%] flex flex-col items-center gap-2 text-white">
          <div className="animate-bounce text-4xl">👆</div>
          <p className="rounded-full bg-black/35 px-4 py-1.5 text-lg font-bold">Tap, click or press Space</p>
        </div>
      )}
    </div>
  );
}
