import { Activity, BarChart3, Monitor, Moon, Palette, RotateCcw, Waves } from 'lucide-react'
import { usePrefs, type Theme, type VisualizerMode } from '@/lib/prefs'

interface SettingsPanelProps {
  onClose: () => void
}

const THEMES: Array<{ id: Theme; label: string; hint: string; icon: React.ReactNode }> = [
  { id: 'gomeow', label: 'Go Meow', hint: 'Dark amber studio colors', icon: <Palette size={16} /> },
  { id: 'native', label: 'OS Default', hint: 'Follows system light/dark', icon: <Monitor size={16} /> },
]

const VISUALIZERS: Array<{ id: VisualizerMode; label: string; icon: React.ReactNode }> = [
  { id: 'spectrum', label: 'Spectrum', icon: <Activity size={16} /> },
  { id: 'bars', label: 'Bars', icon: <BarChart3 size={16} /> },
  { id: 'waveform', label: 'Scope', icon: <Waves size={16} /> },
]

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const theme = usePrefs(state => state.theme)
  const reduceMotion = usePrefs(state => state.reduceMotion)
  const visualizerMode = usePrefs(state => state.visualizerMode)
  const set = usePrefs(state => state.set)

  return (
    <div className="settingsScrim" onClick={onClose}>
      <section className="settingsPanel" onClick={event => event.stopPropagation()}>
        <header className="panelHeader">
          <div>
            <h2>Preferences</h2>
            <p>Theme, motion, and visualization.</p>
          </div>
          <button className="iconButton" onClick={onClose} aria-label="Close preferences">x</button>
        </header>

        <div className="settingsSection">
          <h3>Theme</h3>
          <div className="choiceGrid">
            {THEMES.map(option => (
              <button
                key={option.id}
                className={theme === option.id ? 'choice selected' : 'choice'}
                onClick={() => set('theme', option.id)}
              >
                {option.icon}
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.hint}</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="settingsSection">
          <h3>Visualizer</h3>
          <div className="segmented">
            {VISUALIZERS.map(option => (
              <button
                key={option.id}
                className={visualizerMode === option.id ? 'selected' : ''}
                onClick={() => set('visualizerMode', option.id)}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settingsRow">
          <div>
            <strong>Reduce motion</strong>
            <small>Calms transitions and visual pulse.</small>
          </div>
          <button
            className={reduceMotion ? 'toggle on' : 'toggle'}
            onClick={() => set('reduceMotion', !reduceMotion)}
            aria-pressed={reduceMotion}
          >
            <span />
          </button>
        </div>

        <button className="secondaryButton" onClick={() => {
          set('theme', 'gomeow')
          set('visualizerMode', 'spectrum')
          set('reduceMotion', false)
        }}>
          <RotateCcw size={16} />
          Reset display
        </button>
      </section>
    </div>
  )
}
