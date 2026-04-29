import { useState } from 'react'
import ManajemenBukuTable from './Table'
import ManajemenBukuTitle from './TitleSection'

export default function ManajemenBuku() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <ManajemenBukuTitle onSuccess={handleRefresh} />
      <ManajemenBukuTable refreshKey={refreshKey} />
    </div>
  )
}
