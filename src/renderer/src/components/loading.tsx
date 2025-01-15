import { useState, useEffect } from 'react'
import { Card } from '@renderer/components/ui/card'
import { Progress } from '@renderer/components/ui/progress'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Badge } from '@renderer/components/ui/badge'
import { Loader2 } from 'lucide-react'

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
        setStatus((_prev) => ({
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

    return () => {
      window.api.app.removeOnLoadingMessageListener()
    }
  }, [])

  const getBadgeVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'AKTİF':
        return 'default'
      case 'BAŞLATILIYOR...':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-6 space-y-6">
        <div className="space-y-2 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <h2 className="text-2xl font-bold tracking-tight">{message}</h2>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {Object.entries(status).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium capitalize">
                {key === 'ipc' ? 'IPC Handler' : key}
              </span>
              <Badge 
                variant={getBadgeVariant(value)}
                className={value === 'AKTİF' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
              >
                {value}
              </Badge>
            </div>
          ))}
        </div>

        <Card className="bg-muted">
          <ScrollArea className="h-[200px] p-4 rounded-lg">
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="text-sm font-mono text-muted-foreground border-l-2 border-primary pl-2"
                >
                  {log}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </Card>
    </div>
  )
}

export default Loading
