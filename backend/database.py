"""
Player stats service — loads live data from Roblox ProfileStore.
"""

import json
from pathlib import Path

from roblox_api import fetch_roblox_profile
from roblox_datastore import fetch_profile_data, map_profile_to_stats

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


async def fetch_player(username: str) -> dict:
    """Look up a player by username and pull live stats from ProfileStore."""
    roblox_profile = await fetch_roblox_profile(username)
    profile_entry = await fetch_profile_data(roblox_profile["roblox_user_id"])
    player = map_profile_to_stats(profile_entry, roblox_profile)
    return add_combat_stats(player)


async def fetch_leaderboard() -> list[dict]:
    """Build leaderboard from tracked players using live datastore stats."""
    players = []
    errors = []

    for username in get_tracked_usernames():
        try:
            player = await fetch_player(username)
            players.append(player)
        except ValueError:
            continue
        except Exception as e:
            errors.append(str(e))

    if not players and errors:
        raise RuntimeError(errors[0])

    players.sort(key=lambda p: (p.get("kills", 0), calculate_kd(p)), reverse=True)

    ranked = []
    for i, player in enumerate(players, start=1):
        ranked.append(
            {
                "rank": i,
                "username": player["username"],
                "display_name": player.get("display_name", player["username"]),
                "avatar_url": player.get("avatar_url"),
                "kills": player.get("kills", 0),
                "deaths": player.get("deaths", 0),
                "kd_ratio": calculate_kd(player),
            }
        )
    return ranked
