import { useT } from "../lib/i18n";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ rows, status, myUid }) {
  const t = useT();
  return (
    <div className="flex min-h-0 flex-col rounded-2xl bg-slate-900/85 text-white shadow-xl ring-1 ring-white/10 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <h2 className="text-sm font-black tracking-wider uppercase">{t("boardTitle")}</h2>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> {t("live")}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {status === "loading" && <p className="p-4 text-center text-sm text-slate-400">{t("loadingScores")}</p>}
        {status === "error" && (
          <p className="p-4 text-center text-sm text-rose-300">{t("boardError")}</p>
        )}
        {status === "ready" && rows.length === 0 && (
          <p className="p-4 text-center text-sm text-slate-400">{t("noScores")}</p>
        )}
        {status === "ready" && rows.length > 0 && (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-900 text-[11px] text-slate-400 uppercase">
              <tr>
                <th className="w-14 py-1.5 pl-4 text-left font-semibold">{t("rank")}</th>
                <th className="py-1.5 text-left font-semibold">{t("name")}</th>
                <th className="py-1.5 pr-4 text-right font-semibold">{t("score")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const me = r.id === myUid;
                return (
                  <tr key={r.id} className={me ? "bg-amber-400/20 font-bold text-amber-200" : "odd:bg-white/[.03]"}>
                    <td className="py-1.5 pl-4 tabular-nums">{MEDALS[i] ?? `#${i + 1}`}</td>
                    <td className="max-w-0 truncate py-1.5">{r.name}{me && t("you")}</td>
                    <td className="py-1.5 pr-4 text-right font-mono tabular-nums">{r.score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
