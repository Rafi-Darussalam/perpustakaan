import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton } from "./sidebar"
import { LucideIcon } from 'lucide-react'
import { NavLink, useLocation } from "react-router-dom"

interface CollapsibleChild {
  to: string
  label: string
}

interface DropdownItem {
  icon: LucideIcon
  label: string
  children: CollapsibleChild[]
}

interface DropdownNavProps {
  items: DropdownItem[]
}

function DropdownNavItem({ icon: Icon, label, children }: DropdownItem) {
  const location = useLocation()
  const hasActiveChild = children.some((child) => location.pathname === child.to)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          data-active={hasActiveChild}
          tooltip={label}
          className="data-[active=true]:text-blue-500"
        >
          <Icon />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {children.map(({ to, label: childLabel }) => (
          <NavLink key={to} to={to}>
            {({ isActive }) => (
              <DropdownMenuItem
                className={isActive ? "text-blue-500 font-medium" : ""}
              >
                {childLabel}
              </DropdownMenuItem>
            )}
          </NavLink>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DropdownNav({ items }: DropdownNavProps) {
  return (
    <>
      {items.map((item) => (
        <DropdownNavItem key={item.label} {...item} />
      ))}
    </>
  )
}
