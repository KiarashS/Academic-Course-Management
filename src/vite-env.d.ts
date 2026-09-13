/// <reference types="vite/client" />

declare module '*.yaml' {
  const content: unknown
  export default content
}

declare module '*.yml' {
  const content: unknown
  export default content
}

/** Sizes of everything under public/courses, keyed by path relative to it. */
declare module 'virtual:course-files' {
  const sizes: Record<string, number>
  export default sizes
}
