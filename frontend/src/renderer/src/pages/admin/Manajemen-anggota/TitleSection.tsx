import { Button } from '@/components/ui/button'
import { Trash2, ArrowLeft } from 'lucide-react'

type ManajemenAnggotaTitleProps = {
  isDeletedView: boolean
  setIsDeletedView: (val: boolean) => void
}

export default function ManajemenAnggotaTitle({ isDeletedView, setIsDeletedView }: ManajemenAnggotaTitleProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">
          {isDeletedView ? 'Anggota Dihapus' : 'Manajemen Anggota'}
        </h1>
        <p className="text-muted-foreground">
          {isDeletedView 
            ? 'Kelola dan pulihkan anggota yang telah dihapus.' 
            : 'Kelola semua anggota perpustakaan.'}
        </p>
      </div>
      <div>
        {isDeletedView ? (
          <Button variant="outline" onClick={() => setIsDeletedView(false)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        ) : (
          <Button variant="destructive" onClick={() => setIsDeletedView(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Anggota Dihapus
          </Button>
        )}
      </div>
    </div>
  )
}

