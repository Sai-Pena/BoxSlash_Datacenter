import { robloxProfileUrl } from '../utils'

export default function RobloxProfileButton({ userId, username }) {
  if (!userId) return null

  return (
    <a
      href={robloxProfileUrl(userId)}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-roblox"
    >
      View on Roblox ↗
    </a>
  )
}
