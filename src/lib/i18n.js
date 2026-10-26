import { useSyncExternalStore } from "react";

// Thai / English UI text. The meme parade in the background stays a deliberate Thai–English mix.
const STRINGS = {
  th: {
    subtitle: "",
    playingAs: "ผู้เล่น",
    best: "สถิติ",
    score: "คะแนน",
    play: "▶ เล่นเลย",
    rename: "✏️ เปลี่ยนชื่อ",
    resetIdle: "🗑️ รีเซ็ตคะแนนของฉัน",
    resetConfirm: "แน่ใจนะ? กดอีกครั้งเพื่อลบ",
    resetBusy: "กำลังลบ…",
    resetDone: "รีเซ็ตแล้ว ✓",
    resetError: "ลบไม่สำเร็จ ลองใหม่",
    gameOver: "จบเกม",
    saving: "กำลังบันทึก…",
    saveFailed: "บันทึกคะแนนไม่สำเร็จ ({code})",
    newBest: "🎉 ทำลายสถิติตัวเอง!",
    beatToClimb: "ทำให้เกิน {best} เพื่อไต่อันดับ",
    menu: "เมนู",
    playAgain: "↻ เล่นอีก",
    loading: "กำลังโหลด…",
    retry: "ลองใหม่",
    offline: "โหมดออฟไลน์: ใส่ค่า Firebase เพื่อเปิดตารางคะแนนรวม",
    errAnon: "ยังไม่ได้เปิด Anonymous sign-in ใน Firebase Console → Authentication → Sign-in method",
    errConnect: "เชื่อมต่อเซิร์ฟเวอร์เกมไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่ ({code})",
    welcome: "ยินดีต้อนรับ! 👋",
    renameTitle: "✏️ เปลี่ยนชื่อ",
    nameSubFirst: "ตั้งชื่อที่จะโชว์ในตารางคะแนน ไม่ต้องสมัครหรือใช้รหัสผ่าน",
    nameSubRename: "ชื่อในตารางจะเปลี่ยนทันที คะแนนของคุณยังอยู่ครบ ไม่หาย",
    namePlaceholder: "ชื่อของคุณ",
    nameMin: "ใส่อย่างน้อย 2 ตัวอักษร",
    nameSaveErr: "บันทึกชื่อไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่",
    letsFly: "บินเลย! 🐤",
    saveName: "บันทึกชื่อ",
    cancel: "ยกเลิก",
    boardTitle: "🌍 Top 20 ทั่วโลก",
    live: "สด",
    loadingScores: "กำลังโหลดคะแนน…",
    boardError: "โหลดตารางคะแนนไม่ได้ ลองรีเฟรชหน้า",
    noScores: "ยังไม่มีคะแนน มาเป็นคนแรกเลย!",
    rank: "อันดับ",
    name: "ชื่อ",
    you: " (คุณ)",
    hint: "แตะ คลิก หรือกด Space",
    level: "ด่าน {n}",
    maxLevel: "ด่านสูงสุด",
    soundSettings: "ตั้งค่าเสียง",
    muteAll: "ปิดเสียงทั้งหมด",
    music: "🎵 เพลง",
    jumpSfx: "🐤 เสียงกระโดด",
    language: "ภาษา",
  },
  en: {
    subtitle: "Cheeky Little Bird",
    playingAs: "Playing as",
    best: "Best",
    score: "Score",
    play: "▶ PLAY",
    rename: "✏️ Change name",
    resetIdle: "🗑️ Reset my score",
    resetConfirm: "Sure? Tap again to delete",
    resetBusy: "Deleting…",
    resetDone: "Score reset ✓",
    resetError: "Couldn't reset, try again",
    gameOver: "Game over",
    saving: "Saving…",
    saveFailed: "Couldn't save your score ({code})",
    newBest: "🎉 New personal best!",
    beatToClimb: "Beat {best} to climb the board",
    menu: "Menu",
    playAgain: "↻ Play again",
    loading: "Loading…",
    retry: "Retry",
    offline: "Offline mode: add your Firebase keys to enable the global leaderboard",
    errAnon: "Anonymous sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method.",
    errConnect: "Couldn't connect to the game server. Check your connection and try again. ({code})",
    welcome: "Welcome! 👋",
    renameTitle: "✏️ Change your name",
    nameSubFirst: "Pick a name for the leaderboard. No account or password needed.",
    nameSubRename: "Your name updates on the leaderboard right away. Your score stays.",
    namePlaceholder: "Your name",
    nameMin: "Use at least 2 characters.",
    nameSaveErr: "Couldn't save your name. Check your connection and try again.",
    letsFly: "Let's fly! 🐤",
    saveName: "Save name",
    cancel: "Cancel",
    boardTitle: "🌍 Global Top 20",
    live: "LIVE",
    loadingScores: "Loading scores…",
    boardError: "Couldn't load the leaderboard. Try reloading the page.",
    noScores: "No scores yet. Be the first!",
    rank: "Rank",
    name: "Name",
    you: " (you)",
    hint: "Tap, click or press Space",
    level: "Level {n}",
    maxLevel: "Max level",
    soundSettings: "Sound settings",
    muteAll: "Mute everything",
    music: "🎵 Music",
    jumpSfx: "🐤 Jump sounds",
    language: "Language",
  },
};

const KEY = "flappy.v2.lang";
const subscribers = new Set();
let lang = (() => {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "th" || saved === "en") return saved;
  } catch { /* ignore */ }
  return "th"; // the game is Thai first; players can switch to English
})();
document.documentElement.lang = lang;

export function setLang(next) {
  lang = next;
  try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
  document.documentElement.lang = next;
  subscribers.forEach((fn) => fn());
}

export function useLang() {
  return useSyncExternalStore(
    (cb) => { subscribers.add(cb); return () => subscribers.delete(cb); },
    () => lang,
  );
}

/** Returns t(key, vars): the string for the current language with {placeholders} filled in. */
export function useT() {
  const current = useLang();
  return (key, vars = {}) =>
    (STRINGS[current][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}
