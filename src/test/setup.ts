import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// This Node + jsdom combination does not provide a working localStorage, so use an in-memory shim.
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() { return this.store.size }
  clear() { this.store.clear() }
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null }
  setItem(key: string, value: string) { this.store.set(key, String(value)) }
  removeItem(key: string) { this.store.delete(key) }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null }
}
Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true, writable: true })

// jsdom does not implement object URLs or anchor-triggered downloads used by downloadBlob.
Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), writable: true })
Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), writable: true })
HTMLAnchorElement.prototype.click = vi.fn()
