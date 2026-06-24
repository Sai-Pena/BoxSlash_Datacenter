"""
Player stats service — loads live data from Roblox PlayerStore.
"""

import asyncio
import json
from pathlib import Path

from roblox_api import fetch_roblox_profile, fetch_roblox_profiles_by_ids
from roblox_datastore import (
    LEADERBOARD_LIMIT,
    default_roblox_profile,
    extract_data_table,
    fetch_profile_data,
    fetch_profile_data_by_entry_id,
    list_all_entry_ids,
    malformed_stats,
    parse_stats_from_data,
    parse_user_id_from_entry_id,
)

TRACKED_FILE = Path(__file__).parent / "data" / "tracked_players.json"


def calculate_kd(player: dict) -> float:
    kills = player.get("kills", 0)
    deaths = player.get("deaths", 0)
    if deaths == 0:
        return float(kills)
    return round(kills / deaths, 2)


def add_combat_stats(player: dict) -> dict:
    kills = player.get("kills", 0)
    air_kills = player.get("air_kills", 0)
    player["kd_ratio"] = calculate_kd(player)
    player["air_kill_rate"] = round((air_kills / kills) * 100, 1) if kills > 0 else 0
    return player


def get_tracked_usernames() -> list[str]:
    if not TRACKED_FILE.exists():
        return []
    with open(TRACKED_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _attach_profile(stats: dict, profile: dict) -> dict:
    stats.update(
        {
            "username": profile["username"],
            "display_name": profile["display_name"],
            "avatar_url": profile.get("avatar_url"),
            "malformed": bool(stats.get("malformed", False)),
        }
    )
    return add_combat_stats(stats)


async def fetch_player(username: str) -> dict:
    """Look up a player by username and pull live stats from PlayerStore."""
    roblox_profile = await fetch_roblox_profile(username)
    user_id = roblox_profile["roblox_user_id"]

    try:
        profile_entry = await fetch_profile_data(user_id)
    except ValueError:
        raise

    data = extract_data_table(profile_entry)
    if data is None:
        stats = malformed_stats(user_id)
        return _attach_profile(stats, roblox_profile)

    stats = parse_stats_from_data(data, user_id)
    if stats is None:
        stats = malformed_stats(user_id)
    else:
        stats["malformed"] = False

    return _attach_profile(stats, roblox_profile)


async def _load_stats_for_entry(entry_id: str) -> dict | None:
    """Load stats for one datastore entry. Uses placeholder stats if data is malformed."""
    user_id = parse_user_id_from_entry_id(entry_id)
    if user_id is None:
        return None

    profile_entry = None
    try:
        profile_entry = await fetch_profile_data_by_entry_id(entry_id)
        if profile_entry is None:
            profile_entry = await fetch_profile_data(user_id)
    except ValueError:
        return malformed_stats(user_id)
    except Exception:
        return malformed_stats(user_id)

    if profile_entry is None:
        return malformed_stats(user_id)

    data = extract_data_table(profile_entry)
    if data is None:
        return malformed_stats(user_id)

    stats = parse_stats_from_data(data, user_id)
    if stats is None:
        return malformed_stats(user_id)

    stats["malformed"] = False
    return stats


async def _load_all_player_stats(entry_ids: list[str], concurrency: int = 12) -> list[dict]:
    """Load stats for many datastore entries in parallel."""
    semaphore = asyncio.Semaphore(concurrency)

    async def load_one(entry_id: str) -> dict | None:
        async with semaphore:
            return await _load_stats_for_entry(entry_id)

    results = await asyncio.gather(*(load_one(entry_id) for entry_id in entry_ids))
    players: list[dict] = []
    seen_user_ids: set[int] = set()

    for stats in results:
        if not stats:
            continue
        user_id = stats["roblox_user_id"]
        if user_id in seen_user_ids:
            continue
        seen_user_ids.add(user_id)
        players.append(stats)

    players.sort(
        key=lambda p: (p.get("malformed", False), -p.get("kills", 0), -calculate_kd(p))
    )
    return players


def _stats_row(rank: int, stats: dict, profile: dict | None = None) -> dict:
    user_id = stats["roblox_user_id"]
    if profile:
        username = profile["username"]
        display_name = profile.get("display_name", username)
        avatar_url = profile.get("avatar_url")
    else:
        username = f"user{user_id}"
        display_name = f"Player {user_id}"
        avatar_url = None

    return {
        "rank": rank,
        "username": username,
        "display_name": display_name,
        "avatar_url": avatar_url,
        "roblox_user_id": user_id,
        "kills": stats.get("kills", 0),
        "deaths": stats.get("deaths", 0),
        "kd_ratio": calculate_kd(stats),
        "malformed": stats.get("malformed", False),
        "profiles_pending": profile is None,
    }


async def fetch_leaderboard_stats(limit: int = LEADERBOARD_LIMIT) -> list[dict]:
    """Build ranked leaderboard rows from PlayerStore stats only (no Roblox profile fetch)."""
    entry_ids = await list_all_entry_ids()
    if not entry_ids:
        return []

    top_players = (await _load_all_player_stats(entry_ids))[:limit]
    return [_stats_row(i, stats) for i, stats in enumerate(top_players, start=1)]


async def fetch_leaderboard_profiles(user_ids: list[int]) -> dict[int, dict]:
    """Fetch usernames, display names, and avatars for leaderboard enrichment."""
    if not user_ids:
        return {}
    return await fetch_roblox_profiles_by_ids(user_ids)


async def fetch_leaderboard(include_profiles: bool = True) -> list[dict]:
    """Build top 100 leaderboard, optionally enriched with Roblox profile data."""
    rows = await fetch_leaderboard_stats()
    if not include_profiles or not rows:
        return rows

    user_ids = [row["roblox_user_id"] for row in rows]
    profiles = await fetch_roblox_profiles_by_ids(user_ids)

    enriched = []
    for row in rows:
        user_id = row["roblox_user_id"]
        profile = profiles.get(user_id, default_roblox_profile(user_id))
        enriched.append(
            {
                **row,
                "username": profile["username"],
                "display_name": profile.get("display_name", profile["username"]),
                "avatar_url": profile.get("avatar_url"),
                "profiles_pending": False,
            }
        )
    return enriched
