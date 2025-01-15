import { useEffect, useState } from 'react'
import Loading from '@renderer/components/loading'

const AnaSayfa = (): JSX.Element => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    window.api.app.onLoadingComplete(() => {
      setIsLoading(false)
    })

    return () => {
      window.api.app.removeOnLoadingCompleteListener()
    }
  }, [])

  if (isLoading) {
    return <Loading />
  }

  return <div className="flex h-screen">AnaSayfa</div>
}

export default AnaSayfa
