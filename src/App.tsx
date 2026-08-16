import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FolderOpen,
  Pause,
  Play,
  Settings,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  Waves,
} from 'lucide-react'
import { clsx } from 'clsx'
import { decodeTrack, formatTime, type DecodedTrack } from '@/lib/audio'
import { pickAudioFiles, type PickedAudioFile } from '@/lib/files'
import { usePrefs } from '@/lib/prefs'
import { Waveform } from '@/components/Waveform'
import { Visualizer } from '@/components/Visualizer'
import { SettingsPanel } from '@/components/SettingsPanel'

interface TrackState extends PickedAudioFile {
  decoded?: DecodedTrack
  status: 'idle' | 'loading' | 'ready' | 'error'
}

export default function App() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const [tracks, setTracks] = useState<TrackState[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dropActive, setDropActive] = useState(false)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)

  const visualizerMode = usePrefs(state => state.visualizerMode)
  const volume = usePrefs(state => state.volume)
  const purrBetweenSongs = usePrefs(state => state.purrBetweenSongs)
  const setPref = usePrefs(state => state.set)

  const activeTrack = useMemo(
    () => tracks.find(track => track.id === activeId) || null,
    [tracks, activeId],
  )

  useEffect(() => { void usePrefs.getState().load() }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !activeTrack) return
    audio.src = activeTrack.url
    audio.load()
    setCurrentTime(0)
    setDuration(activeTrack.decoded?.duration || 0)
    void warmDecode(activeTrack)
  }, [activeTrack?.id])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const update = () => {
      setCurrentTime(audio.currentTime)
      setDuration(audio.duration || activeTrack?.decoded?.duration || 0)
    }
    const ended = () => void handleTrackEnded()
    const playing = () => setIsPlaying(true)
    const pause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', update)
    audio.addEventListener('loadedmetadata', update)
    audio.addEventListener('ended', ended)
    audio.addEventListener('play', playing)
    audio.addEventListener('pause', pause)
    return () => {
      audio.removeEventListener('timeupdate', update)
      audio.removeEventListener('loadedmetadata', update)
      audio.removeEventListener('ended', ended)
      audio.removeEventListener('play', playing)
      audio.removeEventListener('pause', pause)
    }
  }, [activeTrack?.id, tracks, activeId, purrBetweenSongs])

  function ensureAudioGraph(): AnalyserNode | null {
    const audio = audioRef.current
    if (!audio) return null
    if (!audioContextRef.current) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext
      audioContextRef.current = new AudioContextCtor()
    }
    const context = audioContextRef.current
    if (!sourceRef.current) {
      sourceRef.current = context.createMediaElementSource(audio)
      analyserRef.current = context.createAnalyser()
      analyserRef.current.fftSize = 2048
      analyserRef.current.smoothingTimeConstant = 0.84
      sourceRef.current.connect(analyserRef.current)
      analyserRef.current.connect(context.destination)
      setAnalyserNode(analyserRef.current)
    }
    return analyserRef.current
  }

  async function warmDecode(track: TrackState) {
    if (track.decoded || track.status === 'loading') return
    try {
      setTracks(prev => prev.map(item => item.id === track.id ? { ...item, status: 'loading' } : item))
      const context = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = context
      const decoded = await decodeTrack(track.url, context)
      setTracks(prev => prev.map(item => item.id === track.id ? { ...item, decoded, status: 'ready' } : item))
      if (track.id === activeId) setDuration(decoded.duration)
    } catch {
      setTracks(prev => prev.map(item => item.id === track.id ? { ...item, status: 'error' } : item))
    }
  }

  async function addPickedFiles(files: PickedAudioFile[]) {
    if (!files.length) return
    const nextTracks: TrackState[] = files.map(file => ({ ...file, status: 'idle' }))
    setTracks(prev => [...prev, ...nextTracks])
    setActiveId(current => current || nextTracks[0]?.id || null)
  }

  async function openFiles() {
    await addPickedFiles(await pickAudioFiles())
  }

  async function togglePlay() {
    const audio = audioRef.current
    if (!audio || !activeTrack) {
      await openFiles()
      return
    }
    const analyser = ensureAudioGraph()
    await audioContextRef.current?.resume()
    if (!analyser) return
    if (audio.paused) await audio.play()
    else audio.pause()
  }

  async function playTrack(id: string) {
    setActiveId(id)
    window.setTimeout(() => {
      ensureAudioGraph()
      void audioContextRef.current?.resume()
      void audioRef.current?.play()
    }, 40)
  }

  async function playPurr(): Promise<void> {
    const purr = new Audio('/purrs/cat-purr-active-loop.wav')
    purr.volume = Math.min(0.7, Math.max(0.18, volume * 0.72))
    await purr.play().catch(() => undefined)
    if (purr.paused) return
    await new Promise<void>(resolve => {
      purr.addEventListener('ended', () => resolve(), { once: true })
      purr.addEventListener('error', () => resolve(), { once: true })
    })
  }

  async function handleTrackEnded() {
    if (purrBetweenSongs && tracks.length > 1) await playPurr()
    await playNext()
  }

  async function playNext() {
    if (!tracks.length || !activeId) return
    const index = tracks.findIndex(track => track.id === activeId)
    const next = tracks[(index + 1) % tracks.length]
    if (next) await playTrack(next.id)
  }

  async function playPrevious() {
    if (!tracks.length || !activeId) return
    const audio = audioRef.current
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    const index = tracks.findIndex(track => track.id === activeId)
    const previous = tracks[(index - 1 + tracks.length) % tracks.length]
    if (previous) await playTrack(previous.id)
  }

  function seek(position: number) {
    const audio = audioRef.current
    if (!audio) return
    const targetDuration = audio.duration || activeTrack?.decoded?.duration || 0
    audio.currentTime = position * targetDuration
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault()
    setDropActive(false)
    const files = [...event.dataTransfer.files].filter(file => file.type.startsWith('audio/') || /\.(mp3|wav|flac|aiff?|ogg|oga|m4a|aac|opus|webm)$/i.test(file.name))
    void addPickedFiles(files.map(file => ({
      id: `${file.name}:${file.lastModified}:${file.size}`,
      name: file.name,
      file,
      url: URL.createObjectURL(file),
    })))
  }

  const peaks = activeTrack?.decoded?.peaks || Array.from({ length: 96 }, (_, index) => 0.12 + Math.sin(index * 0.45) * 0.05)
  const progress = duration ? currentTime / duration : 0
  const volumeIcon = volume > 0.55 ? <Volume2 size={18} /> : <Volume1 size={18} />

  return (
    <main
      className={clsx('appShell', dropActive && 'dropActive')}
      onDragOver={event => {
        event.preventDefault()
        setDropActive(true)
      }}
      onDragLeave={() => setDropActive(false)}
      onDrop={handleDrop}
    >
      <audio ref={audioRef} preload="metadata" />

      <header className="topBar">
        <div className="brandMark" aria-hidden="true">
          <span className="paw">♪</span>
        </div>
        <div className="brandText">
          <h1>Purrr Player</h1>
          <p>{activeTrack ? activeTrack.name : 'Local files. Cat energy. Real playback.'}</p>
        </div>
        <div className="topActions">
          <button className="secondaryButton" onClick={openFiles}>
            <FolderOpen size={17} />
            Open
          </button>
          <button className="iconButton" onClick={() => setSettingsOpen(true)} aria-label="Open preferences">
            <Settings size={18} />
          </button>
        </div>
      </header>

      <section className="playerGrid">
        <section className="nowPlaying">
          <div className="albumBadge">
            <div className="catDisc">
              <span className="ear left" />
              <span className="ear right" />
              <span className="note">♪</span>
            </div>
          </div>

          <div className="trackMeta">
            <span className="eyebrow">Now Playing</span>
            <h2>{activeTrack?.name || 'Drop audio files here'}</h2>
            <p>{activeTrack?.path || 'MP3, WAV, FLAC, AIFF, OGG, M4A, AAC, Opus, and WebM where the platform decoder supports them.'}</p>
          </div>

          <Visualizer analyser={analyserNode} mode={visualizerMode} active={isPlaying} />

          <div className="timeline">
            <Waveform peaks={peaks} progress={progress} onSeek={activeTrack ? seek : undefined} />
            <div className="timeRow">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="transport">
            <button className="iconButton large" onClick={playPrevious} aria-label="Previous track">
              <SkipBack size={22} />
            </button>
            <button className="playButton" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}
            </button>
            <button className="iconButton large" onClick={playNext} aria-label="Next track">
              <SkipForward size={22} />
            </button>
          </div>

          <div className="purrActions">
            <button className="secondaryButton purrButton" onClick={() => { void playPurr() }}>
              <Waves size={17} />
              Add a purrr
            </button>
            <button
              className={clsx('secondaryButton purrButton', purrBetweenSongs && 'active')}
              onClick={() => setPref('purrBetweenSongs', !purrBetweenSongs)}
            >
              Purrr between songs
            </button>
          </div>

          <label className="volumeControl">
            {volumeIcon}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={event => setPref('volume', Number(event.target.value))}
            />
          </label>
        </section>

        <aside className="queuePanel">
          <div className="panelHeader">
            <div>
              <h2>Queue</h2>
              <p>{tracks.length ? `${tracks.length} track${tracks.length === 1 ? '' : 's'}` : 'No tracks yet'}</p>
            </div>
          </div>

          <div className="queueList">
            {tracks.length === 0 ? (
              <button className="emptyQueue" onClick={openFiles}>
                <FolderOpen size={28} />
                <span>Open some audio</span>
              </button>
            ) : tracks.map((track, index) => (
              <button
                key={track.id}
                className={clsx('queueItem', track.id === activeId && 'active')}
                onClick={() => void playTrack(track.id)}
              >
                <span className="queueIndex">{String(index + 1).padStart(2, '0')}</span>
                <span className="queueName">{track.name}</span>
                <span className="queueStatus">
                  {track.status === 'loading' ? 'scan' : track.status === 'error' ? 'err' : track.decoded ? formatTime(track.decoded.duration) : '--'}
                </span>
              </button>
            ))}
          </div>
        </aside>
      </section>

      {dropActive && <div className="dropHint">Drop to add to the queue</div>}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </main>
  )
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}
