import { useState } from 'react'
import ManajemenAnggotaTable from './Table'
import DeletedTable from './DeletedTable'
import ManajemenAnggotaTitle from './TitleSection'

export default function ManajemenAnggota() {
  const [isDeletedView, setIsDeletedView] = useState(false)

  return (
    <div className="flex flex-col gap-4 p-3">
      <ManajemenAnggotaTitle isDeletedView={isDeletedView} setIsDeletedView={setIsDeletedView} />
      
      {isDeletedView ? (
        <DeletedTable />
      ) : (
        <ManajemenAnggotaTable />
      )}
    </div>
  )
}

