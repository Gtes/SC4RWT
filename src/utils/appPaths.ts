/** Resolve paths under Vite `base` (e.g. `/` or `/SC4RWT/`). */
export const withBasePath = (path: string): string => {
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const normalizedPath = path.replace(/^\//, '')
  return `${normalizedBase}${normalizedPath}`
}

export const appHomeHref = (): string => withBasePath('')

export const synthDepthTestHref = (): string =>
  withBasePath('test-synth-depth')

/** True when the current URL is the synth-depth playground. */
export const isSynthDepthTestPath = (
  pathname: string = typeof window !== 'undefined' ? window.location.pathname : '',
): boolean => {
  const stripTrailing = (s: string) => s.replace(/\/+$/, '') || '/'
  const path = stripTrailing(pathname)
  return (
    path === '/test-synth-depth' ||
    path === 'test-synth-depth' ||
    path.endsWith('/test-synth-depth')
  )
}
