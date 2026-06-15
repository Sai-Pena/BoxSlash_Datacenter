# BoxSlash Stat Tracker

A simple stat tracker website for your Roblox game **BoxSlash**. It has a Python REST API backend and a React frontend.

**Features:**
- Kill/death leaderboard for your knife throwing and slashing game
- Player lookup by Roblox username
- Sync player avatars and display names from the [Roblox Cloud API](https://create.roblox.com/docs/cloud/reference/domains/apis)
- Preset players: `roblox` and `a2onlineq` (with sample kill/death stats)

---

## Project Structure

```
BoxSlash_Datacenter/
├── backend/          # Python FastAPI REST API
│   ├── main.py       # API routes
│   ├── roblox_api.py # Calls Roblox Users + Thumbnails APIs
│   ├── database.py   # Reads/writes player stats (JSON file)
│   └── data/
│       └── players.json
└── frontend/         # React website
    └── src/
        ├── pages/    # Home, Leaderboard, Player Lookup
        └── api.js    # Talks to the backend
```

---

## Setup (First Time)

You need **Python 3.10+** and **Node.js 18+** installed.

### 1. Start the Backend

Open a terminal in the `backend` folder:

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API runs at **http://localhost:8000**.  
Open **http://localhost:8000/docs** to see all endpoints and try them out.

### 2. Start the Frontend

Open a **second** terminal in the `frontend` folder:

```bash
cd frontend
npm install
npm run dev
```

The website runs at **http://localhost:5173**.

---

## How to Use the Site

1. Go to **http://localhost:5173**
2. Click **Leaderboard** to see ranked players
3. Click **Player Lookup** and search `roblox` or `a2onlineq`
4. Click **Sync Roblox Profile** to pull their avatar and display name from Roblox

---

## How Roblox Sync Works

The backend uses two public Roblox APIs (no API key needed for these):

| Step | API | What it does |
|------|-----|--------------|
| 1 | `POST https://users.roblox.com/v1/usernames/users` | Converts username → Roblox user ID |
| 2 | `GET https://thumbnails.roblox.com/v1/users/avatar-headshot` | Gets the player's profile picture URL |

Docs:
- [Users API](https://create.roblox.com/docs/cloud/reference/domains/users)
- [Thumbnails API](https://create.roblox.com/docs/cloud/reference/features/thumbnails)

### Sync One Player (from the website)

On the **Player Lookup** page, search a player and click **Sync Roblox Profile**.

### Sync One Player (from the API)

```bash
curl -X POST http://localhost:8000/api/sync/roblox
```

### Sync All Players

```bash
curl -X POST http://localhost:8000/api/sync
```

### What Gets Updated vs What Stays the Same

| Field | Source |
|-------|--------|
| Avatar image, display name, Roblox user ID | **Roblox API** (sync updates these) |
| Kills, deaths, knife stats, aerial stats | **Your game data** (stored in `players.json`) |

Game stats are **not** on Roblox's public API — you update those yourself (see below).

The **leaderboard** only shows kills, deaths, and K/D. Extra stats appear on the **Player Lookup** page.

---

## Extra Stats (Player Lookup Only)

These fit a knife throwing/slashing + building game:

| Stat | What it means |
|------|---------------|
| `throw_kills` | Kills from thrown knives |
| `slash_kills` | Kills from melee slashes |
| `knife_throws` | Total knives thrown |
| `longest_streak` | Best kill streak in one life |
| `air_kills` | Kills scored while in the air |
| `avg_air_time` | Average seconds in air when getting a kill |
| `air_kill_rate` | Auto-calculated: air kills ÷ total kills (shown as %) |

---

## How to Update Player Game Stats

Edit `backend/data/players.json`. Each player looks like this:

```json
{
  "username": "a2onlineq",
  "kills": 2103,
  "deaths": 1104,
  "air_kills": 521,
  "avg_air_time": 2.3,
  "throw_kills": 1200,
  "slash_kills": 903,
  "knife_throws": 6800,
  "longest_streak": 18
}
```

Change the numbers, save the file, and refresh the website. No restart needed.

### Adding a New Player

Add a new entry to `players.json` (use lowercase as the key):

```json
"newplayer": {
  "username": "newplayer",
  "roblox_user_id": null,
  "display_name": "newplayer",
  "avatar_url": null,
  "kills": 0,
  "deaths": 0,
  "air_kills": 0,
  "avg_air_time": 0,
  "throw_kills": 0,
  "slash_kills": 0,
  "knife_throws": 0,
  "longest_streak": 0,
  "last_synced": null
}
```

Then run `POST /api/sync/newplayer` to pull their Roblox profile.

---

## Connecting Your Roblox Game (Future Idea)

Right now stats are edited manually. Later you can have your Roblox game send stats to this API:

1. In your Roblox game, use `HttpService` to `POST` stats when a match ends
2. Add a new endpoint in `main.py` like `POST /api/stats/update`
3. Your game sends: `{ "username": "...", "kills": 5, "deaths": 2 }`

That way stats update automatically when people play.

---

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/players` | List all players |
| GET | `/api/players/{username}` | Get one player's stats |
| GET | `/api/leaderboard` | Ranked leaderboard |
| POST | `/api/sync/{username}` | Sync one player from Roblox |
| POST | `/api/sync` | Sync all players from Roblox |

---

## Leaderboard Ranking

Players are ranked by **total kills** first. If two players have the same kills, the one with the higher **K/D ratio** ranks higher.

You can change this in `backend/database.py` in the `_leaderboard_sort_key` function.

---

## Troubleshooting

**"Player not found"** — Make sure the username is in `players.json` (lowercase key).

**Avatar not showing** — Click **Sync Roblox Profile** or run the sync API endpoint.

**Frontend can't reach backend** — Make sure the backend is running on port 8000.

**CORS errors** — The backend already allows `localhost:5173`. If you use a different port, edit `main.py`.

---

## License

Personal project for BoxSlash game development and statistics.
