"""
Roblox public APIs for usernames, user ids, and avatars.

Docs:
- Users: https://create.roblox.com/docs/cloud/reference/domains/users
- Thumbnails: https://create.roblox.com/docs/cloud/reference/features/thumbnails
"""

import httpx

USERS_BY_NAME_URL = "https://users.roblox.com/v1/usernames/users"
USERS_BY_ID_URL = "https://users.roblox.com/v1/users"
THUMBNAILS_URL = "https://thumbnails.roblox.com/v1/users/avatar-headshot"


async def get_user_by_username(username: str) -> dict | None:
    """Look up a Roblox user by their username. Returns id, name, displayName."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            USERS_BY_NAME_URL,
            json={"usernames": [username], "excludeBannedUsers": True},
        )
        response.raise_for_status()
        data = response.json().get("data", [])
        if not data:
            return None
        return data[0]


async def get_users_by_ids(user_ids: list[int]) -> dict[int, dict]:
    """Batch lookup Roblox users by id. Returns {user_id: user_info}."""
    if not user_ids:
        return {}

    result: dict[int, dict] = {}
    chunk_size = 100

    async with httpx.AsyncClient(timeout=15.0) as client:
        for i in range(0, len(user_ids), chunk_size):
            chunk = user_ids[i : i + chunk_size]
            response = await client.post(
                USERS_BY_ID_URL,
                json={"userIds": chunk, "excludeBannedUsers": False},
            )
            response.raise_for_status()
            for user in response.json().get("data", []):
                result[user["id"]] = user

    return result


async def get_avatar_url(user_id: int) -> str | None:
    """Get one player's headshot image URL."""
    urls = await get_avatar_urls([user_id])
    return urls.get(user_id)


async def get_avatar_urls(user_ids: list[int]) -> dict[int, str]:
    """Batch lookup avatar headshot URLs. Returns {user_id: image_url}."""
    if not user_ids:
        return {}

    result: dict[int, str] = {}
    chunk_size = 100

    async with httpx.AsyncClient(timeout=15.0) as client:
        for i in range(0, len(user_ids), chunk_size):
            chunk = user_ids[i : i + chunk_size]
            response = await client.get(
                THUMBNAILS_URL,
                params={
                    "userIds": ",".join(str(uid) for uid in chunk),
                    "size": "150x150",
                    "format": "Png",
                    "isCircular": "true",
                },
            )
            response.raise_for_status()
            for item in response.json().get("data", []):
                if item.get("state") == "Completed" and item.get("imageUrl"):
                    result[item["targetId"]] = item["imageUrl"]

    return result


def profile_from_user_record(user: dict, avatar_url: str | None = None) -> dict:
    return {
        "roblox_user_id": user["id"],
        "username": user.get("name", f"user{user['id']}"),
        "display_name": user.get("displayName", user.get("name", f"Player {user['id']}")),
        "avatar_url": avatar_url,
    }


async def fetch_roblox_profile(username: str) -> dict:
    """Fetch Roblox profile data for a username."""
    user = await get_user_by_username(username)
    if not user:
        raise ValueError(f"Roblox user '{username}' was not found.")

    avatar_url = await get_avatar_url(user["id"])
    return profile_from_user_record(user, avatar_url)


async def fetch_roblox_profiles_by_ids(user_ids: list[int]) -> dict[int, dict]:
    """Fetch username, display name, and avatar for many user ids."""
    users = await get_users_by_ids(user_ids)
    avatars = await get_avatar_urls(user_ids)

    profiles: dict[int, dict] = {}
    for user_id in user_ids:
        if user_id in users:
            profiles[user_id] = profile_from_user_record(users[user_id], avatars.get(user_id))
        else:
            profiles[user_id] = {
                "roblox_user_id": user_id,
                "username": f"user{user_id}",
                "display_name": f"Player {user_id}",
                "avatar_url": avatars.get(user_id),
            }

    return profiles
