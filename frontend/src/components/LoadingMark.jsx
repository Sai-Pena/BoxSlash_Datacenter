/** Minimal loading mark — animated slash instead of skeleton placeholders. */
export default function LoadingMark({ label = 'Loading' }) {
  return (
    <div className="loading-mark" role="status" aria-live="polite">
      <div className="loading-mark-slash" aria-hidden>
        <span className="loading-mark-bar" />
      </div>
      <p className="loading-mark-label">{label}</p>
    </div>
  )
}
