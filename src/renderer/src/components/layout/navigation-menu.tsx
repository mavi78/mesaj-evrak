import { Link, useLocation } from 'react-router-dom'
import { cn } from '@renderer/lib/utils'

interface NavigationMenuProps {
  className?: string
  isMobile?: boolean
}

const menuItems = [
  { path: '/', label: 'Ana Sayfa' },
  { path: '/kayit-islemleri', label: 'Kayıt İşlemleri' },
  { path: '/kurye-islemleri', label: 'Kurye İşlemleri' },
  { path: '/posta-islemleri', label: 'Posta İşlemleri' },
  { path: '/raporlar', label: 'Raporlar' },
  { path: '/ayarlar', label: 'Ayarlar' }
]

export const NavigationMenu = ({
  className,
  isMobile = false
}: NavigationMenuProps): JSX.Element => {
  const location = useLocation()

  return (
    <nav className={cn('flex', isMobile ? 'flex-col' : 'items-center space-x-6', className)}>
      {menuItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            isMobile && 'p-4 border-b',
            location.pathname === item.path
              ? 'text-foreground'
              : 'text-foreground/60',
            location.pathname === item.path && !isMobile && 'border-b-2 border-primary'
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
} 