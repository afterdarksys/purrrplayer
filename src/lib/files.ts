export const AUDIO_EXTENSIONS = [
  'mp3',
  'wav',
  'flac',
  'aiff',
  'aif',
  'ogg',
  'oga',
  'm4a',
  'aac',
  'opus',
  'webm',
]

export interface PickedAudioFile {
  id: string
  name: string
  path?: string
  url: string
  file?: File
}

export async function pickAudioFiles(): Promise<PickedAudioFile[]> {
  const tauriFiles = await pickWithTauri()
  if (tauriFiles) return tauriFiles
  return pickWithBrowser()
}

async function pickWithTauri(): Promise<PickedAudioFile[] | null> {
  try {
    const [{ open }, { convertFileSrc }] = await Promise.all([
      import('@tauri-apps/plugin-dialog'),
      import('@tauri-apps/api/core'),
    ])
    const selected = await open({
      filters: [{ name: 'Audio', extensions: AUDIO_EXTENSIONS }],
      multiple: true,
    })
    if (!selected) return []
    const paths = Array.isArray(selected) ? selected : [selected]
    return paths.filter(isString).map(path => ({
      id: `${path}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
      name: fileName(path),
      path,
      url: convertFileSrc(path),
    }))
  } catch {
    return null
  }
}

function pickWithBrowser(): Promise<PickedAudioFile[]> {
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = AUDIO_EXTENSIONS.map(ext => `.${ext}`).join(',')
    input.addEventListener('change', () => {
      const files = [...(input.files || [])]
      resolve(files.map(file => ({
        id: `${file.name}:${file.lastModified}:${file.size}`,
        name: file.name,
        file,
        url: URL.createObjectURL(file),
      })))
    }, { once: true })
    input.click()
  })
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function fileName(path: string): string {
  return path.split(/[\\/]/).pop() || path
}
