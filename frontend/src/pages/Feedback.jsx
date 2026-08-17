import { useEffect } from 'react'

const FEEDBACK_EMAIL = 'saicarmyne@gmail.com'
const MAILTO = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('BoxSlash Datacenter feedback')}`

export default function Feedback() {
  useEffect(() => {
    window.location.href = MAILTO
  }, [])

  return (
    <div className="page feedback-page">
      <h1>Feedback</h1>
      <p className="page-desc">
        Opening your email app to write Sai. If nothing happens, use the address below.
      </p>
      <p className="feedback-mailto">
        <a href={MAILTO}>{FEEDBACK_EMAIL}</a>
      </p>
    </div>
  )
}
