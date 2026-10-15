import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import {
  collection, deleteDoc, doc, getDoc, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";

export const LEADERBOARD_SIZE = 20;
const LEADERBOARD = "leaderboard"; // /leaderboard/{uid} = { name, score, updatedAt }
const PLAYERS = "players"; //         /players/{uid}     = { name, updatedAt }
// "v2" keys: bumping them makes every device forget its old name and best (season reset).
const NAME_KEY = "flappy.v2.displayName";
const LOCAL_SCORES_KEY = "flappy.v2.localScores";

export function cleanName(raw) {
  return raw.replace(/[^\p{L}\p{N} _.\-!]/gu, "").replace(/\s+/g, " ").trim().slice(0, 16);
}

const storage = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

/**
 * Called once on app load.
 *  - First visit: signs in anonymously (Firebase stores the session in the browser),
 *    returns { uid, name: null } -> show the "Enter your Name" screen.
 *  - Return visit: the same anonymous uid comes back automatically, and the name is
 *    read from localStorage (or Firestore as a fallback) -> go straight to the menu.
 */
export async function initSession() {
  if (!isFirebaseConfigured) return { uid: "local", name: storage.get(NAME_KEY) };

  const user = await new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => { unsub(); resolve(u); });
  });
  const uid = user?.uid ?? (await signInAnonymously(auth)).user.uid;

  let name = storage.get(NAME_KEY);
  if (!name) {
    const snap = await getDoc(doc(db, PLAYERS, uid)).catch(() => null);
    name = snap?.exists() ? snap.data().name : null;
    if (name) storage.set(NAME_KEY, name);
  }
  return { uid, name };
}

/**
 * Saves the chosen name to localStorage and to Firestore under the anonymous uid.
 * On a rename, the player's existing leaderboard entry is relabelled too.
 */
export async function saveName(uid, name) {
  storage.set(NAME_KEY, name);
  if (!isFirebaseConfigured) return;
  await setDoc(doc(db, PLAYERS, uid), { name, updatedAt: serverTimestamp() });
  const ref = doc(db, LEADERBOARD, uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists() && snap.data().name !== name) {
      tx.set(ref, { name, score: snap.data().score, updatedAt: serverTimestamp() });
    }
  });
}

/**
 * Pushes the score to /leaderboard/{uid} only if it is a personal best.
 * Returns { best, isNewBest }.
 */
export async function submitScore(player, score) {
  if (!isFirebaseConfigured) {
    const all = readLocalScores();
    const prev = all[player.name]?.score ?? -1;
    if (score > prev) {
      all[player.name] = { name: player.name, score };
      storage.set(LOCAL_SCORES_KEY, JSON.stringify(all));
      window.dispatchEvent(new Event("local-scores"));
    }
    return { best: Math.max(prev, score), isNewBest: score > prev };
  }
  const ref = doc(db, LEADERBOARD, player.uid);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.exists() ? snap.data().score : -1;
    if (score > prev) {
      tx.set(ref, { name: player.name, score, updatedAt: serverTimestamp() });
    }
    return { best: Math.max(prev, score), isNewBest: score > prev };
  });
}

/** Removes this player's own leaderboard entry (the rules let nobody delete anyone else's). */
export async function resetMyScore(player) {
  if (!isFirebaseConfigured) {
    const all = readLocalScores();
    delete all[player.name];
    storage.set(LOCAL_SCORES_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event("local-scores"));
    return;
  }
  await deleteDoc(doc(db, LEADERBOARD, player.uid));
}

/** Real-time Top 20. Calls onData(rows) on every change; returns an unsubscribe function. */
export function subscribeLeaderboard(onData, onError) {
  if (!isFirebaseConfigured) {
    const emit = () =>
      onData(
        Object.values(readLocalScores())
          .sort((a, b) => b.score - a.score)
          .slice(0, LEADERBOARD_SIZE)
          .map((r) => ({ id: r.name, ...r }))
      );
    emit();
    window.addEventListener("local-scores", emit);
    return () => window.removeEventListener("local-scores", emit);
  }
  const q = query(collection(db, LEADERBOARD), orderBy("score", "desc"), limit(LEADERBOARD_SIZE));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

function readLocalScores() {
  try { return JSON.parse(storage.get(LOCAL_SCORES_KEY)) || {}; } catch { return {}; }
}
