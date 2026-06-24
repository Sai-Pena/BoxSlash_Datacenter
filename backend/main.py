"""
BoxSlash Stat Tracker — REST API

Stats are loaded live from your Roblox PlayerStore datastore.
The API key stays on the server — never put it in the React frontend.

Run locally:  uvicorn main:app --reload --port 8000
Run online:   uvicorn main:app --host 0.0.0.0 --port $PORT
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env BEFORE other local imports so the API key is available
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

import database as db

app = FastAPI(
    title="BoxSlash Stat Tracker API",
    description="REST API for BoxSlash player stats from Roblox PlayerStore.",
    version="2.0.0",
)

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
        "data_source": "Roblox PlayerStore (live)",
        "endpoints": {
            "player": "GET /api/players/{username}",
            "leaderboard": "GET /api/leaderboard",
            "tracked": "GET /api/tracked",
        },
    }


@app.get("/api/tracked")
def tracked_players():
    """Usernames shown on the leaderboard."""
    return {"tracked": db.get_tracked_usernames()}


@app.get("/api/players/{username}")
async def get_player(username: str):
    """Look up one player by Roblox username (live from datastore)."""
    try:
        return await db.fetch_player(username)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Roblox API error: {e}")


@app.get("/api/leaderboard")
async def leaderboard(profiles: bool = Query(True, description="Fetch Roblox usernames and avatars")):
    """Return players sorted by kills, then K/D ratio."""
    try:
        return {"leaderboard": await db.fetch_leaderboard(include_profiles=profiles)}
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Roblox API error: {e}")


@app.get("/api/leaderboard/profiles")
async def leaderboard_profiles(ids: str = Query(..., description="Comma-separated Roblox user IDs")):
    """Fetch profile details for leaderboard rows (usernames, avatars)."""
    try:
        user_ids = [int(part.strip()) for part in ids.split(",") if part.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="ids must be comma-separated numbers")

    if not user_ids:
        return {"profiles": {}}

    if len(user_ids) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 user IDs per request")

    try:
        profiles = await db.fetch_leaderboard_profiles(user_ids)
        return {
            "profiles": {
                str(user_id): {
                    "username": profile["username"],
                    "display_name": profile.get("display_name", profile["username"]),
                    "avatar_url": profile.get("avatar_url"),
                }
                for user_id, profile in profiles.items()
            }
        }
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Roblox API error: {e}")
