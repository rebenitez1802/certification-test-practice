import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getExam } from '../lib/data'
import { optionLetter } from '../lib/format'
import { isCorrect } from '../lib/scoring'
import { getAttempt } from '../lib/storage'

export default function Review() {
  const { id } = useParams()
  const attempt = id ? getAttempt(id) : null
  const [onlyWrong, setOnlyWrong] = useState(false)

  if (!attempt) {
    return (
      <p>
        Attempt not found. <Link to="/">Start a new test</Link>
      </p>
    )
  }

  const exam = getExam(attempt.config.examId)
  const items = attempt.questions
    .map((question, index) => ({ question, index, correct: isCorrect(question, attempt.answers[index]) }))
    .filter((item) => !onlyWrong || !item.correct)

  return (
    <div className="stack">
      <div className="review-top">
        <h1 className="page-title">Answer review</h1>
        <div className="row">
          <label className="check-row">
            <input
              type="checkbox"
              checked={onlyWrong}
              onChange={(e) => setOnlyWrong(e.target.checked)}
            />
            <span>Incorrect only</span>
          </label>
          <Link className="btn ghost" to={`/results/${attempt.id}`}>
            Back to results
          </Link>
        </div>
      </div>

      {items.length === 0 && <p className="muted">Nothing to show — every answer was correct. 🎉</p>}

      {items.map(({ question, index, correct }) => {
        const answer = attempt.answers[index] ?? []
        return (
          <div key={question.id} className="card review-card">
            <div className="review-meta">
              <span className="muted">
                Question {index + 1} · Chapter {question.chapter}
                {exam ? ` · ${exam.chapters.find((c) => c.id === question.chapter)?.title ?? ''}` : ''} ·{' '}
                {question.kLevel}
              </span>
              <span className={`status-badge small ${correct ? 'status-pass' : 'status-fail'}`}>
                <span aria-hidden="true">{correct ? '✓' : '✗'}</span>
                {correct ? 'Correct' : answer.length === 0 ? 'Not answered' : 'Incorrect'}
              </span>
            </div>
            <h2 className="stem">{question.stem}</h2>
            <div className="options">
              {question.options.map((option, i) => {
                const isRight = question.correct.includes(i)
                const isChosen = answer.includes(i)
                const classes = ['option', 'static']
                if (isRight) classes.push('opt-correct')
                else if (isChosen) classes.push('opt-wrong')
                return (
                  <div key={i} className={classes.join(' ')}>
                    <span className="option-letter">{optionLetter(i)}</span>
                    <span className="option-text">{option}</span>
                    <span className="option-tags muted">
                      {isRight ? 'Correct answer' : ''}
                      {isChosen ? `${isRight ? ' · ' : ''}Your answer` : ''}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="explanation">
              <strong>Explanation.</strong> {question.explanation}
            </div>
          </div>
        )
      })}
    </div>
  )
}
