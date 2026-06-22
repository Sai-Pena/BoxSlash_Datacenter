"""
Read player stats from BoxSlash PlayerStore via Roblox Open Cloud.

Docs: https://create.roblox.com/docs/cloud/guides/data-stores
"""

import os
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

BASE_URL = "https://apis.roblox.com/cloud/v2"
UNIVERSE_ID = os.getenv("ROBLOX_UNIVERSE_ID", "10333992559")
DATASTORE_NAME = os.getenv("ROBLOX_DATASTORE_NAME", "PlayerStore")


def _api_key() -> str:
    key = os.getenv("ROBLOX_API_KEY", "").strip()
    if not key or key == "your-api-key-here":
        raise RuntimeError(
            "ROBLOX_API_KEY is not set. Open backend/.env and paste your API key."
        )
    return key


def _headers() -> dict:
    return {"x-api-key": _api_key()}


def entry_id_for_user(user_id: int) -> str:
    """Your game saves profiles by Roblox user ID."""
    return str(user_id)


async def fetch_profile_data(user_id: int) -> dict:
    """Load one player's PlayerStore entry from Roblox."""
    entry_id = entry_id_for_user(user_id)
    url = (
        f"{BASE_URL}/universes/{UNIVERSE_ID}/data-stores/{DATASTORE_NAME}"
        f"/entries/{entry_id}@latest"
    )

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_headers())

        if response.status_code == 401:
            raise RuntimeError(
                "Invalid or missing API key. Open backend/.env and set ROBLOX_API_KEY, "
                "then restart the backend server."
            )
        if response.status_code == 404:
            body = response.json() if response.content else {}
            message = body.get("message", "")
            if "Data store not found" in message:
                raise RuntimeError(
                    f"Datastore '{DATASTORE_NAME}' not found. Check the name in Studio "
                    "and add universe-datastores.objects:read to your API key."
                )
            raise ValueError("This player has not played BoxSlash yet (no profile found).")
        if response.status_code == 403:
            raise RuntimeError(
                "API key denied access. Add universe-datastores.objects:read scope "
                "for universe 10333992559 in the credentials dashboard."
            )
        response.raise_for_status()
        return response.json()


def map_profile_to_stats(profile_entry: dict, roblox_profile: dict) -> dict:
    """
    Convert your ProfileStore shape into the stats our website uses.
    Your game stores combat data under the Data table.
    """
    # Open Cloud wraps the saved value in a "value" field
    raw = profile_entry.get("value", profile_entry)
    data = raw.get("Data", {})

    kills = data.get("Kills", 0)
    deaths = data.get("Deaths", 0)
    air_kills = data.get("AirKills", 0)
    playtime_seconds = data.get("TotalTimePlayed", 0)

    return {
        "roblox_user_id": roblox_profile["roblox_user_id"],
        "username": roblox_profile["username"],
        "display_name": roblox_profile["display_name"],
        "avatar_url": roblox_profile["avatar_url"],
        "kills": kills,
        "deaths": deaths,
        "air_kills": air_kills,
        "avg_air_time": data.get("AverageAirTime", 0),
        "throw_kills": data.get("ThrowKills", 0),
        "slash_kills": data.get("SlashKills", 0),
        "throw_hits": data.get("ThrowHitDifference", 0),
        "slash_hits": data.get("SlashHitDifference", 0),
        "longest_streak": data.get("LongestKillStreak", 0),
        "mvps": data.get("MVPs", 0),
        "style_points": data.get("StylePoints", 0),
        "cash": data.get("Cash", 0),
        "playtime_hours": round(playtime_seconds / 3600, 1) if playtime_seconds else 0,
    }
