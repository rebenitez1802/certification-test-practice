import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getExam } from '../lib/data'
import { formatClock, optionLetter } from '../lib/format'
import { clearActive, loadActive, saveActive, saveToHistory } from '../lib/storage'
import type { Attempt } from '../types'

export default function Runner() {
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState<Attempt | null>(() => loadActive())
  const [now, setNow] = useState(() => Date.now())

  const deadline =
    attempt?.config.timeLimitMinutes != null
      ? attempt.startedAt + attempt.config.timeLimitMinutes * 60_000
      : null

  const submit = useCallback(
    (current: Attempt) => {
      const finished = { ...current, finishedAt: Date.now() }
      saveToHistory(finished)
      clearActive()
      navigate(`/results/${finished.id}`, { replace: true })
    },
    [navigate],
  )

  useEffect(() => {
    if (deadline == null) return
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [deadline])

  useEffect(() => {
    if (attempt && deadline != null && now >= deadline) submit(attempt)
  }, [attempt, deadline, now, submit])

  if (!attempt) return <Navigate to="/" replace />

  const exam = getExam(attempt.config.examId)
  const index = attempt.currentIndex
  const question = attempt.questions[index]
  const answer = attempt.answers[index] ?? []
  const multi = question.correct.length > 1
  const answeredCount = attempt.answers.filter((a) => a && a.length > 0).length
  const remainingSec = deadline != null ? (deadline - now) / 1000 : null

  function update(patch: Partial<Attempt>) {
    setAttempt((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      saveActive(next)
      return next
    })
  }

  function selectOption(optionIndex: number) {
    const next = multi
      ? answer.includes(optionIndex)
        ? answer.filter((a) => a !== optionIndex)
        : [...answer, optionIndex].sort((a, b) => a - b)
      : [optionIndex]
    update({ answers: attempt!.answers.map((a, i) => (i === index ? next : a)) })
  }

  function goTo(i: number) {
    update({ currentIndex: Math.max(0, Math.min(attempt!.questions.length - 1, i)) })
  }

  function onSubmitClick() {
    const unanswered = attempt!.questions.length - answeredCount
    const message =
      unanswered > 0
        ? `You have ${unanswered} unanswered question(s). Submit anyway?`
        : 'Submit the test?'
    if (confirm(message)) submit(attempt!)
  }

  const chapterTitle = exam?.chapters.find((c) => c.id === question.chapter)?.title

  return (
    <div className="runner">
      <div className="runner-top">
        <span className="muted">
          Question {index + 1} of {attempt.questions.length} · {answeredCount} answered
        </span>
        {remainingSec != null && (
          <span className={`timer ${remainingSec < 300 ? 'timer-low' : ''}`} role="timer">
            {formatClock(remainingSec)}
          </span>
        )}
      </div>

      <div className="palette" aria-label="Question navigator">
        {attempt.questions.map((_, i) => {
          const classes = ['palette-btn']
          if (attempt.answers[i] && attempt.answers[i]!.length > 0) classes.push('answered')
          if (attempt.flagged[i]) classes.push('flagged')
          if (i === index) classes.push('current')
          return (
            <button key={i} className={classes.join(' ')} onClick={() => goTo(i)}>
              {i + 1}
            </button>
          )
        })}
      </div>

      <div className="card question-card">
        <p className="muted question-meta">
          Chapter {question.chapter}
          {chapterTitle ? ` · ${chapterTitle}` : ''} · {question.kLevel}
          {multi ? ' · Select TWO options' : ''}
        </p>
        <h2 className="stem">{question.stem}</h2>
        <div className="options">
          {question.options.map((option, i) => (
            <button
              key={i}
              className={`option ${answer.includes(i) ? 'selected' : ''}`}
              onClick={() => selectOption(i)}
              aria-pressed={answer.includes(i)}
            >
              <span className="option-letter">{optionLetter(i)}</span>
              <span>{option}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="runner-controls">
        <div className="row">
          <button className="btn ghost" onClick={() => goTo(index - 1)} disabled={index === 0}>
            ← Previous
          </button>
          <button
            className={`btn ghost ${attempt.flagged[index] ? 'flag-on' : ''}`}
            onClick={() =>
              update({ flagged: attempt.flagged.map((f, i) => (i === index ? !f : f)) })
            }
          >
            {attempt.flagged[index] ? '⚑ Flagged' : '⚐ Flag for review'}
          </button>
          <button
            className="btn ghost"
            onClick={() => goTo(index + 1)}
            disabled={index === attempt.questions.length - 1}
          >
            Next →
          </button>
        </div>
        <button className="btn primary" onClick={onSubmitClick}>
          Submit test
        </button>
      </div>
    </div>
  )
}
