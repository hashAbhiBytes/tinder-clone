import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import OnBoarding from './pages/OnBoarding'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import { useEffect, useState } from 'react'

const HeartTrail = () => {
    useEffect(() => {
        let lastTime = 0
        const delay = 100

        const createHeart = (e) => {
            const now = Date.now()
            if (now - lastTime < delay) return
            lastTime = now

            const heart = document.createElement('div')
            heart.className = 'heart'
            heart.style.left = `${e.clientX}px`
            heart.style.top = `${e.clientY}px`

            document.body.appendChild(heart)

            setTimeout(() => {
                heart.style.opacity = '0'
                heart.style.transform += ' scale(1.5) translateY(-40px)'
            }, 0)

            setTimeout(() => {
                heart.remove()
            }, 1000)
        }

        document.addEventListener('mousemove', createHeart)
        return () => document.removeEventListener('mousemove', createHeart)
    }, [])

    return null
}

const App = () => {
    const [cookies] = useCookies(['AuthToken']) // correct key name
    const [authToken, setAuthToken] = useState(null)

    useEffect(() => {
        setAuthToken(cookies.AuthToken)
    }, [cookies.AuthToken]) // track cookie changes

    return (
        <BrowserRouter>
            <HeartTrail />
            <Routes>
                <Route path="/" element={<Home />} />
                {authToken ? (
                    <>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/onboarding" element={<OnBoarding />} />
                    </>
                ) : (
                    <>
                        <Route path="/dashboard" element={<Navigate to="/" />} />
                        <Route path="/onboarding" element={<Navigate to="/" />} />
                    </>
                )}
            </Routes>
        </BrowserRouter>
    )
}

export default App
