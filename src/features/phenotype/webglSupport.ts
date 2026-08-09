let cachedWebglSupport: boolean | undefined

export function canUseWebgl(): boolean {
  if (cachedWebglSupport !== undefined) return cachedWebglSupport
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof window.WebGLRenderingContext === 'undefined') {
    cachedWebglSupport = false
    return cachedWebglSupport
  }

  try {
    const probe = document.createElement('canvas')
    const context = probe.getContext('webgl2') ?? probe.getContext('webgl')
    cachedWebglSupport = Boolean(context)
    context?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    cachedWebglSupport = false
  }

  return cachedWebglSupport
}
