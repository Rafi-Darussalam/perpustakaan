import PeminjamanTable from './Table'
import PeminjamanTitle from './TitleSection'

export default function PeminjamanPage() {
  return (
    <div className="p-3 flex flex-col gap-4">
      <PeminjamanTitle />

      <PeminjamanTable />
    </div>
  )
}
