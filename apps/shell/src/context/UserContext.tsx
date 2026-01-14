import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  avatar?: string
}

interface UserContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

const UserContext = createContext<UserContextValue | null>(null)

// Mock user for demo purposes
const MOCK_USER: User = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'admin',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(MOCK_USER) // Start logged in for demo

  const login = useCallback((newUser: User) => {
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(current => current ? { ...current, ...updates } : null)
  }, [])

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider. Make sure your MFE is loaded within the shell.')
  }
  return context
}
