import { useState } from "react";
import { cleanName } from "../lib/scores";

export default function NameScreen({ initial = "", onSubmit, onCancel }) {
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cleaned = cleanName(name);

  async function submit(e) {
    e.preventDefault();
    if (cleaned.length < 2) return setError("Use at least 2 characters.");
    setBusy(true);
    setError("");
    try {
      await onSubmit(cleaned);
    } catch (err) {
      console.error(err);
      setError("Couldn't save your name. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-slate-900/85 p-6 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur">
      <h2 className="text-2xl font-black">{onCancel ? "✏️ เปลี่ยนชื่อ" : "Welcome! 👋"}</h2>
      <p className="mt-1 text-sm text-slate-300">
        {onCancel ? "ชื่อในตารางจะเปลี่ยนทันที คะแนนของคุณยังอยู่ครบ ไม่หาย" : "Pick a name for the leaderboard. No account or password needed."}
      </p>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={16}
        placeholder="Your name"
        autoComplete="nickname"
        enterKeyHint="go"
        className="mt-5 w-full rounded-xl border-2 border-white/15 bg-white/10 px-4 py-3 text-lg font-bold outline-none placeholder:text-slate-500 focus:border-amber-400"
      />
      {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
      <button
        disabled={busy || cleaned.length < 2}
        className="mt-4 w-full rounded-xl bg-amber-400 py-3 text-lg font-black text-amber-950 shadow-[0_4px_0_#b45309] transition active:translate-y-1 active:shadow-none disabled:opacity-50"
      >
        {busy ? "Saving…" : onCancel ? "บันทึกชื่อ" : "Let's fly! 🐤"}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} className="mt-3 w-full text-sm text-slate-400 hover:text-white">
          ยกเลิก
        </button>
      )}
    </form>
  );
}
