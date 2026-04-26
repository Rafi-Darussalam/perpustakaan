import ManajemenBukuTable from './Table'
import ManajemenBukuTitle from './TitleSection'

export default function ManajemenBuku() {
  return (
    <div className="flex flex-col gap-4 p-3">
      <ManajemenBukuTitle />
      <ManajemenBukuTable />
    </div>
  )
}
