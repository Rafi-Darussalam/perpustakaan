import ManajemenAnggotaTable from './Table'
import ManajemenAnggotaTitle from './TitleSection'

export default function ManajemenAnggota() {
  return (
    <div className="flex flex-col gap-4 p-3">
      <ManajemenAnggotaTitle />
      <ManajemenAnggotaTable />
    </div>
  )
}
