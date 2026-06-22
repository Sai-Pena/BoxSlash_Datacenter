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

export function formatTimestamp(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDuration(seconds) {
  if (seconds == null || seconds === '') return '—'
  const total = Math.max(0, Math.floor(Number(seconds)))
  if (Number.isNaN(total)) return '—'
  if (total < 60) return `${total}s`
  const mins = Math.floor(total / 60)
  const secs = total % 60
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60
  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`
}

export function rankClass(rank) {
  if (!rank) return 'unranked'
  return rank.toLowerCase().replace(/\s+/g, '-')
}
