# 🐤 นกน้อยจอมกวน (Flappy Friends)

A Flappy Bird–style web game with **frictionless online play**: friends open one link, type a name once, and compete on a **real-time global Top 20 leaderboard**. They don't need an email or a password.

Built with React 19, Tailwind CSS 4, Vite, and Firebase (Anonymous Auth + Firestore).

---

## How it works

| Step | What happens |
|---|---|
| First visit | `signInAnonymously()` gives the browser a permanent Firebase UID, and the player sees **"Enter your Name"**. |
| Name entered | Saved to `localStorage` **and** to Firestore at `players/{uid}`. |
| Every later visit | Firebase restores the same anonymous UID automatically and the name is read from `localStorage` (or from Firestore if localStorage was wiped). The player goes **straight to the Main Menu**. |
| Player dies | The score is written to `leaderboard/{uid}` **only if it's a personal best** (checked in a transaction; the security rules also block lowering a score). |
| Leaderboard | A live `onSnapshot` query (`orderBy score desc, limit 20`) runs on the Main Menu and the Game Over screen. Everyone sees new high scores instantly. |

**Controls:** Spacebar / ↑ / W, mouse click, or tap. On the menu and Game Over screens, Space or Enter starts a new run.

**Progressive difficulty** (see `difficulty()` in `src/game/engine.js`): the game gets harder in steps, one level every 10 points, and reaches its hardest at **100+ points** (level 10). Pipes start moving up and down at **10 points**. Each level adds scroll speed (190 to 400), shrinks the gap (175 to 115), brings pipes closer together, and makes the moving pipes swing wider and faster. A level badge under the score shows the current level.

### Project structure

```
flappy-friends/
├── index.html
├── vite.config.js          # accepts REACT_APP_* env vars
├── .env.example            # Firebase config placeholders
├── firestore.rules         # security rules (paste into the Firebase console)
├── netlify.toml            # Netlify build settings
└── src/
    ├── main.jsx
    ├── index.css           # Tailwind
    ├── App.jsx             # screens: name → menu → playing → game over
    ├── lib/
    │   ├── firebase.js     # Firebase initialization
    │   └── scores.js       # anonymous auth, name, personal-best submit, live leaderboard
    ├── game/
    │   └── engine.js       # canvas game loop, physics, collisions, difficulty
    └── components/
        ├── Game.jsx        # mounts the engine, handles input, shows the score HUD
        ├── Leaderboard.jsx # Rank / Name / Score table
        └── NameScreen.jsx  # "Enter your Name"
```

### Firestore data model

```
players/{uid}      { name: string, updatedAt: timestamp }
leaderboard/{uid}  { name: string, score: int, updatedAt: timestamp }   ← one row per player (their best)
```

---

## 0. Run it locally (2 minutes)

You need [Node.js 20+](https://nodejs.org).

```bash
npm install
npm run dev          # open http://localhost:5173
```

Without Firebase keys the game runs in **offline mode** (an orange banner is shown, and scores are kept in your browser only). This lets you check that everything works before you set up Firebase.

---

## 1. Create the free Firebase project

1. Go to **https://console.firebase.google.com** → **Create a project** (Add project).
   - Name it, e.g. `flappy-friends`. You can turn Google Analytics off. Click **Create**.
   - The free **Spark** plan is enough. You don't need a credit card.

2. **Enable Anonymous Auth**
   - Left menu → **Build → Authentication** → **Get started**.
   - **Sign-in method** tab → **Anonymous** → toggle **Enable** → **Save**.

3. **Create the Firestore database**
   - Left menu → **Build → Firestore Database** → **Create database**.
   - Pick a location near you and your friends. *This can't be changed later.*
   - Choose **Start in production mode** → **Create**.
   - You don't need to create collections by hand. `players` and `leaderboard` appear automatically when the first player joins.

4. **Paste the security rules**
   - Firestore → **Rules** tab → replace everything with the contents of [`firestore.rules`](./firestore.rules) → **Publish**.
   - These rules mean:
     - anyone can **read** the leaderboard;
     - a player can only write **their own** row (`request.auth.uid == uid`);
     - names must be 1–16 characters and scores whole numbers from 0 to 9999;
     - a score can **never go down**, and nobody can delete rows.

5. **Get your web config**
   - Click the ⚙️ gear → **Project settings** → **General** → scroll to **Your apps** → click the **`</>`** (Web) icon.
   - Nickname: `flappy-web` → **Register app** (you don't need Firebase Hosting).
   - You'll see a `firebaseConfig = { apiKey: ..., authDomain: ..., ... }` object. Keep this page open.

6. **Add the keys locally** (optional, for testing)
   ```bash
   cp .env.example .env.local
   ```
   Fill in each value from `firebaseConfig`:

   | `.env.local` key | `firebaseConfig` field |
   |---|---|
   | `REACT_APP_FIREBASE_API_KEY` | `apiKey` |
   | `REACT_APP_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `REACT_APP_FIREBASE_PROJECT_ID` | `projectId` |
   | `REACT_APP_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `REACT_APP_FIREBASE_APP_ID` | `appId` |

   Restart `npm run dev`. The orange banner disappears, and your scores now go to Firestore. You can watch them appear in **Firestore → Data**.

   > Firebase web API keys are not secrets. They only identify your project, and the security rules above protect your data. Still, keep `.env.local` out of git (it's already in `.gitignore`).

---

## 2. Put the code on GitHub

Both Vercel and Netlify deploy straight from a GitHub repository.

1. Create an empty repository at **https://github.com/new** (e.g. `flappy-friends`). Don't add a README.
2. In this folder:
   ```bash
   git init            # skip if you already have a .git folder
   git add .
   git commit -m "Flappy Friends"
   git branch -M main
   git remote add origin https://github.com/<your-username>/flappy-friends.git
   git push -u origin main
   ```

---

## 3a. Deploy on Vercel (free)

1. Go to **https://vercel.com** → sign up with GitHub.
2. **Add New… → Project** → **Import** your `flappy-friends` repo.
3. Vercel detects **Vite** automatically (Build command `npm run build`, Output directory `dist`). Leave both as they are.
4. Open **Environment Variables** and add the **6 `REACT_APP_FIREBASE_*` keys** with your values (copy them from `.env.local`; you can paste all the lines at once).
5. Click **Deploy**. After about a minute you'll get a link like **`https://flappy-friends.vercel.app`** 🎉

## 3b. …or deploy on Netlify (free)

1. Go to **https://app.netlify.com** → sign up with GitHub.
2. **Add new site → Import an existing project → GitHub** → choose the repo.
3. The build settings come from `netlify.toml` (`npm run build` → `dist`).
4. Click **Add environment variables** and add the same **6 `REACT_APP_FIREBASE_*` keys**.
5. Click **Deploy**. You'll get a link like `https://random-name-123.netlify.app`. You can rename it under **Site configuration → Change site name**.

> ⚠️ Environment variables are baked in **at build time**. If you add or change them after deploying, trigger a redeploy (Vercel: **Deployments → ⋯ → Redeploy**; Netlify: **Deploys → Trigger deploy**).

---

## 4. Lock Firebase to your domain (recommended, 1 minute)

- **Authentication → Settings → Authorized domains** → **Add domain** → add your `xxx.vercel.app` or `xxx.netlify.app` domain. (`localhost` is already on the list.)
- Optional: in **Google Cloud Console → APIs & Services → Credentials**, restrict the browser API key to your site's URL.

**Send the link to your friends.** Each person types a name once and is remembered on that browser from then on.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Anonymous sign-in is disabled" | Authentication → Sign-in method → enable **Anonymous**. |
| "Couldn't load the leaderboard" | Check that the Firestore database exists and that you **published** the rules. |
| "Couldn't save your score" | The rules weren't published, or the env vars point to a different project. Open the browser console for details. |
| Orange "Offline mode" banner on the live site | The env vars are missing on Vercel/Netlify. Add them and **redeploy**. |
| A friend shows up twice | They played from two browsers/devices, so each one gets its own anonymous ID. Clearing browser data also creates a new ID. |

## Notes and limits

- **Identity is per browser.** That's the trade-off for having no login. Incognito windows and cleared site data create a new player.
- **Cheating:** the rules stop players from editing other people's scores or lowering scores, but a determined friend could still post a fake score for themselves from the browser console. That's fine among friends. Real anti-cheat needs server-side validation (e.g. a Cloud Function that replays inputs).
- **Free tier:** Firestore Spark gives 50k reads and 20k writes per day. Each leaderboard listener reads ≤20 documents on open, plus 1 per change, so that's plenty for a friend group.
