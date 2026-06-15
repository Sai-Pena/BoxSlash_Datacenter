"""
BoxSlash Stat Tracker — REST API

Run locally:  uvicorn main:app --reload --port 8000
Run online:   uvicorn main:app --host 0.0.0.0 --port $PORT
"""

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import database as db
from roblox_api import fetch_roblox_profile

app = FastAPI(
    title="BoxSlash Stat Tracker API",
    description="REST API for BoxSlash player stats and Roblox profile sync.",
    version="1.0.0",
)

# Local dev + your live frontend URL (set ALLOWED_ORIGINS when deploying)
default_origins = "http://localhost:5173,http://127.0.0.1:5173"
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", default_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "BoxSlash Stat Tracker API",
        "docs": "/docs",
        "endpoints": {
            "players": "GET /api/players",
            "player": "GET /api/players/{username}",
            "leaderboard": "GET /api/leaderboard",
            "sync_one": "POST /api/sync/{username}",
            "sync_all": "POST /api/sync",
        },
    }


@app.get("/api/players")
def list_players():
    """Return every tracked player."""
    players = [db.add_combat_stats(p) for p in db.get_all_players()]
    return {"players": players}


@app.get("/api/players/{username}")
def get_player(username: str):
    """Look up one player by Roblox username."""
    player = db.get_player(username)
    if not player:
        raise HTTPException(status_code=404, detail=f"Player '{username}' not found.")
    return db.add_combat_stats(player)


@app.get("/api/leaderboard")
def leaderboard():
    """Return players sorted by kills, then K/D ratio."""
    return {"leaderboard": db.get_leaderboard()}


@app.post("/api/sync/{username}")
async def sync_player(username: str):
    """
    Pull fresh Roblox profile data (avatar, display name, user id)
    for one player and save it.
    """
    player = db.get_player(username)
    if not player:
        raise HTTPException(status_code=404, detail=f"Player '{username}' not found.")

    try:
        roblox_data = await fetch_roblox_profile(username)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Roblox API error: {e}")

    updated = db.update_roblox_data(username, roblox_data)
    return {"message": f"Synced {username} from Roblox.", "player": db.add_combat_stats(updated)}


@app.post("/api/sync")
async def sync_all_players():
    """Sync Roblox profile data for every player in the database."""
    players = db.get_all_players()
    results = []

    for player in players:
        username = player["username"]
        try:
            roblox_data = await fetch_roblox_profile(username)
            updated = db.update_roblox_data(username, roblox_data)
            results.append({"username": username, "status": "ok", "player": updated})
        except Exception as e:
            results.append({"username": username, "status": "error", "error": str(e)})

    return {"synced": len([r for r in results if r["status"] == "ok"]), "results": results}
