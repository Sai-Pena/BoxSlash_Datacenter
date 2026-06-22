"""
Player stats service — loads live data from Roblox PlayerStore.
"""

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


async def fetch_leaderboard() -> list[dict]:
    """Build top 100 leaderboard from every PlayerStore entry."""
    entry_ids = await list_all_entry_ids()
    if not entry_ids:
        return []

    players: list[dict] = []
    seen_user_ids: set[int] = set()

    for entry_id in entry_ids:
        stats = await _load_stats_for_entry(entry_id)
        if not stats:
            continue

        user_id = stats["roblox_user_id"]
        if user_id in seen_user_ids:
            continue
        seen_user_ids.add(user_id)
        players.append(stats)

    # Valid stats first (by kills), malformed entries sink to the bottom
    players.sort(
        key=lambda p: (p.get("malformed", False), -p.get("kills", 0), -calculate_kd(p))
    )
    top_players = players[:LEADERBOARD_LIMIT]

    user_ids = [p["roblox_user_id"] for p in top_players]
    profiles = await fetch_roblox_profiles_by_ids(user_ids)

    ranked = []
    for i, stats in enumerate(top_players, start=1):
        user_id = stats["roblox_user_id"]
        profile = profiles.get(user_id, default_roblox_profile(user_id))
        stats.update(
            {
                "username": profile["username"],
                "display_name": profile["display_name"],
                "avatar_url": profile.get("avatar_url"),
            }
        )

        ranked.append(
            {
                "rank": i,
                "username": stats["username"],
                "display_name": stats.get("display_name", stats["username"]),
                "avatar_url": stats.get("avatar_url"),
                "roblox_user_id": user_id,
                "kills": stats.get("kills", 0),
                "deaths": stats.get("deaths", 0),
                "kd_ratio": calculate_kd(stats),
                "malformed": stats.get("malformed", False),
            }
        )

    return ranked
