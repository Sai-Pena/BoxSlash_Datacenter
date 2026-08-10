import { useState } from 'react'
import { sendFeedback } from '../api'
import LoadingMark from '../components/LoadingMark'

export default function Feedback() {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSent(false)

    try {
      await sendFeedback({
        name: name.trim(),
        contact: contact.trim(),
        message: message.trim(),
      })
      setSent(true)
      setName('')
      setContact('')
      setMessage('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page feedback-page">
      <h1>Feedback</h1>
      <p className="page-desc">
        Bug reports, ideas, or anything about BoxSlash Datacenter. Messages go to Sai.
      </p>

      {sent && (
        <p className="status success">
          Thanks — your feedback was sent.
        </p>
      )}
      {error && <p className="status error">{error}</p>}
      {loading && <LoadingMark label="Sending feedback" />}

      {!loading && (
        <form className="feedback-form" onSubmit={handleSubmit}>
          <div className="feedback-field">
            <label htmlFor="feedback-name">Name</label>
            <input
              id="feedback-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
              placeholder="What should we call you?"
            />
          </div>

          <div className="feedback-field">
            <label htmlFor="feedback-contact">Reply-to (optional)</label>
            <input
              id="feedback-contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={200}
              placeholder="Email or Discord..."
            />
          </div>

          <div className="feedback-field">
            <label htmlFor="feedback-message">Message</label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              minLength={10}
              maxLength={4000}
              placeholder="What should we know?"
            />
          </div>

          <div className="feedback-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              Send feedback
            </button>
            <span className="feedback-note">Sent to the BoxSlash inbox</span>
          </div>
        </form>
      )}
    </div>
  )
}
