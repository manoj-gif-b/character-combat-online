# Character Combat — Online Multiplayer

## Files
- `server.js` — Node.js + Socket.io server
- `package.json` — dependencies
- `public/index.html` — the full game (served by the server)

## Deploy to Railway (FREE — 5 minutes)

### Step 1 — Upload to GitHub
1. Go to github.com → New repository → name it `character-combat-online`
2. Upload all 3 files: `server.js`, `package.json`, and the `public/` folder with `index.html` inside

### Step 2 — Deploy on Railway
1. Go to **railway.app** → Sign up free with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select your `character-combat-online` repo
4. Railway auto-detects Node.js and deploys it
5. Click **Settings → Networking → Generate Domain**
6. You get a URL like `https://character-combat-online.up.railway.app`

### Step 3 — Share & Play
- Send your Railway URL to a friend
- One player clicks **ONLINE → CREATE ROOM** → gets a 4-digit code
- Friend opens same URL → clicks **ONLINE → JOIN ROOM** → enters code
- Game starts automatically!

## How Online Play Works
- Server runs all game logic (dice rolls happen server-side — no cheating!)
- Each player only controls their own dice
- Room codes expire when players disconnect
- Supports rematch without leaving the room
