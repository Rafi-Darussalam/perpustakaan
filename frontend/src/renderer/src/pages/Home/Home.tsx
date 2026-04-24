import { ModeToggle } from "@renderer/components/mode-toggle"
import HomeCardSection from "./CardSection"

export default function Home() {
    return (
        <div className="p-3">
            <HomeCardSection />
            <ModeToggle />
        </div>
    )
}