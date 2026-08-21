import type { Attempt } from '../types'

const ACTIVE_KEY = 'ctp.active'
const HISTORY_KEY = 'ctp.history'
const HISTORY_LIMIT = 50

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function loadActive(): Attempt | null {
  return read<Attempt>(ACTIVE_KEY)
}

export function saveActive(attempt: Attempt): void {
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(attempt))
}

export function clearActive(): void {
  localStorage.removeItem(ACTIVE_KEY)
}

export function loadHistory(): Attempt[] {
  return read<Attempt[]>(HISTORY_KEY) ?? []
}

export function getAttempt(id: string): Attempt | null {
  return loadHistory().find((a) => a.id === id) ?? null
}

/** Move a finished attempt into history (newest first, capped). */
export function saveToHistory(attempt: Attempt): void {
  const history = [attempt, ...loadHistory().filter((a) => a.id !== attempt.id)]
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT)))
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
}

export function newAttemptId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
