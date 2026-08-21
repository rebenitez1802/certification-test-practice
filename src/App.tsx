import { NavLink, Route, Routes, useParams } from 'react-router-dom'
import Catalog from './pages/Catalog'
import Home from './pages/Home'
import Runner from './pages/Runner'
import Results from './pages/Results'
import Review from './pages/Review'
import History from './pages/History'

// Remount Home when the exam changes so its chapter-selection state resets.
function ExamSetup() {
  const { examId } = useParams()
  return <Home key={examId} />
}

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <NavLink to="/" className="brand">
          Cert<span className="brand-accent">Practice</span>
        </NavLink>
        <nav>
          <NavLink to="/">Certifications</NavLink>
          <NavLink to="/history">History</NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/exam/:examId" element={<ExamSetup />} />
          <Route path="/test" element={<Runner />} />
          <Route path="/results/:id" element={<Results />} />
          <Route path="/review/:id" element={<Review />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
      <footer className="app-footer">
        Practice questions are original material based on the ISTQB CTFL v4.0 syllabus — not official exam
        questions. Progress is stored locally in your browser.
      </footer>
    </div>
  )
}
