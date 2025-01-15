import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'

import { toast, ToastContainer } from 'react-toastify'
import { router } from './routers'
import { ThemeProvider } from './components/theme-provider'
import Loading from './components/loading'

const App = (): JSX.Element => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Loading tamamlandığında
    window.api.app.onLoadingComplete(() => {
      setIsLoading(false)
    })

    // Global hata dinleyicisi
    window.api.app.onError((error) => {
      toast.error(error.message, {
        type: error.severity === 'CRITICAL' ? 'error' : 'warning'
      })
    })

    // Cleanup
    return () => {
      window.api.app.removeOnLoadingCompleteListener()
      window.api.app.removeOnErrorListener()
    }
  }, [])

  return (
    <ThemeProvider defaultTheme="light">
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <RouterProvider router={router} />         
        </>
      )}
       <ToastContainer theme="colored" position="top-right" autoClose={5000} />
    </ThemeProvider>
  )
}

export default App
