import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/ui/app-sidebar'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '../ui/tooltip'
import { Button } from '../ui/button'

import { X, Minus, Square, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'

export function SidebarApp({ children }) {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const checkWindowState = async () => {
      const state = await window.appApi.getWindowState()
      setIsMaximized(state.isMaximized)
    }

    checkWindowState()

    window.addEventListener('resize', checkWindowState)
    return () => window.removeEventListener('resize', checkWindowState)
  }, [])

  const close = () => {
    window.appApi.closeApp()
  }

  const maximize = () => {
    window.appApi.maximize()
  }

  const minimize = () => {
    window.appApi.minimize()
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className='flex-1 min-w-0 flex flex-col'>
          <div className='top-bar w-full sticky top-0 left-0 h-9 flex justify-between items-center border-b border-sidebar-border bg-background'>
            <div className='btn-top'>
              <SidebarTrigger/>
            </div>

            <div className='h-full flex justify-center items-center'>
              <Button size='xs' variant='ghost' className='btn-top rounded-none h-full px-5 hover:bg-accent transition-colors' onClick={minimize}>
                <Minus className='scale-125' />
              </Button>
              <Button size='xs' variant='ghost' className='btn-top rounded-none h-full px-5 hover:bg-accent transition-colors' onClick={maximize}>
                {isMaximized ? <Copy className='scale-100' /> : <Square className='scale-100' />}
              </Button>
              <Button size='xs' variant='ghost' className='btn-top rounded-none h-full px-5 hover:bg-[#E81123] dark:hover:bg-[#E81123] hover:text-white transition-colors' onClick={close}>
                <X className='scale-150' />
              </Button>
            </div>
          </div>
          <div className='h-[calc(100vh-2.25rem)] overflow-y-hidden w-full min-w-0'>
            <div className='h-full overflow-y-auto max-w-[1400px] w-full'>
              { children }
            </div>
          </div>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  )
}
