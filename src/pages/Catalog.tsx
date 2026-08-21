import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBank, getCertifications, getExam } from '../lib/data'
import { clearActive, loadActive } from '../lib/storage'

export default function Catalog() {
  const navigate = useNavigate()
  const [active, setActive] = useState(() => loadActive())
  const certifications = getCertifications()

  if (certifications.length === 0) {
    return <p>No certifications found in the knowledge base.</p>
  }

  const activeExam = active ? getExam(active.config.examId) : undefined

  return (
    <div className="stack">
      {active && (
        <div className="card resume-card">
          <div>
            <strong>Test in progress</strong>
            <p className="muted">
              {activeExam?.shortName ? `${activeExam.shortName} · ` : ''}
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
        <h1 className="page-title">Choose a certification</h1>
        <p className="muted">Pick a certification and level to start practising.</p>
      </section>

      <div className="stack">
        {certifications.map((cert) => (
          <section key={cert.name} className="card">
            <h2>{cert.name}</h2>
            <div className="level-list">
              {cert.exams.map((exam) => (
                <button
                  key={exam.id}
                  type="button"
                  className="level-row"
                  onClick={() => navigate(`/exam/${exam.id}`)}
                >
                  <span className="level-main">
                    <span className="level-name">{exam.level}</span>
                    <span className="muted">
                      {exam.syllabusVersion} · {getBank(exam.id).length} questions
                    </span>
                  </span>
                  <span className="level-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
