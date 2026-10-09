import { Routes, Route } from 'react-router'
import { useEffect } from 'react'
import Home from './pages/Home'
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"

export default function App() {
  useEffect(() => {
    console.log("[App.tsx] Root application component mounted successfully.");
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
