// ============================================================
// Personal Hub — Tipos globais (espelham o schema Prisma)
// ============================================================

// ─── Enums ────────────────────────────────────────────────

export type Theme = 'LIGHT' | 'DARK' | 'SYSTEM'

export type Priority   = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'ARCHIVED'
export type Recurrence = 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM'
export type HabitFreq  = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export type GoalCategory = 'PERSONAL' | 'FINANCIAL' | 'HEALTH' | 'CAREER' | 'EDUCATION' | 'RELATIONSHIP' | 'TRAVEL' | 'OTHER'
export type GoalStatus   = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED'
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ARCHIVED'

export type StudyType     = 'FREE' | 'POMODORO' | 'DEEP_WORK' | 'REVIEW'
export type PomodoroStatus = 'IDLE' | 'WORKING' | 'BREAK' | 'COMPLETED' | 'CANCELLED'

export type AccountType     = 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CREDIT_CARD' | 'WALLET' | 'OTHER'
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'INVESTMENT'
export type PaymentMethod   = 'MONEY' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'PIX' | 'TRANSFER' | 'BOLETO' | 'OTHER'
export type BillingCycle    = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL'

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'TASK_DUE' | 'HABIT_REMINDER' | 'GOAL_UPDATE' | 'FINANCIAL_ALERT' | 'SYSTEM'

// ─── Modelos ──────────────────────────────────────────────

export interface User {
  id:           string
  name:         string
  email:        string
  avatarUrl?:   string | null
  timezone:     string
  locale:       string
  theme:        Theme
  onboarded:    boolean
  createdAt:    string
  settings?:    UserSettings
}

export interface UserSettings {
  id:                   string
  userId:               string
  notificationsDesktop: boolean
  notificationsPush:    boolean
  weekStartsOn:         number
  dailyGoalHours:       number
  workStartHour:        number
  workEndHour:          number
  currency:             string
  monthlyBudget?:       number | null
  savingsGoalPercent:   number
}

// Tasks
export interface Task {
  id:               string
  userId:           string
  title:            string
  description?:     string | null
  category?:        string | null
  priority:         Priority
  status:           TaskStatus
  dueDate?:         string | null
  scheduledAt?:     string | null
  estimatedMinutes?: number | null
  actualMinutes?:   number | null
  recurrence:       Recurrence
  color?:           string | null
  icon?:            string | null
  tags:             string[]
  isFavorite:       boolean
  position:         number
  subtasks:         Subtask[]
  attachments?:     Attachment[]
  createdAt:        string
  updatedAt:        string
}

export interface Subtask {
  id:       string
  taskId:   string
  title:    string
  done:     boolean
  position: number
}

export interface Attachment {
  id:        string
  name:      string
  url:       string
  type:      string
  size:      number
  createdAt: string
}

// Habits
export interface Habit {
  id:          string
  userId:      string
  name:        string
  description?: string | null
  icon?:       string | null
  color?:      string | null
  category?:   string | null
  frequency:   HabitFreq
  targetDays:  number[]
  targetCount: number
  unit?:       string | null
  isActive:    boolean
  position:    number
  logs?:       HabitLog[]
  streak?:     number
  longestStreak?: number
  completionRate?: number
  createdAt:   string
}

export interface HabitLog {
  id:        string
  habitId:   string
  userId:    string
  date:      string
  count:     number
  note?:     string | null
  createdAt: string
}

// Goals
export interface Goal {
  id:           string
  userId:       string
  title:        string
  description?: string | null
  category:     GoalCategory
  targetValue:  number
  currentValue: number
  unit?:        string | null
  dueDate?:     string | null
  status:       GoalStatus
  color?:       string | null
  icon?:        string | null
  milestones?:  GoalMilestone[]
  progress:     number // computed: currentValue/targetValue * 100
  createdAt:    string
  updatedAt:    string
}

export interface GoalMilestone {
  id:          string
  goalId:      string
  title:       string
  targetValue: number
  isDone:      boolean
  doneAt?:     string | null
  position:    number
}

// Projects
export interface Project {
  id:          string
  userId:      string
  name:        string
  description?: string | null
  color?:      string | null
  icon?:       string | null
  status:      ProjectStatus
  dueDate?:    string | null
  progress:    number
  tasks?:      ProjectTask[]
  createdAt:   string
  updatedAt:   string
}

export interface ProjectTask {
  id:          string
  projectId:   string
  userId:      string
  title:       string
  description?: string | null
  status:      TaskStatus
  priority:    Priority
  dueDate?:    string | null
  position:    number
  createdAt:   string
}

// Studies
export interface Subject {
  id:          string
  userId:      string
  name:        string
  description?: string | null
  color?:      string | null
  icon?:       string | null
  weeklyHours: number
  totalHours?: number // computed from sessions
  createdAt:   string
}

export interface StudySession {
  id:          string
  userId:      string
  subjectId?:  string | null
  subject?:    Subject | null
  title?:      string | null
  notes?:      string | null
  startedAt:   string
  endedAt?:    string | null
  durationMin: number
  type:        StudyType
  createdAt:   string
}

// Finance
export interface FinancialAccount {
  id:           string
  userId:       string
  name:         string
  type:         AccountType
  balance:      number
  currency:     string
  color?:       string | null
  icon?:        string | null
  isActive:     boolean
  includeInNet: boolean
  createdAt:    string
}

export interface FinancialCategory {
  id:       string
  userId:   string
  name:     string
  type:     TransactionType
  icon?:    string | null
  color?:   string | null
  isSystem: boolean
}

export interface Transaction {
  id:                string
  userId:            string
  accountId:         string
  account?:          FinancialAccount
  categoryId?:       string | null
  category?:         FinancialCategory | null
  title:             string
  description?:      string | null
  amount:            number
  type:              TransactionType
  date:              string
  paymentMethod:     PaymentMethod
  isRecurring:       boolean
  recurrence:        Recurrence
  isInstallment:     boolean
  installmentNumber?: number | null
  installmentTotal?:  number | null
  tags:              string[]
  receiptUrl?:       string | null
  isPaid:            boolean
  dueDate?:          string | null
  createdAt:         string
}

export interface Subscription {
  id:             string
  userId:         string
  name:           string
  description?:   string | null
  amount:         number
  currency:       string
  billingCycle:   BillingCycle
  nextBillingDate?: string | null
  category?:      string | null
  color?:         string | null
  icon?:          string | null
  isActive:       boolean
  url?:           string | null
  createdAt:      string
}

// Calendar
export interface CalendarEvent {
  id:              string
  userId:          string
  title:           string
  description?:    string | null
  location?:       string | null
  color?:          string | null
  icon?:           string | null
  startAt:         string
  endAt:           string
  allDay:          boolean
  recurrence:      Recurrence
  reminderMinutes: number[]
  createdAt:       string
}

// Notifications
export interface Notification {
  id:        string
  userId:    string
  title:     string
  body:      string
  type:      NotificationType
  link?:     string | null
  isRead:    boolean
  readAt?:   string | null
  createdAt: string
}

// AI
export interface AiMessage {
  role:      'user' | 'assistant' | 'system'
  content:   string
  createdAt: string
}

export interface AiChat {
  id:        string
  userId:    string
  title?:    string | null
  messages:  AiMessage[]
  context?:  string | null
  createdAt: string
  updatedAt: string
}

// ─── Helpers de API ───────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data:    T
  message?: string
}

export interface ApiError {
  error:   string
  code?:   string
  details?: unknown
}

export interface PaginatedResponse<T> {
  data:  T[]
  total: number
  page:  number
  limit: number
}

// ─── Dashboard summary ────────────────────────────────────

export interface DashboardSummary {
  todayTasks:       { total: number; done: number; overdue: number }
  nextTask?:        Task | null
  todayExpense:     number
  dailyGoal?:       Goal | null
  hoursStudied:     number
  habitsToday:      { total: number; done: number }
  upcomingBills:    Transaction[]
  activeProjects:   number
  monthBalance:     number
  netWorth:         number
  monthSavings:     number
  financialGoal?:   Goal | null
  weather?:         WeatherData | null
}

export interface WeatherData {
  city:        string
  temp:        number
  description: string
  icon:        string
  humidity:    number
  wind:        number
}

// ─── Finance summary ─────────────────────────────────────

export interface FinancialSummary {
  totalIncome:       number
  totalExpense:      number
  balance:           number
  netWorth:          number
  savings:           number
  savingsRate:       number
  expenseByCategory: { category: string; amount: number; percentage: number }[]
  monthlyTrend:      { month: string; income: number; expense: number }[]
  upcomingBills:     Transaction[]
  subscriptionTotal: number
}
