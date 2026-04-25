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
  SidebarMenuButton
} from '@/components/ui/sidebar'
import { ModeToggle } from '../mode-toggle'
import { Avatar, AvatarImage, AvatarFallback } from './avatar'

import { NavLink } from 'react-router-dom'

import { Home, Book } from 'lucide-react'

const iconComponents = {
  Home: Home,
  Book: Book
}

const pages = [
  { page: '/', text: 'Home', icon: 'Home' },
  { page: '/manajemen-buku', text: 'Manajemen Buku', icon: 'Book' }
]

import Logo from '@/assets/img/Logo.png'

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="sticky top-0 left-0">
      <SidebarHeader className="relative">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="top-bar hover:bg-transparent">
              <div>
                <Avatar className='after:border-none'>
                  <AvatarImage src={Logo} className='rounded-lg' />
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
                        <SidebarMenuButton asChild data-active={isActive} tooltip={text}
                          className="data-[active=true]:text-chart-2"
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuButton asChild size='lg'>
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
