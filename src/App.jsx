import { useCallback, useEffect, useRef, useState } from "react";
import Game from "./components/Game";
import Leaderboard from "./components/Leaderboard";
import NameScreen from "./components/NameScreen";
import { isFirebaseConfigured } from "./lib/firebase";
import { randomDeathCaption } from "./game/engine";
import { initSession, saveName, submitScore, subscribeLeaderboard } from "./lib/scores";

const BEST_KEY = "flappy.best";
const readBest = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } };

// screens: loading | error | name | rename | menu | playing | gameover
export default function App() {
  const [screen, setScreen] = useState("loading");
  const [player, setPlayer] = useState(null); // { uid, name }
  const [initError, setInitError] = useState("");
  const [board, setBoard] = useState({ rows: [], status: "loading" });
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState(null); // { score, best, isNewBest, saving, error }
  const [best, setBest] = useState(readBest);
  const canRestartAt = useRef(0);

  // 1) Anonymous sign-in + remember who this browser belongs to.
  const boot = useCallback(() => {
    setScreen("loading");
    initSession()
      .then((session) => {
        setPlayer(session);
        setScreen(session.name ? "menu" : "name");
      })
      .catch((err) => {
        console.error(err);
        setInitError(
          err?.code === "auth/admin-restricted-operation" || err?.code === "auth/operation-not-allowed"
            ? "Anonymous sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method."
            : `Couldn't connect to the game server. Check your connection and try again. (${err?.code || err?.message || "unknown"})`
        );
        setScreen("error");
      });
  }, []);
  useEffect(boot, [boot]);

  // 2) One real-time leaderboard subscription for the whole app.
  useEffect(
    () =>
      subscribeLeaderboard(
        (rows) => setBoard({ rows, status: "ready" }),
        (err) => { console.error(err); setBoard((b) => ({ ...b, status: "error" })); }
      ),
    []
  );

  // Keep personal best in sync with the server copy (e.g. on a new device with the same session).
  useEffect(() => {
    const mine = board.rows.find((r) => r.id === player?.uid);
    if (mine && mine.score > best) setBest(mine.score);
  }, [board.rows, player, best]);

  const handleName = async (name) => {
    await saveName(player.uid, name);
    setPlayer((p) => ({ ...p, name }));
    setScreen("menu");
  };

  const startGame = useCallback(() => {
    setResult(null);
    setRunId((n) => n + 1); // fresh world
    setScreen("playing");
  }, []);

  // 3) On death: push the score only if it is a personal best.
  const handleDeath = useCallback(
    (score) => {
      canRestartAt.current = performance.now() + 700;
      const localBest = readBest();
      const isNewBest = score > localBest;
      if (isNewBest) {
        try { localStorage.setItem(BEST_KEY, String(score)); } catch { /* ignore */ }
        setBest(score);
      }
      setResult({ score, best: Math.max(localBest, score), isNewBest, saving: true, caption: randomDeathCaption() });
      setTimeout(() => setScreen("gameover"), 650);

      submitScore(player, score)
        .then((r) => setResult((prev) => prev && { ...prev, best: r.best, isNewBest: r.isNewBest, saving: false }))
        .catch((err) => {
          console.error(err);
          setResult((prev) => prev && { ...prev, saving: false, error: err?.code || err?.message || "unknown" });
        });
    },
    [player]
  );

  // Space / Enter on the menu or game-over screen starts a new run.
  useEffect(() => {
    if (screen !== "menu" && screen !== "gameover") return;
    const onKey = (e) => {
      if ((e.code === "Space" || e.code === "Enter") && performance.now() > canRestartAt.current) {
        e.preventDefault();
        startGame();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, startGame]);

  const inGame = screen === "playing";

  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 sm:p-4">
      <main className="relative h-full w-full max-w-[520px] overflow-hidden bg-sky-300 sm:max-h-[900px] sm:rounded-[28px] sm:shadow-2xl sm:ring-4 sm:ring-white/10">
        <Game key={runId} interactive={inGame} onDeath={handleDeath} />

        {!inGame && <div className="absolute inset-0 bg-slate-950/30" />}

        {!isFirebaseConfigured && (
          <div className="absolute inset-x-0 top-0 z-20 bg-amber-500 px-3 py-1 text-center text-xs font-bold text-amber-950">
            Offline mode: add your Firebase keys to enable the global leaderboard
          </div>
        )}

        {screen === "loading" && (
          <Overlay><p className="animate-pulse text-xl font-black text-white">Loading…</p></Overlay>
        )}

        {screen === "error" && (
          <Overlay>
            <div className="max-w-sm rounded-3xl bg-slate-900/90 p-6 text-center text-white">
              <p className="text-4xl">😵</p>
              <p className="mt-2 font-semibold">{initError}</p>
              <PrimaryButton onClick={boot} className="mt-4">Retry</PrimaryButton>
            </div>
          </Overlay>
        )}

        {(screen === "name" || screen === "rename") && (
          <Overlay>
            <Title />
            <NameScreen
              initial={screen === "rename" ? player?.name : ""}
              onSubmit={handleName}
              onCancel={screen === "rename" ? () => setScreen("menu") : undefined}
            />
          </Overlay>
        )}

        {screen === "menu" && (
          <Overlay>
            <Title />
            <div className="flex w-full max-w-sm items-center justify-between rounded-2xl bg-slate-900/80 px-4 py-3 text-white">
              <div className="min-w-0">
                <p className="text-[11px] tracking-wider text-slate-400 uppercase">Playing as</p>
                <p className="truncate text-lg font-black">{player?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] tracking-wider text-slate-400 uppercase">Best</p>
                <p className="text-lg font-black text-amber-300">{best}</p>
              </div>
            </div>
            <PrimaryButton onClick={startGame} className="w-full max-w-sm">▶ PLAY</PrimaryButton>
            <button onClick={() => setScreen("rename")} className="-mt-1 text-xs font-semibold text-white/80 underline-offset-2 hover:underline">
              Change name
            </button>
            <BoardPanel board={board} uid={player?.uid} />
          </Overlay>
        )}

        {screen === "gameover" && result && (
          <Overlay>
            <div className="flex shrink-0 flex-col items-center gap-0.5">
              <p className="rounded-full bg-black/35 px-3 py-0.5 text-xs font-extrabold tracking-[2px] text-white uppercase">Game over</p>
              <h2 className="meme-caption text-center text-[clamp(44px,13vw,62px)] leading-[1.05] text-balance text-white uppercase">
                {result.caption}
              </h2>
            </div>
            <div className="grid w-full max-w-sm grid-cols-2 gap-3 rounded-2xl bg-slate-900/85 p-4 text-center text-white">
              <div>
                <p className="text-[11px] tracking-wider text-slate-400 uppercase">Score</p>
                <p className="text-4xl font-black">{result.score}</p>
              </div>
              <div>
                <p className="text-[11px] tracking-wider text-slate-400 uppercase">Best</p>
                <p className="text-4xl font-black text-amber-300">{result.best}</p>
              </div>
              <p className="col-span-2 h-5 text-sm font-bold">
                {result.saving ? (
                  <span className="text-slate-400">Saving…</span>
                ) : result.error ? (
                  <span className="text-rose-300">Couldn't save your score ({result.error})</span>
                ) : result.isNewBest ? (
                  <span className="text-emerald-300">🎉 New personal best!</span>
                ) : (
                  <span className="text-slate-400">Beat {result.best} to climb the board</span>
                )}
              </p>
            </div>
            <div className="flex w-full max-w-sm gap-3">
              <button
                onClick={() => setScreen("menu")}
                className="flex-1 rounded-xl bg-white/90 py-3 font-black text-slate-800 shadow-[0_4px_0_#64748b] active:translate-y-1 active:shadow-none"
              >
                Menu
              </button>
              <PrimaryButton onClick={startGame} className="flex-[2]">↻ Play again</PrimaryButton>
            </div>
            <BoardPanel board={board} uid={player?.uid} />
          </Overlay>
        )}
      </main>
    </div>
  );
}

function Overlay({ children }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 overflow-hidden px-4 pt-10 pb-6">
      {children}
    </div>
  );
}

function BoardPanel({ board, uid }) {
  return (
    <div className="flex min-h-0 w-full max-w-sm flex-1 flex-col sm:max-h-[420px]">
      <Leaderboard rows={board.rows} status={board.status} myUid={uid} />
    </div>
  );
}

function Title() {
  return (
    <h1 className="shrink-0 text-center font-[Mitr,sans-serif] text-5xl leading-[1.15] font-bold text-amber-300 [text-shadow:0_4px_0_#7c2d12,0_8px_16px_rgba(0,0,0,.35)] sm:text-6xl">
      นกน้อย
      <br />
      <span className="text-white">จอมกวน</span>
    </h1>
  );
}

function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`rounded-xl bg-amber-400 py-3 text-xl font-black text-amber-950 shadow-[0_4px_0_#b45309] transition active:translate-y-1 active:shadow-none ${className}`}
    >
      {children}
    </button>
  );
}
