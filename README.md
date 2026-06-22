# BoxSlash Stat Tracker

A stat tracker website for your Roblox game **BoxSlash**. Python REST API backend + React frontend. Stats load live from your **PlayerStore** datastore.

**Repo:** https://github.com/Sai-Pena/BoxSlash_Datacenter

---

## Local Development

### Backend (Git Bash on Windows)

```bash
cd ~/dev/BoxSlash_Datacenter/backend
cp .env.example .env   # paste your Roblox API key
./venv/Scripts/uvicorn main:app --reload --host 127.0.0.1 --port 8002
```

### Frontend

```bash
cd ~/dev/BoxSlash_Datacenter/frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Deploy Online (Render + Vercel)

### Step 1 — Push code to GitHub

```bash
cd ~/dev/BoxSlash_Datacenter
git add .
git commit -m "Prepare for Render and Vercel deployment"
git push origin main
```

**Never commit `backend/.env`** — it contains your API key.

---

### Step 2 — Deploy backend on Render

1. Go to [render.com](https://render.com) and sign in with GitHub
2. **New → Blueprint** (or **Web Service**)
3. Connect repo: **Sai-Pena/BoxSlash_Datacenter**
4. If using Blueprint, Render reads `render.yaml` automatically. Otherwise set manually:

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

5. Add **Environment Variables**:

| Key | Value |
|-----|--------|
| `ROBLOX_API_KEY` | your Roblox API key (in quotes if it starts with `+`) |
| `ROBLOX_UNIVERSE_ID` | `10333992559` |
| `ROBLOX_DATASTORE_NAME` | `PlayerStore` |
| `ALLOWED_ORIGINS` | `http://localhost:5173` (add Vercel URL after Step 3) |

6. Deploy and copy your URL, e.g. `https://boxslash-api.onrender.com`
7. Test: open `https://YOUR-RENDER-URL.onrender.com/api/leaderboard`

---

### Step 3 — Deploy frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. **Add New Project** → import **Sai-Pena/BoxSlash_Datacenter**
3. Settings:

| Setting | Value |
|---------|--------|
| Root Directory | `frontend` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

4. Add **Environment Variable**:

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://YOUR-RENDER-URL.onrender.com` |

5. Deploy — you get a URL like `https://boxslash-datacenter.vercel.app`

---

### Step 4 — Connect them

1. Copy your **Vercel URL**
2. In **Render** → your service → **Environment** → update `ALLOWED_ORIGINS`:

```
http://localhost:5173,https://your-site.vercel.app
```

3. **Manual Deploy** on Render to apply the change
4. Share your **Vercel URL** — that's your public site

---

## Leaderboard Players

Edit `backend/data/tracked_players.json` to control who appears on the leaderboard:

```json
["a2onlineq", "roblox"]
```

Player lookup works for **any** username with a PlayerStore entry.

---

## Roblox API Key Setup

1. [create.roblox.com/dashboard/credentials](https://create.roblox.com/dashboard/credentials)
2. Create API key with **Restrict by Experience** → **BoxSlash Alpha**
3. Enable `universe-datastores.objects:read` (and related read scopes)
4. Paste key into Render env vars and local `backend/.env`

---

## License

MIT — Personal project for BoxSlash game development and statistics.
