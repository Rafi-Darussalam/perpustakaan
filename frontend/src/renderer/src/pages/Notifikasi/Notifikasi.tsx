import { useState, useEffect } from 'react'
import axios from 'axios'
import { PEMINJAMAN_API_URL } from '@/constants/constant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Clock, User, Book as BookIcon } from 'lucide-react'
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
      
      if (response.data.data.length > 0) {
        toast.warning(`Ada ${response.data.data.length} peminjaman yang melewati batas pengembalian!`, {
          duration: 5000
        })
      }
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
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Pusat Notifikasi</h1>
        <p className="text-muted-foreground">Informasi mengenai keterlambatan pengembalian buku.</p>
      </div>

      <div className="grid gap-4">
        {overdueList.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Clock className="mb-2 h-8 w-8 opacity-20" />
              <p>Tidak ada notifikasi keterlambatan saat ini.</p>
            </CardContent>
          </Card>
        ) : (
          overdueList.map((item) => (
            <Card key={item.id} className="border-l-4 border-l-destructive overflow-hidden">
              <div className="flex items-center p-4 gap-4">
                <div className="bg-destructive/10 p-3 rounded-full text-destructive">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">Batas Pengembalian Lewat!</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {item.anggota.nama}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookIcon className="h-3 w-3" /> {item.buku.judul}
                        </span>
                      </div>
                    </div>
                    <Badge variant="destructive">
                      Terlambat
                    </Badge>
                  </div>
                  <div className="mt-3 text-sm">
                    Jatuh tempo pada: <span className="font-medium">{format(new Date(item.tanggal_jatuh_tempo), 'dd MMMM yyyy', { locale: id })}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
