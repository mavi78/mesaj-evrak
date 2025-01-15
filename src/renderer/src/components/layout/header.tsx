import { Button } from '@renderer/components/ui/button'
import { useTheme } from '@renderer/components/theme-provider'
import { Moon, Sun, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@renderer/components/ui/sheet'
import { NavigationMenu } from '@renderer/components/layout/navigation-menu'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export const Header = (): JSX.Element => {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md px-1">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center space-x-2 md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] p-0">
              <NavigationMenu className="flex flex-col" isMobile />
            </SheetContent>
          </Sheet>
        </div>

        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <img 
              src={theme === 'light' ? './logo-light.svg' : './logo-dark.svg'} 
              alt="Mesaj Evrak Kayıt Logo" 
              className="h-10 w-10 object-center object-cover" 
            />
          </Link>
          <NavigationMenu />
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  )
} 