import { useState } from 'react'
import ManajemenPinjamanTable from './Table'
import ManajemenPinjamanTitle from './TitleSection'

export default function ManajemenPinjaman() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <ManajemenPinjamanTitle onSuccess={handleRefresh} />
      <ManajemenPinjamanTable refreshKey={refreshKey} />
    </div>
  )
}
