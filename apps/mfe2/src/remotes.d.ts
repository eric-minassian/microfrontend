declare module 'shell/useUser' {
  export interface User {
    id: string
    name: string
    email: string
    role: 'admin' | 'editor' | 'viewer'
    avatar?: string
  }

  export interface UserContextValue {
    user: User | null
    isAuthenticated: boolean
    login: (user: User) => void
    logout: () => void
    updateUser: (updates: Partial<User>) => void
  }

  export function useUser(): UserContextValue
}
