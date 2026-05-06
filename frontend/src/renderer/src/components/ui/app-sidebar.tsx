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

import { Home, Book, FileText, Bell } from 'lucide-react'

import { CollapsibleNav } from './sidebar-collapsible'
import { DropdownNav } from './sidebar-dropdown'

const iconComponents = {
  Home: Home,
  Book: Book,
  Bell: Bell
}

const pages = [
  { page: '/', text: 'Home', icon: 'Home' },
  { page: '/notifikasi', text: 'Notifikasi', icon: 'Bell' }
]

const collapsibleItems = [
  {
    icon: FileText,
    label: 'Manajemen',
    children: [
      { to: '/manajemen-buku', label: 'Buku Perpustakaan' },
      { to: '/manajemen-anggota', label: 'Anggota Perpustakaan' },
      { to: '/manajemen-pinjaman', label: 'Pinjaman Buku' },
      { to: '/manajemen-pengembalian', label: 'Pengembalian Buku' }
    ]
  }
]

import Logo from '@/assets/img/Logo.png'

export function AppSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

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
              {pages.map(({ page, text, icon }, i) => {
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

              <SidebarMenuItem>
                {isCollapsed ? (
                  <DropdownNav items={collapsibleItems} />
                ) : (
                  <CollapsibleNav items={collapsibleItems} />
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuButton asChild size="lg">
            <div>
              <ModeToggle />
              <span>Tema</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
