import { useState } from 'react'
import ManajemenAnggotaTable from './Table'
import ManajemenAnggotaTitle from './TitleSection'

export default function ManajemenAnggota() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <ManajemenAnggotaTitle onSuccess={handleRefresh} />
      <ManajemenAnggotaTable refreshKey={refreshKey} />
    </div>
  )
}
