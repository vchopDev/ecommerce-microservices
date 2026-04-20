import { useState, useEffect } from 'react'

interface User {
    id: string
    email: string
    name: string
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('access_token')
        const storedUser = localStorage.getItem('user')

        if (token && storedUser) {
            setUser(JSON.parse(storedUser))
        }

        setIsLoading(false)
    }, [])

    const login = (token: string, user: User) => {
        localStorage.setItem('access_token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setUser(user)
    }

    const logout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        setUser(null)
    }

    return { user, isLoading, login, logout }
}