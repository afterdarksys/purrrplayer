export interface DecodedTrack {
  duration: number
  peaks: number[]
}

const PEAK_COUNT = 96

export async function decodeTrack(url: string, audioContext: AudioContext): Promise<DecodedTrack> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not read audio: ${response.status}`)
  const bytes = await response.arrayBuffer()
  const buffer = await audioContext.decodeAudioData(bytes.slice(0))
  return {
    duration: buffer.duration,
    peaks: peaksFromBuffer(buffer, PEAK_COUNT),
  }
}

export function peaksFromBuffer(buffer: AudioBuffer, count: number): number[] {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index))
  const samplesPerBucket = Math.max(1, Math.floor(buffer.length / count))
  const peaks: number[] = []

  for (let bucket = 0; bucket < count; bucket++) {
    const start = bucket * samplesPerBucket
    const end = Math.min(buffer.length, start + samplesPerBucket)
    let peak = 0
    for (let i = start; i < end; i++) {
      let mixed = 0
      for (const channel of channels) mixed += Math.abs(channel[i] || 0)
      peak = Math.max(peak, mixed / channels.length)
    }
    peaks.push(peak)
  }

  const max = Math.max(...peaks, 0.001)
  return peaks.map(peak => Math.max(0.04, peak / max))
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
