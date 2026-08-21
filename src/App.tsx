import { NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Runner from './pages/Runner'
import Results from './pages/Results'
import Review from './pages/Review'
import History from './pages/History'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <NavLink to="/" className="brand">
          Cert<span className="brand-accent">Practice</span>
        </NavLink>
        <nav>
          <NavLink to="/">New test</NavLink>
          <NavLink to="/history">History</NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
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
