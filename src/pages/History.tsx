import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getExam } from '../lib/data'
import { formatDate } from '../lib/format'
import { scoreAttempt } from '../lib/scoring'
import { clearHistory, loadHistory } from '../lib/storage'

export default function History() {
  const [attempts, setAttempts] = useState(() => loadHistory())

  return (
    <div className="stack">
      <div className="review-top">
        <h1 className="page-title">Past attempts</h1>
        {attempts.length > 0 && (
          <button
            className="btn ghost"
            onClick={() => {
              if (confirm('Delete all past attempts? This cannot be undone.')) {
                clearHistory()
                setAttempts([])
              }
            }}
          >
            Clear history
          </button>
        )}
      </div>

      {attempts.length === 0 ? (
        <p className="muted">
          No attempts yet. <Link to="/">Take your first practice test.</Link>
        </p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Exam</th>
              <th>Mode</th>
              <th className="num">Score</th>
              <th>Result</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt) => {
              const exam = getExam(attempt.config.examId)
              const result = scoreAttempt(attempt, exam?.mock.passPercent ?? 65)
              return (
                <tr key={attempt.id}>
                  <td>{formatDate(attempt.startedAt)}</td>
                  <td>{exam?.shortName ?? attempt.config.examId}</td>
                  <td>{attempt.config.mode === 'mock' ? 'Mock' : 'Custom'}</td>
                  <td className="num">
                    {result.percent}% ({result.correct}/{result.total})
                  </td>
                  <td>
                    <span className={`status-badge small ${result.passed ? 'status-pass' : 'status-fail'}`}>
                      <span aria-hidden="true">{result.passed ? '✓' : '✗'}</span>
                      {result.passed ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/results/${attempt.id}`}>Results</Link>
                    {' · '}
                    <Link to={`/review/${attempt.id}`}>Review</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
