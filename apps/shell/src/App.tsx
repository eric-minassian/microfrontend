import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import './App.css'

const Mfe1App = lazy(() => import('mfe1/App'))
const Mfe2App = lazy(() => import('mfe2/App'))

function LoadingFallback({ name }: { name: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '200px',
      color: '#888',
    }}>
      Loading {name}...
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0a',
          color: '#fff',
        }}>
          <Header />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/mfe1/*"
                element={
                  <Suspense fallback={<LoadingFallback name="MFE1" />}>
                    <Mfe1App basePath="/mfe1" />
                  </Suspense>
                }
              />
              <Route
                path="/mfe2/*"
                element={
                  <Suspense fallback={<LoadingFallback name="MFE2" />}>
                    <Mfe2App basePath="/mfe2" />
                  </Suspense>
                }
              />
            </Routes>
          </main>
        </div>
      </UserProvider>
    </BrowserRouter>
  )
}

export default App
