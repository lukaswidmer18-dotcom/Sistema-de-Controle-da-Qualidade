import { create } from 'zustand'
import { storage } from '@/lib/storage'
import { AuthUser } from '@/lib/types'

const TOKEN_KEY = 'cq_auth_token'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setSession: (user: AuthUser, token: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setSession: async (user, token) => {
    await storage.setItem(TOKEN_KEY, token)
    set({ user, token, isAuthenticated: true })
  },

  logout: async () => {
    await storage.deleteItem(TOKEN_KEY)
    set({ user: null, token: null, isAuthenticated: false })
  },

  initialize: async () => {
    // Already authenticated (e.g. just logged in) — only ensure isLoading is cleared
    if (get().isAuthenticated) {
      set({ isLoading: false })
      return
    }
    try {
      const token = await storage.getItem(TOKEN_KEY)
      if (token) {
        // Decode JWT payload (no signature verification — server validates on each request)
        const payload = JSON.parse(atob(token.split('.')[1])) as {
          id: string; email: string; name: string; role: string; exp: number
        }
        // Check expiry
        if (payload.exp * 1000 > Date.now()) {
          set({
            token,
            user: { id: payload.id, email: payload.email, name: payload.name, role: payload.role as AuthUser['role'] },
            isAuthenticated: true,
          })
        } else {
          await storage.deleteItem(TOKEN_KEY)
        }
      }
    } catch {
      await storage.deleteItem(TOKEN_KEY).catch(() => null)
    } finally {
      set({ isLoading: false })
    }
  },
}))
