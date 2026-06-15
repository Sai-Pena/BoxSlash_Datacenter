"""

Docs:
- Users: https://create.roblox.com/docs/cloud/reference/domains/users
- Thumbnails: https://create.roblox.com/docs/cloud/reference/features/thumbnails
"""

import httpx

USERS_URL = "https://users.roblox.com/v1/usernames/users"
THUMBNAILS_URL = "https://thumbnails.roblox.com/v1/users/avatar-headshot"


async def get_user_by_username(username: str) -> dict | None:
    """Look up a Roblox user by their username. Returns id, name, displayName."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            USERS_URL,
            json={"usernames": [username], "excludeBannedUsers": True},
        )
        response.raise_for_status()
        data = response.json().get("data", [])
        if not data:
            return None
        return data[0]


async def get_avatar_url(user_id: int) -> str | None:
    """Get the player's headshot image URL from Roblox."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            THUMBNAILS_URL,
            params={
                "userIds": user_id,
                "size": "150x150",
                "format": "Png",
                "isCircular": "true",
            },
        )
        response.raise_for_status()
        items = response.json().get("data", [])
        if not items:
            return None
        return items[0].get("imageUrl")


async def fetch_roblox_profile(username: str) -> dict:
    """
    Fetch Roblox profile data for a username.
    Returns user id, display name, and avatar image URL.
    """
    user = await get_user_by_username(username)
    if not user:
        raise ValueError(f"Roblox user '{username}' was not found.")

    user_id = user["id"]
    avatar_url = await get_avatar_url(user_id)

    return {
        "roblox_user_id": user_id,
        "username": user.get("name", username),
        "display_name": user.get("displayName", username),
        "avatar_url": avatar_url,
    }
