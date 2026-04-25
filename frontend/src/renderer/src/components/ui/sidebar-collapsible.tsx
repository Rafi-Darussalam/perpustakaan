import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SidebarMenuButton } from "./sidebar"
import { ChevronDown, LucideIcon } from 'lucide-react'
import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"

interface CollapsibleChild {
  to: string
  label: string
}

interface CollapsibleItem {
  icon: LucideIcon
  label: string
  children: CollapsibleChild[]
}

interface CollapsibleNavProps {
  items: CollapsibleItem[]
}

function CollapsibleNavItem({ icon: Icon, label, children }: CollapsibleItem) {
  const location = useLocation()
  const hasActiveChild = children.some((child) => location.pathname === child.to)
  const [isOpen, setIsOpen] = useState(hasActiveChild)

  return (
    <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <SidebarMenuButton
          data-active={hasActiveChild}
          className="flex justify-between data-[active=true]:text-blue-500"
        >
          <div className="flex gap-[0.6rem] items-center">
            <Icon />
            {label}
          </div>
          <div className={`${isOpen ? "rotate-180" : ""} transition-transform`}>
            <ChevronDown />
          </div>
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-1 flex flex-col gap-1">
          {children.map(({ to, label: childLabel }) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <SidebarMenuButton
                  asChild
                  className={isActive ? "text-blue-500 font-medium bg-transparent hover:bg-sidebar-accent" : ""}
                >
                  <span className="pl-9 w-full block">
                    {childLabel}
                  </span>
                </SidebarMenuButton>
              )}
            </NavLink>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function CollapsibleNav({ items }: CollapsibleNavProps) {
  return (
    <>
      {items.map((item) => (
        <CollapsibleNavItem key={item.label} {...item} />
      ))}
    </>
  )
}