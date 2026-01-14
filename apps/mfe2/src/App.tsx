import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Users from './pages/Users'
import Roles from './pages/Roles'
import './App.css'

interface AppProps {
  basePath?: string
}

export default function App({ basePath = '/mfe2' }: AppProps) {
  return (
    <div style={{ padding: '24px' }}>
      <Routes>
        <Route path="/" element={<Home basePath={basePath} />} />
        <Route path="/users" element={<Users basePath={basePath} />} />
        <Route path="/roles" element={<Roles basePath={basePath} />} />
      </Routes>
    </div>
  )
}
