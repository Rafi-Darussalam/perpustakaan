import { useState, useEffect } from 'react'
import axios from 'axios'
import { PEMINJAMAN_API_URL } from '@/constants/constant'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'

export default function Notifikasi() {
  const [overdueList, setOverdueList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOverdue = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${PEMINJAMAN_API_URL}/overdue`)
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
      <div>
        <h1 className="text-2xl font-bold">Pusat Notifikasi</h1>
        <p className="text-muted-foreground text-sm">Informasi mengenai keterlambatan pengembalian buku.</p>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center w-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-2 w-full">
          {overdueList.length === 0 ? (
            <Card className="border-dashed bg-muted/20">
              <CardContent className="flex items-center justify-center h-20 text-muted-foreground gap-2">
                <Clock className="h-5 w-5 opacity-20" />
                <p className="text-sm">Tidak ada notifikasi keterlambatan saat ini.</p>
              </CardContent>
            </Card>
          ) : (
            overdueList.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="flex items-center px-4 py-2 gap-4">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  <div className="flex flex-1 items-center justify-between gap-4 min-w-0">
                    <h3 className="font-medium text-sm truncate">
                      {item.anggota.nama} <span className="text-muted-foreground mx-1">•</span> <span className="text-muted-foreground font-normal">{item.buku.judul}</span>
                    </h3>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-[11px] text-muted-foreground">
                        Tempo: {format(new Date(item.tanggal_jatuh_tempo), 'dd MMM yyyy', { locale: id })}
                      </p>
                      <Badge variant="destructive" className="text-[9px] h-4 px-1 uppercase font-bold">
                        Terlambat
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
