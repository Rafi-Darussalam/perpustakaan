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
import { ModeToggle } from '../mode-toggle'
import { Avatar, AvatarImage, AvatarFallback } from './avatar'

import { NavLink } from 'react-router-dom'
import { LayoutGrid, Book, FileText, Bell, LogOut, LogIn, Home } from 'lucide-react'
import { CollapsibleNav } from './sidebar-collapsible'
import { DropdownNav } from './sidebar-dropdown'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

const iconComponents = {
  Dashboard: LayoutGrid,
  Book: Book,
  Bell: Bell,
  Home: Home
}

import Logo from '@/assets/img/Logo.png'

export function AppSidebar({ onLoginOpen }: { onLoginOpen: () => void }) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const { data: session } = authClient.useSession()
  const role = session?.user?.role || 'guest'
  const isAdmin = role === 'admin'
  const isGuest = !session

  const userPages = [{ page: '/', text: 'Home', icon: 'Home' }]

  const adminPages = [
    { page: '/', text: 'Dashboard', icon: 'Dashboard' },
    { page: '/notifikasi', text: 'Notifikasi', icon: 'Bell' }
  ]

  const pagesToRender = isAdmin ? adminPages : userPages

  const collapsibleItems = isAdmin
    ? [
        {
          icon: FileText,
          label: 'Manajemen',
          children: [
            { to: '/manajemen-buku', label: 'Buku Perpustakaan' },
            { to: '/manajemen-anggota', label: 'Anggota Perpustakaan' },
            { to: '/manajemen-pinjaman', label: 'Pinjaman Buku' }
          ]
        }
      ]
    : []

  const handleLogout = async () => {
    try {
      await authClient.signOut()
      localStorage.removeItem('auth_token')
      toast.success('Berhasil keluar')
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      toast.error('Gagal keluar')
    }
  }

  return (
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
            <SidebarMenuButton asChild size="lg">
              <div>
                <ModeToggle />
                <span>Tema</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            {isGuest ? (
              <SidebarMenuButton
                onClick={onLoginOpen}
                className="text-chart-2 hover:text-chart-2/80 hover:bg-chart-2/10 cursor-pointer"
                tooltip="Masuk"
              >
                <LogIn className="h-4 w-4" />
                <span>Masuk</span>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                onClick={handleLogout}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                tooltip="Keluar"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
