import { convertFileSrc, invoke } from '@tauri-apps/api/core'

export interface CliRequest {
  args: string[]
  cwd: string
}

export interface CliAudioFile {
  path: string
  name: string
}

export type CliCommand =
  | { type: 'play'; paths: string[] }
  | { type: 'queue'; paths: string[] }
  | { type: 'pause' }
  | { type: 'toggle' }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'stop' }
  | { type: 'seek'; seconds: number; paths: string[] }
  | { type: 'skip'; seconds: number; paths: string[] }
  | { type: 'volume'; value: number }
  | { type: 'purr' }

const COMMANDS = new Set([
  'add',
  'ff',
  'next',
  'open',
  'pause',
  'play',
  'prev',
  'previous',
  'purr',
  'queue',
  'rew',
  'seek',
  'skip',
  'stop',
  'toggle',
  'volume',
])

export async function getInitialCliRequest(): Promise<CliRequest | null> {
  try {
    return await invoke<CliRequest>('get_initial_cli_request')
  } catch {
    return null
  }
}

export function parseCliCommand(request: CliRequest): CliCommand | null {
  const args = normalizeArgs(request.args)
  if (!args.length) return null

  const [command, ...rest] = args
  const lowerCommand = command.toLowerCase()

  if (!COMMANDS.has(lowerCommand)) return { type: 'play', paths: args }

  switch (lowerCommand) {
    case 'add':
    case 'open':
    case 'queue':
      return rest.length ? { type: 'queue', paths: rest } : null
    case 'play':
      return rest.length ? { type: 'play', paths: rest } : { type: 'toggle' }
    case 'pause':
      return { type: 'pause' }
    case 'toggle':
      return { type: 'toggle' }
    case 'next':
      return { type: 'next' }
    case 'prev':
    case 'previous':
      return { type: 'previous' }
    case 'stop':
      return { type: 'stop' }
    case 'purr':
      return { type: 'purr' }
    case 'ff':
    case 'skip':
      return parseTimedCommand(rest, 1)
    case 'rew':
      return parseTimedCommand(rest, -1)
    case 'seek':
      return parseSeekCommand(rest)
    case 'volume':
      return parseVolumeCommand(rest)
    default:
      return null
  }
}

export async function resolveCliAudioFiles(paths: string[], cwd: string): Promise<CliAudioFile[]> {
  if (!paths.length) return []
  try {
    return await invoke<CliAudioFile[]>('resolve_audio_files', { paths, cwd })
  } catch {
    return []
  }
}

export function cliAudioFileUrl(path: string): string {
  return convertFileSrc(path)
}

function parseTimedCommand(args: string[], direction: 1 | -1): CliCommand | null {
  const [secondsArg, ...paths] = args
  const seconds = Number(secondsArg)
  if (!Number.isFinite(seconds)) return null
  return { type: 'skip', seconds: Math.abs(seconds) * direction, paths }
}

function parseSeekCommand(args: string[]): CliCommand | null {
  const [secondsArg, ...paths] = args
  const seconds = Number(secondsArg)
  if (!Number.isFinite(seconds) || seconds < 0) return null
  return { type: 'seek', seconds, paths }
}

function parseVolumeCommand(args: string[]): CliCommand | null {
  const value = Number(args[0])
  if (!Number.isFinite(value)) return null
  return { type: 'volume', value: value > 1 ? value / 100 : value }
}

function normalizeArgs(args: string[]): string[] {
  const normalized = args.filter(Boolean)
  const [first, second] = normalized
  if (!first || COMMANDS.has(first.toLowerCase())) return normalized
  if (second && COMMANDS.has(second.toLowerCase()) && looksLikeExecutable(first)) {
    return normalized.slice(1)
  }
  return normalized
}

function looksLikeExecutable(value: string): boolean {
  const lowerValue = value.toLowerCase()
  return (
    lowerValue.endsWith('purrrplayer') ||
    lowerValue.endsWith('purrrplayer.exe') ||
    lowerValue.includes('/purrrplayer') ||
    lowerValue.includes('\\purrrplayer') ||
    lowerValue.endsWith('purrr-player') ||
    lowerValue.endsWith('purrr-player.exe') ||
    lowerValue.includes('/purrr-player') ||
    lowerValue.includes('\\purrr-player')
  )
}
