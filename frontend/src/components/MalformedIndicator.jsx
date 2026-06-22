/** Warns when a player's PlayerStore entry is old or unreadable. */
export default function MalformedIndicator({ variant = 'badge' }) {
  const title = 'PlayerStore data is in an old or unreadable format. Stats shown are placeholders.'

  if (variant === 'banner') {
    return (
      <div className="malformed-banner" role="status">
        <span className="malformed-banner-icon" aria-hidden>⚠</span>
        <div className="malformed-banner-text">
          <strong>Malformed Data</strong>
          <p>{title}</p>
        </div>
      </div>
    )
  }

  if (variant === 'icon') {
    return (
      <span className="malformed-icon" title={title} aria-label="Malformed data">
        ⚠
      </span>
    )
  }

  return (
    <span className="malformed-tag" title={title}>
      ⚠ MALFORMED DATA
    </span>
  )
}
