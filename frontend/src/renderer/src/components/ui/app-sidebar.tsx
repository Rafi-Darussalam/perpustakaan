import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from '@/components/ui/sidebar'

import { Avatar, AvatarImage, AvatarFallback } from './avatar'

import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  Book,
  FileText,
  Bell,
  LogOut,
  LogIn,
  Home,
  MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { CollapsibleNav } from './sidebar-collapsible'
import { DropdownNav } from './sidebar-dropdown'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { SettingsSheet } from '@/components/ui/settings-sheet'

const iconComponents: Record<string, any> = {
  Dashboard: LayoutGrid,
  Book: Book,
  Bell: Bell,
  Home: Home,
  FileText: FileText
}

import Logo from '@/assets/img/Logo.png'

export function AppSidebar({ onLoginOpen }: { onLoginOpen: () => void }) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const navigate = useNavigate()

  const { data: session } = authClient.useSession()
  const role = session?.user?.role || 'guest'
  const isAdmin = role === 'admin'
  const isGuest = !session

  const [logoutOpen, setLogoutOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const guestPages = [
    { page: '/', text: 'Home', icon: 'Home' },
    { page: '/buku', text: 'Buku', icon: 'Book' }
  ]

  const userPages = [
    { page: '/', text: 'Home', icon: 'Home' },
    { page: '/buku', text: 'Buku', icon: 'Book' },
    { page: '/peminjaman', text: 'Peminjaman', icon: 'FileText' },
    { page: '/notifikasi', text: 'Notifikasi', icon: 'Bell' }
  ]

  const adminPages = [
    { page: '/', text: 'Dashboard', icon: 'Dashboard' },
    { page: '/notifikasi', text: 'Notifikasi', icon: 'Bell' }
  ]

  const pagesToRender = isAdmin ? adminPages : isGuest ? guestPages : userPages

  const collapsibleItems = isAdmin
    ? [
        {
          icon: FileText,
          label: 'Manajemen',
          children: [
            { to: '/manajemen-buku', label: 'Buku Perpustakaan' },
            { to: '/manajemen-anggota', label: 'Anggota Perpustakaan' },
            { to: '/manajemen-peminjaman', label: 'Pinjaman Buku' }
          ]
        }
      ]
    : []

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await authClient.signOut()
      localStorage.removeItem('auth_token')
      setLogoutOpen(false)
      localStorage.setItem('logout_success', '1')
      navigate('/', { replace: true })
      setIsLoggingOut(false)
    } catch (error) {
      toast.error('Gagal keluar')
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      {isLoggingOut && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
        </div>
      )}
      <Sidebar collapsible="icon" className="sticky top-0 left-0">
        <SidebarHeader className="relative">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" className="top-bar hover:bg-transparent">
                <div>
                  <Avatar className="after:border-none">
                    <AvatarImage src={Logo} className="rounded-lg" />
                    <AvatarFallback>Lm</AvatarFallback>
                  </Avatar>
                  <span>Library Management</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {pagesToRender.map(({ page, text, icon }, i) => {
                  const IconComponent = iconComponents[icon]

                  return (
                    <SidebarMenuItem key={i}>
                      <NavLink to={page}>
                        {({ isActive }) => (
                          <SidebarMenuButton
                            asChild
                            data-active={isActive}
                            tooltip={text}
                            className="data-[active=true]:text-chart-2 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {IconComponent && <IconComponent />}
                              <span>{text}</span>
                            </div>
                          </SidebarMenuButton>
                        )}
                      </NavLink>
                    </SidebarMenuItem>
                  )
                })}

                {collapsibleItems.length > 0 && (
                  <SidebarMenuItem>
                    {isCollapsed ? (
                      <DropdownNav items={collapsibleItems} />
                    ) : (
                      <CollapsibleNav items={collapsibleItems} />
                    )}
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="gap-2">
          <SidebarMenu>

            <SidebarMenuItem>
              <SettingsSheet isGuest={isGuest} />
            </SidebarMenuItem>

            {isGuest ? (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onLoginOpen}
                  className="text-chart-2 hover:text-chart-2/80 hover:bg-chart-2/10 cursor-pointer"
                  tooltip="Masuk"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Masuk</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : (
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size="lg">
                      <div className="flex items-center justify-between w-full min-w-0 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="after:border-none shrink-0">
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">
                              {session?.user?.name || session?.user?.email || 'Pengguna'}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {session?.user?.email}
                            </span>
                          </div>
                        </div>
                        <MoreVertical className="h-4 w-4 shrink-0" />
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="start">
                    <div className="px-3 py-2 flex items-center gap-2">
                      <Avatar>
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {session?.user?.name || session?.user?.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {session?.user?.email}
                        </span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setLogoutOpen(true)}
                    >
                      <div className="flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        <span>Keluar</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari akun?</AlertDialogTitle>
            <AlertDialogDescription>
              Kamu akan keluar dari sesi ini. Kamu bisa masuk kembali kapan saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} variant="destructive">
              Ya, Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
