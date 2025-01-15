import { Header } from './layout/header'
import { ScrollArea } from './ui/scroll-area'

interface ILayoutPageProps {
  children: React.ReactNode
}

const LayoutPage = ({ children }: ILayoutPageProps): JSX.Element => {
  return (
    <ScrollArea className="h-screen">
      <div className="relative min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-6">{children}</main>
      </div>
    </ScrollArea>
  )
}

export default LayoutPage
