"""
Read player stats from BoxSlash PlayerStore via Roblox Open Cloud.

Docs: https://create.roblox.com/docs/cloud/guides/data-stores
"""

import os
import re
from pathlib import Path
from urllib.parse import quote

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

BASE_URL = "https://apis.roblox.com/cloud/v2"
UNIVERSE_ID = os.getenv("ROBLOX_UNIVERSE_ID", "10333992559")
DATASTORE_NAME = os.getenv("ROBLOX_DATASTORE_NAME", "PlayerStore")
LEADERBOARD_LIMIT = 100


def _api_key() -> str:
    key = os.getenv("ROBLOX_API_KEY", "").strip()
    if not key or key == "your-api-key-here":
        raise RuntimeError(
            "ROBLOX_API_KEY is not set. Open backend/.env and paste your API key."
        )
    return key


def _headers() -> dict:
    return {"x-api-key": _api_key()}


def _check_response_errors(response: httpx.Response) -> None:
    if response.status_code == 401:
        raise RuntimeError(
            "Invalid or missing API key. Open backend/.env and set ROBLOX_API_KEY, "
            "then restart the backend server."
        )
    if response.status_code == 403:
        raise RuntimeError(
            "API key denied access. Add universe-datastores.objects:read scope "
            "for universe 10333992559 in the credentials dashboard."
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


def entry_id_for_user(user_id: int) -> str:
    """Your game saves profiles by Roblox user ID."""
    return str(user_id)


def parse_user_id_from_entry_id(entry_id: str) -> int | None:
    """Handle entry ids like '274972141' or 'global/274972141'."""
    if not entry_id:
        return None
    cleaned = entry_id
    if cleaned.startswith("global/"):
        cleaned = cleaned.split("/", 1)[1]
    if not re.fullmatch(r"\d+", cleaned):
        return None
    return int(cleaned)


def safe_int(value, default: int = 0) -> int:
    try:
        if value is None:
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def safe_float(value, default: float = 0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def extract_data_table(profile_entry: dict) -> dict | None:
    """
    Pull the Data table from a PlayerStore entry.
    Returns None if the shape is too broken to use.
    """
    if not isinstance(profile_entry, dict):
        return None

    raw = profile_entry.get("value", profile_entry)
    if not isinstance(raw, dict):
        return None

    data = raw.get("Data")
    if data is None:
        # Some older entries might store stats at the top level
        if any(key in raw for key in ("Kills", "Deaths", "kills", "deaths")):
            return raw
        return None

    if not isinstance(data, dict):
        return None

    return data


def parse_stats_from_data(data: dict, user_id: int) -> dict | None:
    """Convert a Data table into stats. Returns None if parsing fails completely."""
    try:
        kills = safe_int(data.get("Kills", data.get("kills")))
        deaths = safe_int(data.get("Deaths", data.get("deaths")))
        air_kills = safe_int(data.get("AirKills", data.get("air_kills")))
        playtime_seconds = safe_int(data.get("TotalTimePlayed", data.get("playtime")))

        return {
            "roblox_user_id": user_id,
            "kills": kills,
            "deaths": deaths,
            "air_kills": air_kills,
            "avg_air_time": safe_float(data.get("AverageAirTime", data.get("avg_air_time"))),
            "throw_kills": safe_int(data.get("ThrowKills", data.get("throw_kills"))),
            "slash_kills": safe_int(data.get("SlashKills", data.get("slash_kills"))),
            "throw_hits": safe_int(data.get("ThrowHitDifference")),
            "slash_hits": safe_int(data.get("SlashHitDifference")),
            "longest_streak": safe_int(data.get("LongestKillStreak", data.get("longest_streak"))),
            "mvps": safe_int(data.get("MVPs", data.get("mvps"))),
            "style_points": safe_int(data.get("StylePoints")),
            "cash": safe_int(data.get("Cash")),
            "playtime_hours": round(playtime_seconds / 3600, 1) if playtime_seconds else 0,
        }
    except Exception:
        return None


async def list_all_entry_ids() -> list[str]:
    """List every entry id in PlayerStore (handles pagination)."""
    url = f"{BASE_URL}/universes/{UNIVERSE_ID}/data-stores/{DATASTORE_NAME}/entries"
    entry_ids: list[str] = []
    page_token = None

    async with httpx.AsyncClient(timeout=30.0) as client:
        while True:
            params = {"maxPageSize": 100}
            if page_token:
                params["pageToken"] = page_token

            response = await client.get(url, headers=_headers(), params=params)
            _check_response_errors(response)
            response.raise_for_status()

            body = response.json()
            entries = body.get("dataStoreEntries", body.get("entries", []))
            for entry in entries:
                entry_id = entry.get("id") if isinstance(entry, dict) else entry
                if entry_id:
                    entry_ids.append(str(entry_id))

            page_token = body.get("nextPageToken")
            if not page_token:
                break

    return entry_ids


async def fetch_profile_data(user_id: int) -> dict:
    """Load one player's PlayerStore entry from Roblox."""
    entry_id = entry_id_for_user(user_id)
    url = (
        f"{BASE_URL}/universes/{UNIVERSE_ID}/data-stores/{DATASTORE_NAME}"
        f"/entries/{entry_id}@latest"
    )

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_headers())
        _check_response_errors(response)
        response.raise_for_status()
        return response.json()


async def fetch_profile_data_by_entry_id(entry_id: str) -> dict | None:
    """Load a profile entry using whatever id format PlayerStore uses."""
    encoded_id = quote(entry_id, safe="")
    url = (
        f"{BASE_URL}/universes/{UNIVERSE_ID}/data-stores/{DATASTORE_NAME}"
        f"/entries/{encoded_id}@latest"
    )

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_headers())
        if response.status_code == 404:
            return None
        if response.status_code >= 400:
            return None
        return response.json()


def map_profile_to_stats(profile_entry: dict, roblox_profile: dict) -> dict:
    """Convert PlayerStore + Roblox profile into the stats our website uses."""
    user_id = roblox_profile["roblox_user_id"]
    data = extract_data_table(profile_entry)
    if data is None:
        raise ValueError(f"Player {user_id} has unreadable profile data.")

    stats = parse_stats_from_data(data, user_id)
    if stats is None:
        raise ValueError(f"Player {user_id} has unreadable profile data.")

    stats.update(
        {
            "username": roblox_profile["username"],
            "display_name": roblox_profile["display_name"],
            "avatar_url": roblox_profile["avatar_url"],
        }
    )
    return stats


def malformed_stats(user_id: int) -> dict:
    """Placeholder stats when PlayerStore data is in an old or broken format."""
    return {
        "roblox_user_id": user_id,
        "kills": 0,
        "deaths": 0,
        "air_kills": 0,
        "avg_air_time": 0,
        "throw_kills": 0,
        "slash_kills": 0,
        "throw_hits": 0,
        "slash_hits": 0,
        "longest_streak": 0,
        "mvps": 0,
        "style_points": 0,
        "cash": 0,
        "playtime_hours": 0,
        "malformed": True,
    }


def default_roblox_profile(user_id: int) -> dict:
    """Fallback when Roblox user info cannot be loaded."""
    return {
        "roblox_user_id": user_id,
        "username": f"user{user_id}",
        "display_name": f"Player {user_id}",
        "avatar_url": None,
    }
