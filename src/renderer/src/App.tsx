import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'

import { toast, ToastContainer } from 'react-toastify'
import { router } from './routers'
import { ThemeProvider } from './components/theme-provider'

const App = (): JSX.Element => {
  useEffect(() => {
    // Global hata dinleyicisi
    window.api.app.onError((error) => {
      toast.error(error.message, {
        type: error.severity === 'CRITICAL' ? 'error' : 'warning'
      })
    })
    // Cleanup
    return () => {
      window.api.app.removeOnErrorListener()
    }
  }, [])

  return (
    <ThemeProvider defaultTheme="light">
      <RouterProvider router={router} />
      <ToastContainer theme="colored" position="top-right" autoClose={5000} />
    </ThemeProvider>
  )
}

export default App
