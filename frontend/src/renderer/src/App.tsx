import { SidebarApp } from "@/components/app/sidebar"
import { ModeToggle } from "./components/mode-toggle"

export default function App() {
  return (
    <div>
      <SidebarApp>
        <ModeToggle />
      </SidebarApp>
    </div>
  )
}