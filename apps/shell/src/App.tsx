import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import { generateMfeRoutes } from './components/MfeRoutes'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0a0a0a',
            color: '#fff',
          }}
        >
          <Header />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              {generateMfeRoutes()}
            </Routes>
          </main>
        </div>
      </UserProvider>
    </BrowserRouter>
  )
}

export default App
