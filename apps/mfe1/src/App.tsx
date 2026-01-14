import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Products from './pages/Products'
import Categories from './pages/Categories'

interface AppProps {
  basePath?: string
}

export default function App({ basePath = '/mfe1' }: AppProps) {
  return (
    <Routes>
      <Route path="/" element={<Home basePath={basePath} />} />
      <Route path="/products" element={<Products basePath={basePath} />} />
      <Route path="/categories" element={<Categories basePath={basePath} />} />
    </Routes>
  )
}
