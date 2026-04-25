import { useEffect, lazy, useState } from 'react'
import HomeCardSection from './CardSection'
import { Suspense } from 'react'
import ChartLoading from './ChartLoading'

const HomeChart = lazy(() => import('./Chart'))

export default function Home() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex flex-col gap-4 p-3">
      <HomeCardSection />
      {isMounted ? (
        <Suspense fallback={<ChartLoading />}>
          <HomeChart />
        </Suspense>
      ) : (
        <ChartLoading />
      )}
    </div>
  )
}
