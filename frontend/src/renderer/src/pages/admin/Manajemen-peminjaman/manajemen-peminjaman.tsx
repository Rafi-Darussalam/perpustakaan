import { useState } from 'react'
import ManajemenPeminjamanTable from './Table'
import ManajemenPeminjamanTitle from './TitleSection'

export default function ManajemenPeminjaman() {
  const [refreshKey] = useState(0)

  return (
    <div className="p-3 flex flex-col gap-4">
      <ManajemenPeminjamanTitle />
      <ManajemenPeminjamanTable refreshKey={refreshKey} />
    </div>
  )
}
