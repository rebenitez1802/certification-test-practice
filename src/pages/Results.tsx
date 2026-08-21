import { Link, useNavigate, useParams } from 'react-router-dom'
import { getExam } from '../lib/data'
import { formatClock, formatDate } from '../lib/format'
import { scoreAttempt } from '../lib/scoring'
import { getAttempt } from '../lib/storage'

export default function Results() {
  const { id } = useParams()
  const navigate = useNavigate()
  const attempt = id ? getAttempt(id) : null

  if (!attempt) {
    return (
      <p>
        Attempt not found. <Link to="/">Start a new test</Link>
      </p>
    )
  }

  const exam = getExam(attempt.config.examId)
  const passPercent = exam?.mock.passPercent ?? 65
  const result = scoreAttempt(attempt, passPercent)

  return (
    <div className="stack">
      <section className="card results-hero">
        <div>
          <p className="muted">
            {exam?.shortName ?? attempt.config.examId} ·{' '}
            {attempt.config.mode === 'mock' ? 'Mock exam' : 'Custom practice'} ·{' '}
            {formatDate(attempt.startedAt)}
          </p>
          <div className="hero-figure">{result.percent}%</div>
          <p className="muted">
            {result.correct} of {result.total} correct · pass mark {result.passPercent}% · time{' '}
            {formatClock(result.timeUsedSec)}
          </p>
        </div>
        <span className={`status-badge ${result.passed ? 'status-pass' : 'status-fail'}`}>
          <span aria-hidden="true">{result.passed ? '✓' : '✗'}</span>
          {result.passed ? 'Passed' : 'Failed'}
        </span>
      </section>

      <section className="card">
        <h2>Score by chapter</h2>
        <div className="meters">
          {result.byChapter.map((stat) => {
            const title = exam?.chapters.find((c) => c.id === stat.chapter)?.title ?? ''
            const percent = stat.total === 0 ? 0 : (stat.correct / stat.total) * 100
            return (
              <div key={stat.chapter} className="meter-row">
                <span className="meter-label">
                  {stat.chapter}. {title}
                </span>
                <div
                  className="meter-track"
                  role="img"
                  aria-label={`Chapter ${stat.chapter}: ${stat.correct} of ${stat.total} correct`}
                >
                  <div className="meter-fill" style={{ width: `${percent}%` }} />
                </div>
                <span className="meter-value">
                  {stat.correct}/{stat.total}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <div className="row">
        <button className="btn primary" onClick={() => navigate(`/review/${attempt.id}`)}>
          Review answers
        </button>
        <Link className="btn ghost" to="/">
          New test
        </Link>
      </div>
    </div>
  )
}
