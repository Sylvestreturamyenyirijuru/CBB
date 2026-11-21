import axios from 'axios'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || window.CL_BERGER_API_URL || 'http://localhost:5000/api/v1' })
let refreshRequest = null

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(response => response, async error => {
  const original = error.config
  const isLoginOrRefresh = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh')
  if (error.response?.status !== 401 || !original || original._retried || isLoginOrRefresh) {
    return Promise.reject(error)
  }

  const refreshToken = sessionStorage.getItem('refresh_token')
  if (!refreshToken) {
    sessionStorage.clear()
    window.dispatchEvent(new Event('auth:expired'))
    return Promise.reject(error)
  }

  original._retried = true
  try {
    if (!refreshRequest) {
      refreshRequest = axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${refreshToken}` },
      }).then(({ data }) => {
        sessionStorage.setItem('access_token', data.access_token)
        return data.access_token
      }).finally(() => { refreshRequest = null })
    }
    const accessToken = await refreshRequest
    original.headers = original.headers || {}
    original.headers.Authorization = `Bearer ${accessToken}`
    return api(original)
  } catch (refreshError) {
    sessionStorage.clear()
    window.dispatchEvent(new Event('auth:expired'))
    return Promise.reject(refreshError)
  }
})

export default api
