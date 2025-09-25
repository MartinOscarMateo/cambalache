import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Home from './pages/Home'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'
    fetch(`${API}/healthz`)
      .then(res => {
        console.log('fetch status', res.status)
        return res.json()
      })
      .then(data => console.log('fetch json', data))
      .catch(err => console.error('fetch error', err))
  }, [])

  return (
    <BrowserRouter>
      <header className="app-header">
        <nav>
          <Link to="/">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </Link>
          <Link to="/">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
      <footer className="app-footer">
        <div className="card">
          <button onClick={() => setCount((c) => c + 1)}>count is {count}</button>
        </div>
      </footer>
    </BrowserRouter>
  )
}

export default App