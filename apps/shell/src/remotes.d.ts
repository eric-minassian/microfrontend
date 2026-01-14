declare module 'mfe1/App' {
  import type { ComponentType } from 'react'
  interface AppProps {
    basePath?: string
  }
  const App: ComponentType<AppProps>
  export default App
}

declare module 'mfe2/App' {
  import type { ComponentType } from 'react'
  interface AppProps {
    basePath?: string
  }
  const App: ComponentType<AppProps>
  export default App
}
