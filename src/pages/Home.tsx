import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { chapterCounts, exams, getBank, getExam } from '../lib/data'
import { evenDistribution, generateTest } from '../lib/generator'
import { clearActive, loadActive, newAttemptId, saveActive } from '../lib/storage'
import type { Attempt, TestConfig } from '../types'

export default function Home() {
  const navigate = useNavigate()
  const [active, setActive] = useState(() => loadActive())
  const [examId, setExamId] = useState(exams[0]?.id ?? '')
  const exam = getExam(examId)
  const counts = useMemo(() => chapterCounts(examId), [examId])
  const bankSize = useMemo(() => getBank(examId).length, [examId])

  const [selected, setSelected] = useState<Set<string>>(() => new Set(exam?.chapters.map((c) => c.id)))
  const [customCount, setCustomCount] = useState(20)
  const [timed, setTimed] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(30)

  if (!exam) return <p>No exams found in the knowledge base.</p>

  const selectedPool = exam.chapters
    .filter((c) => selected.has(c.id))
    .reduce((sum, c) => sum + (counts[c.id] ?? 0), 0)

  function toggleChapter(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function start(config: TestConfig) {
    const bank = getBank(config.examId)
    const distribution =
      config.mode === 'mock'
        ? exam!.mock.distribution
        : evenDistribution(bank, config.chapters, config.questionCount)
    const questions = generateTest(bank, { distribution })
    if (questions.length === 0) return
    const attempt: Attempt = {
      id: newAttemptId(),
      config: { ...config, questionCount: questions.length },
      questions,
      answers: questions.map(() => null),
      flagged: questions.map(() => false),
      currentIndex: 0,
      startedAt: Date.now(),
    }
    saveActive(attempt)
    navigate('/test')
  }

  return (
    <div className="stack">
      {active && (
        <div className="card resume-card">
          <div>
            <strong>Test in progress</strong>
            <p className="muted">
              {active.answers.filter(Boolean).length} of {active.questions.length} questions answered
            </p>
          </div>
          <div className="row">
            <button className="btn primary" onClick={() => navigate('/test')}>
              Resume
            </button>
            <button
              className="btn ghost"
              onClick={() => {
                if (confirm('Discard the in-progress test?')) {
                  clearActive()
                  setActive(null)
                }
              }}
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <section>
        {exams.length > 1 ? (
          <label className="field">
            <span>Certification</span>
            <select value={examId} onChange={(e) => setExamId(e.target.value)}>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.syllabusVersion})
                </option>
              ))}
            </select>
          </label>
        ) : (
          <h1 className="page-title">
            {exam.name} <span className="muted">({exam.syllabusVersion})</span>
          </h1>
        )}
        <p className="muted">
          {exam.description} Question bank: {bankSize} questions.
        </p>
      </section>

      <div className="grid-2">
        <div className="card">
          <h2>Full mock exam</h2>
          <p className="muted">
            Simulates the real exam: {exam.mock.totalQuestions} questions with the official chapter
            distribution, {exam.mock.timeLimitMinutes} minutes, pass mark {exam.mock.passPercent}%.
          </p>
          <button
            className="btn primary"
            onClick={() =>
              start({
                examId,
                mode: 'mock',
                chapters: exam.chapters.map((c) => c.id),
                questionCount: exam.mock.totalQuestions,
                timeLimitMinutes: exam.mock.timeLimitMinutes,
              })
            }
          >
            Start mock exam
          </button>
        </div>

        <div className="card">
          <h2>Custom practice</h2>
          <fieldset className="chapter-list">
            <legend className="muted">Chapters</legend>
            {exam.chapters.map((c) => (
              <label key={c.id} className="check-row">
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggleChapter(c.id)}
                />
                <span>
                  {c.id}. {c.title}
                </span>
                <span className="muted count">{counts[c.id] ?? 0}</span>
              </label>
            ))}
          </fieldset>
          <div className="row wrap">
            <label className="field">
              <span>Questions</span>
              <input
                type="number"
                min={1}
                max={Math.max(1, selectedPool)}
                value={customCount}
                onChange={(e) => setCustomCount(Number(e.target.value))}
              />
            </label>
            <label className="check-row">
              <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
              <span>Timed</span>
            </label>
            {timed && (
              <label className="field">
                <span>Minutes</span>
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Number(e.target.value))}
                />
              </label>
            )}
          </div>
          <button
            className="btn primary"
            disabled={selected.size === 0 || selectedPool === 0 || customCount < 1}
            onClick={() =>
              start({
                examId,
                mode: 'custom',
                chapters: [...selected],
                questionCount: Math.min(customCount, selectedPool),
                timeLimitMinutes: timed ? customMinutes : null,
              })
            }
          >
            Start practice
          </button>
        </div>
      </div>
    </div>
  )
}
