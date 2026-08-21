import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { chapterCounts, getBank, getExam } from '../lib/data'
import { evenDistribution, generateTest } from '../lib/generator'
import { newAttemptId, saveActive } from '../lib/storage'
import type { Attempt, TestConfig } from '../types'

export default function Home() {
  const navigate = useNavigate()
  const { examId = '' } = useParams()
  const exam = getExam(examId)
  const counts = useMemo(() => chapterCounts(examId), [examId])
  const bankSize = useMemo(() => getBank(examId).length, [examId])

  const [selected, setSelected] = useState<Set<string>>(() => new Set(exam?.chapters.map((c) => c.id)))
  const [customCount, setCustomCount] = useState(20)
  const [timed, setTimed] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(30)

  if (!exam) {
    return (
      <p>
        Certification not found. <Link to="/">Back to catalog</Link>
      </p>
    )
  }

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
      <section>
        <p className="muted">
          <Link to="/">← All certifications</Link>
        </p>
        <h1 className="page-title">
          {exam.certification} — {exam.level}
        </h1>
        <p className="muted">
          {exam.description} Question bank: {bankSize} questions. Syllabus {exam.syllabusVersion}.
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
