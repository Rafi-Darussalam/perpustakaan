import { useState, useEffect } from 'react'
import { api } from '@/lib/axios'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import AdminNotifikasiTitle from './TitleSection'

type OverdueItem = {
  id: number
  buku: { judul: string }
  anggota: { nama: string }
}

export default function Notifikasi() {
  const [overdueList, setOverdueList] = useState<OverdueItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOverdue = async () => {
    try {
      setLoading(true)
      const response = await api.get('/peminjaman/overdue')
      setOverdueList(response.data.data)
    } catch (error) {
      console.error(error)
      toast.error('Gagal mengambil data notifikasi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOverdue()
  }, [])

  return (
    <div className="flex flex-col gap-6 p-3">
      <AdminNotifikasiTitle loading={loading} onRefresh={fetchOverdue} />

      {loading ? (
        <div className="flex h-32 items-center justify-center w-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-2 w-full">
          {overdueList.length === 0 ? (
            <Card className="border-dashed bg-muted/20">
              <CardContent className="flex items-center justify-center h-24 text-muted-foreground gap-2">
                <Clock className="h-5 w-5 opacity-30" />
                <p className="text-sm">Tidak ada notifikasi keterlambatan saat ini.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground px-1">
                <span className="font-semibold text-destructive">{overdueList.length}</span>{' '}
                peminjaman terlambat ditemukan
              </p>
              {overdueList.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden border-destructive/30 bg-destructive/5"
                >
                  <div className="flex items-center px-4 py-3 gap-4">
                    <div className="p-2 rounded-full bg-destructive/10 shrink-0">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-4 min-w-0">
                      <div>
                        <h3 className="font-semibold text-sm truncate">{item.buku.judul}</h3>
                        <p className="text-xs text-muted-foreground">
                          Peminjam: {item.anggota.nama}
                        </p>
                      </div>
                      <Badge
                        variant="destructive"
                        className="text-[10px] h-5 px-2 uppercase font-bold shrink-0"
                      >
                        Terlambat
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
