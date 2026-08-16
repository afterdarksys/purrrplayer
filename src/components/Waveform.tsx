import { clsx } from 'clsx'

interface WaveformProps {
  peaks: number[]
  progress: number
  onSeek?: (position: number) => void
  className?: string
}

export function Waveform({ peaks, progress, onSeek, className }: WaveformProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress))
  const interactive = typeof onSeek === 'function'

  function seek(event: React.MouseEvent<HTMLElement>) {
    if (!onSeek) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (!bounds.width) return
    onSeek(Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)))
  }

  const Element = interactive ? 'button' : 'div'

  return (
    <Element
      type={interactive ? 'button' : undefined}
      onClick={interactive ? seek : undefined}
      aria-label={interactive ? 'Seek through track' : undefined}
      className={clsx('waveform', interactive && 'waveformInteractive', className)}
    >
      {peaks.map((peak, index) => {
        const played = (index + 0.5) / peaks.length <= clampedProgress
        return (
          <span
            key={index}
            className={clsx('waveformBar', played && 'waveformBarPlayed')}
            style={{ height: `${Math.max(0.06, Math.min(1, peak)) * 100}%` }}
          />
        )
      })}
    </Element>
  )
}
