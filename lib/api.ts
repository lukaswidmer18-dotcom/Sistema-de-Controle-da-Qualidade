import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

// Set via environment or update to your server's LAN IP for development
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
    // Also send as cookie header since NextAuth expects cookie-based sessions
    config.headers['Cookie'] = `next-auth.session-token=${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    return Promise.reject(error)
  }
)

export default api
