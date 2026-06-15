"""
bomboclatttt

"""

import json
from datetime import datetime, timezone
from pathlib import Path

DATA_FILE = Path(__file__).parent / "data" / "players.json"


def _load() -> dict:
    if not DATA_FILE.exists():
        return {}
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _save(players: dict) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(players, f, indent=2)


def calculate_kd(player: dict) -> float:
    """Kill/death ratio. If no deaths yet, K/D equals total kills."""
    kills = player.get("kills", 0)
    deaths = player.get("deaths", 0)
    if deaths == 0:
        return float(kills)
    return round(kills / deaths, 2)


def get_all_players() -> list[dict]:
    players = _load()
    return list(players.values())


def get_player(username: str) -> dict | None:
    players = _load()
    key = username.lower()
    return players.get(key)


def save_player(username: str, player_data: dict) -> dict:
    players = _load()
    key = username.lower()
    players[key] = player_data
    _save(players)
    return player_data


def update_roblox_data(username: str, roblox_data: dict) -> dict:
    """Update only the Roblox profile fields, keep kill/death stats the same."""
    player = get_player(username)
    if not player:
        raise ValueError(f"Player '{username}' is not in the database.")

    player["roblox_user_id"] = roblox_data["roblox_user_id"]
    player["username"] = roblox_data["username"]
    player["display_name"] = roblox_data["display_name"]
    player["avatar_url"] = roblox_data["avatar_url"]
    player["last_synced"] = datetime.now(timezone.utc).isoformat()

    return save_player(username, player)


def _leaderboard_sort_key(player: dict) -> tuple:
    """Rank by kills first, then K/D ratio."""
    return (player.get("kills", 0), calculate_kd(player))


def get_leaderboard() -> list[dict]:
    players = get_all_players()
    ranked = []
    for i, player in enumerate(
        sorted(players, key=_leaderboard_sort_key, reverse=True), start=1
    ):
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


def add_combat_stats(player: dict) -> dict:
    """Add computed stats to a player dict for API responses."""
    kills = player.get("kills", 0)
    air_kills = player.get("air_kills", 0)

    player["kd_ratio"] = calculate_kd(player)
    player["air_kill_rate"] = round((air_kills / kills) * 100, 1) if kills > 0 else 0
    return player
