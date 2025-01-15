import { useState, useEffect } from 'react'

const Loading = (): JSX.Element => {
  const [message, setMessage] = useState('Sistem başlatılıyor...')
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState({
    database: 'BAŞLATILIYOR...',
    migration: 'BAŞLATILIYOR...',
    services: 'BAŞLATILIYOR...',
    ipc: 'BAŞLATILIYOR...'
  })

  useEffect(() => {
    let lastStatus = ''

    window.api.app.onLoadingMessage((msg) => {
      setMessage(msg)

      if (lastStatus) {
        setStatus((prev) => ({ ...prev, [lastStatus]: 'AKTİF' }))
      }

      if (msg.includes('Veritabanı')) {
        lastStatus = 'database'
        setStatus((prev) => ({ ...prev, database: 'KONTROL EDİLİYOR...' }))
      } else if (msg.includes('Migration')) {
        lastStatus = 'migration'
        setStatus((prev) => ({ ...prev, migration: 'YÜKLEME YAPILIYOR...' }))
      } else if (msg.includes('Servisler')) {
        lastStatus = 'services'
        setStatus((prev) => ({ ...prev, services: 'BAŞLATILIYOR...' }))
      } else if (msg.includes('IPC handler')) {
        lastStatus = 'ipc'
        setStatus((prev) => ({ ...prev, ipc: 'AYARLANIYOR...' }))
      } else if (msg.includes('Uygulama açılıyor')) {
        setStatus((prev) => ({
          database: 'AKTİF',
          migration: 'AKTİF',
          services: 'AKTİF',
          ipc: 'AKTİF'
        }))
        setProgress(100)
      }

      setProgress((prev) => Math.min(prev + 20, 100))
      setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 8))
    })

    // Cleanup function
    return () => {
      window.api.app.removeOnLoadingMessageListener()
    }
  }, [])

  return <div>Loading..</div>
}

export default Loading
