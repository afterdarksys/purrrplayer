import { create } from 'zustand'

export type Theme = 'gomeow' | 'native'
export type VisualizerMode = 'spectrum' | 'bars' | 'waveform'

export interface Prefs {
  theme: Theme
  reduceMotion: boolean
  visualizerMode: VisualizerMode
  volume: number
  purrBetweenSongs: boolean
}

export const DEFAULT_PREFS: Prefs = {
  theme: 'gomeow',
  reduceMotion: false,
  visualizerMode: 'spectrum',
  volume: 0.85,
  purrBetweenSongs: false,
}

const STORE_FILE = 'purrr-player-prefs.json'
const STORE_KEY = 'prefs'

let storePromise: Promise<{
  get: <T>(key: string) => Promise<T | undefined>
  set: (key: string, value: unknown) => Promise<void>
  save: () => Promise<void>
} | null> | null = null

async function store() {
  if (!storePromise) {
    storePromise = (async () => {
      try {
        const { LazyStore } = await import('@tauri-apps/plugin-store')
        return new LazyStore(STORE_FILE, { autoSave: true, defaults: {} }) as never
      } catch {
        return null
      }
    })()
  }
  return storePromise
}

function boundedVolume(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_PREFS.volume
  return Math.max(0, Math.min(1, value))
}

export function applyPrefs(prefs: Prefs): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = prefs.theme
  document.documentElement.dataset.reduceMotion = String(prefs.reduceMotion)
}

async function persist(prefs: Prefs): Promise<void> {
  const prefsStore = await store()
  if (!prefsStore) {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(prefs))
    return
  }
  await prefsStore.set(STORE_KEY, prefs)
  await prefsStore.save()
}

interface PrefsStore extends Prefs {
  loaded: boolean
  load: () => Promise<void>
  set: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void
}

export const usePrefs = create<PrefsStore>((set, get) => ({
  ...DEFAULT_PREFS,
  loaded: false,

  load: async () => {
    let next = DEFAULT_PREFS
    const prefsStore = await store()
    if (prefsStore) {
      const saved = await prefsStore.get<Partial<Prefs>>(STORE_KEY).catch(() => undefined)
      if (saved) next = { ...DEFAULT_PREFS, ...saved, volume: boundedVolume(saved.volume) }
    } else {
      try {
        const saved = JSON.parse(window.localStorage.getItem(STORE_KEY) || 'null') as Partial<Prefs> | null
        if (saved) next = { ...DEFAULT_PREFS, ...saved, volume: boundedVolume(saved.volume) }
      } catch {
        next = DEFAULT_PREFS
      }
    }
    applyPrefs(next)
    set({ ...next, loaded: true })
  },

  set: (key, value) => {
    const next = { ...get(), [key]: value }
    const { loaded: _loaded, load: _load, set: _set, ...prefs } = next
    applyPrefs(prefs)
    set({ [key]: value } as Pick<PrefsStore, typeof key>)
    void persist(prefs)
  },
}))
