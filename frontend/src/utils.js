/** Link to a player's Roblox profile page */
export function robloxProfileUrl(userId) {
  return `https://www.roblox.com/users/${userId}/profile`
}

export function formatKd(player) {
  if (player.kd_ratio != null && player.kd_ratio !== '') {
    return player.kd_ratio
  }
  if (player.deaths === 0) {
    return player.kills ?? 0
  }
  return ((player.kills ?? 0) / player.deaths).toFixed(2)
}
