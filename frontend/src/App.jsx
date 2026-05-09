import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Historical from './pages/Historical'
import Compare from './pages/Compare'
import Simulator from './pages/Simulator'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/historical" element={<Historical />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/simulator" element={<Simulator />} />
      </Routes>
    </BrowserRouter>
  )
}
