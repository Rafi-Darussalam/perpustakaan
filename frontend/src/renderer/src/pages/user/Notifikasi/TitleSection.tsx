import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface Props {
  loading: boolean
  onRefresh: () => void
}

export default function NotifikasiTitle({ loading, onRefresh }: Props) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">Notifikasi</h1>
        <p className="text-muted-foreground">
          Buku yang kamu pinjam dan sudah melewati batas pengembalian.
        </p>
      </div>
      <div>
        <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  )
}
