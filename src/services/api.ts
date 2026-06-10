import axios from 'axios'
import type { AxiosError } from 'axios'

// ─── Cliente Axios base ───────────────────────────────────

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Interceptor: extrai .data da resposta
api.interceptors.response.use(
  res => res,
  (err: AxiosError<{ error: string }>) => {
    const message = err.response?.data?.error ?? err.message ?? 'Erro desconhecido'
    return Promise.reject(new Error(message))
  }
)

// ─── Auth ─────────────────────────────────────────────────

export const authService = {
  login:    (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }).then(r => r.data),
  logout:   () => api.post('/auth/logout').then(r => r.data),
  me:       () => api.get('/auth/me').then(r => r.data),
}

// ─── Tasks ────────────────────────────────────────────────

export const tasksService = {
  list:   (params?: object) => api.get('/tasks', { params }).then(r => r.data),
  get:    (id: string)      => api.get(`/tasks/${id}`).then(r => r.data),
  create: (data: object)    => api.post('/tasks', data).then(r => r.data),
  update: (id: string, data: object) => api.patch(`/tasks/${id}`, data).then(r => r.data),
  delete: (id: string)      => api.delete(`/tasks/${id}`).then(r => r.data),
  reorder:(ids: string[])   => api.post('/tasks/reorder', { ids }).then(r => r.data),
}

// ─── Habits ───────────────────────────────────────────────

export const habitsService = {
  list:    (params?: object) => api.get('/habits', { params }).then(r => r.data),
  create:  (data: object)    => api.post('/habits', data).then(r => r.data),
  update:  (id: string, data: object) => api.patch(`/habits/${id}`, data).then(r => r.data),
  delete:  (id: string)      => api.delete(`/habits/${id}`).then(r => r.data),
  logToday:(id: string, data?: object) => api.post(`/habits/${id}/log`, data ?? {}).then(r => r.data),
  unlog:   (id: string, date: string)  => api.delete(`/habits/${id}/log`, { params: { date } }).then(r => r.data),
  stats:   (id: string)      => api.get(`/habits/${id}/stats`).then(r => r.data),
}

// ─── Goals ────────────────────────────────────────────────

export const goalsService = {
  list:   (params?: object) => api.get('/goals', { params }).then(r => r.data),
  create: (data: object)    => api.post('/goals', data).then(r => r.data),
  update: (id: string, data: object) => api.patch(`/goals/${id}`, data).then(r => r.data),
  delete: (id: string)      => api.delete(`/goals/${id}`).then(r => r.data),
  addMilestone:    (id: string, data: object) => api.post(`/goals/${id}/milestones`, data).then(r => r.data),
  toggleMilestone: (id: string, mid: string)  => api.patch(`/goals/${id}/milestones/${mid}`).then(r => r.data),
}

// ─── Finance ─────────────────────────────────────────────

export const financeService = {
  summary:      (params?: object) => api.get('/finance/summary', { params }).then(r => r.data),
  transactions: {
    list:   (params?: object) => api.get('/finance/transactions', { params }).then(r => r.data),
    create: (data: object)    => api.post('/finance/transactions', data).then(r => r.data),
    update: (id: string, data: object) => api.patch(`/finance/transactions/${id}`, data).then(r => r.data),
    delete: (id: string)      => api.delete(`/finance/transactions/${id}`).then(r => r.data),
  },
  accounts: {
    list:   ()             => api.get('/finance/accounts').then(r => r.data),
    create: (data: object) => api.post('/finance/accounts', data).then(r => r.data),
    update: (id: string, data: object) => api.patch(`/finance/accounts/${id}`, data).then(r => r.data),
    delete: (id: string)   => api.delete(`/finance/accounts/${id}`).then(r => r.data),
  },
  subscriptions: {
    list:   ()             => api.get('/finance/subscriptions').then(r => r.data),
    create: (data: object) => api.post('/finance/subscriptions', data).then(r => r.data),
    update: (id: string, data: object) => api.patch(`/finance/subscriptions/${id}`, data).then(r => r.data),
    delete: (id: string)   => api.delete(`/finance/subscriptions/${id}`).then(r => r.data),
  },
}

// ─── Studies ──────────────────────────────────────────────

export const studiesService = {
  subjects: {
    list:   ()             => api.get('/studies/subjects').then(r => r.data),
    create: (data: object) => api.post('/studies/subjects', data).then(r => r.data),
    update: (id: string, data: object) => api.patch(`/studies/subjects/${id}`, data).then(r => r.data),
    delete: (id: string)   => api.delete(`/studies/subjects/${id}`).then(r => r.data),
  },
  sessions: {
    list:   (params?: object) => api.get('/studies/sessions', { params }).then(r => r.data),
    start:  (data: object)    => api.post('/studies/sessions/start', data).then(r => r.data),
    stop:   (id: string)      => api.patch(`/studies/sessions/${id}/stop`).then(r => r.data),
  },
  pomodoro: {
    start:    (data: object) => api.post('/studies/pomodoro/start', data).then(r => r.data),
    tick:     (id: string)   => api.patch(`/studies/pomodoro/${id}/tick`).then(r => r.data),
    complete: (id: string)   => api.patch(`/studies/pomodoro/${id}/complete`).then(r => r.data),
    cancel:   (id: string)   => api.patch(`/studies/pomodoro/${id}/cancel`).then(r => r.data),
  },
}

// ─── Calendar ─────────────────────────────────────────────

export const calendarService = {
  events: {
    list:   (params?: object) => api.get('/calendar', { params }).then(r => r.data),
    create: (data: object)    => api.post('/calendar', data).then(r => r.data),
    update: (id: string, data: object) => api.patch(`/calendar/${id}`, data).then(r => r.data),
    delete: (id: string)      => api.delete(`/calendar/${id}`).then(r => r.data),
  },
}

// ─── Projects ─────────────────────────────────────────────

export const projectsService = {
  list:   ()             => api.get('/projects').then(r => r.data),
  create: (data: object) => api.post('/projects', data).then(r => r.data),
  update: (id: string, data: object) => api.patch(`/projects/${id}`, data).then(r => r.data),
  delete: (id: string)   => api.delete(`/projects/${id}`).then(r => r.data),
  tasks: {
    list:   (projectId: string)              => api.get(`/projects/${projectId}/tasks`).then(r => r.data),
    create: (projectId: string, data: object) => api.post(`/projects/${projectId}/tasks`, data).then(r => r.data),
    update: (projectId: string, id: string, data: object) => api.patch(`/projects/${projectId}/tasks/${id}`, data).then(r => r.data),
    delete: (projectId: string, id: string)  => api.delete(`/projects/${projectId}/tasks/${id}`).then(r => r.data),
  },
}

// ─── AI ───────────────────────────────────────────────────

export const aiService = {
  chat:    (message: string, context?: string) =>
    api.post('/ai/chat', { message, context }).then(r => r.data),
  insights:() => api.get('/ai/insights').then(r => r.data),
  history: () => api.get('/ai/history').then(r => r.data),
}

// ─── Notifications ────────────────────────────────────────

export const notificationsService = {
  list:    () => api.get('/notifications').then(r => r.data),
  markRead:(id: string) => api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAll: ()           => api.patch('/notifications/read-all').then(r => r.data),
  delete:  (id: string) => api.delete(`/notifications/${id}`).then(r => r.data),
}

// ─── Reports ─────────────────────────────────────────────

export const reportsService = {
  generate: (type: string, params: object) =>
    api.post('/reports', { type, ...params }, { responseType: 'blob' }).then(r => r.data),
}

// ─── Dashboard ────────────────────────────────────────────

export const dashboardService = {
  summary: () => api.get('/dashboard').then(r => r.data),
  weather: (city: string) => api.get('/dashboard/weather', { params: { city } }).then(r => r.data),
}
