import { useState, useEffect } from 'react'
import { api } from '@/lib/axios'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import NotifikasiTitle from './TitleSection'

type OverdueItem = {
  id: number
  token: string
  tanggalKembali: string
  buku: { judul: string; penulis: string }
}

export default function UserNotifikasi() {
  const [overdueList, setOverdueList] = useState<OverdueItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOverdue = async () => {
    try {
      setLoading(true)
      const response = await api.get('/peminjaman/my-overdue')
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
      <NotifikasiTitle loading={loading} onRefresh={fetchOverdue} />

      {loading ? (
        <div className="flex h-32 items-center justify-center w-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-3 w-full">
          {overdueList.length === 0 ? (
            <Card className="border-dashed bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 opacity-30 text-green-500" />
                <p className="text-sm font-medium">Tidak ada keterlambatan.</p>
                <p className="text-xs text-center opacity-70">
                  Semua peminjaman kamu masih dalam batas waktu. Bagus!
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-2 px-1">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {overdueList.length} buku terlambat dikembalikan
                </p>
              </div>
              {overdueList.map((item) => {
                const daysLate = differenceInDays(new Date(), new Date(item.tanggalKembali))
                return (
                  <Card
                    key={item.id}
                    className="overflow-hidden border-destructive/30 bg-destructive/5"
                  >
                    <div className="flex items-center px-4 py-4 gap-4">
                      <div className="p-2.5 rounded-full bg-destructive/10 shrink-0">
                        <Clock className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="flex flex-1 flex-col gap-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm line-clamp-1">{item.buku.judul}</p>
                            <p className="text-xs text-muted-foreground">{item.buku.penulis}</p>
                          </div>
                          <Badge variant="destructive" className="text-[10px] h-5 px-2 shrink-0">
                            Terlambat {daysLate} hari
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-muted-foreground">
                            Jatuh tempo:{' '}
                            <span className="text-destructive font-medium">
                              {format(new Date(item.tanggalKembali), 'dd MMMM yyyy', {
                                locale: id
                              })}
                            </span>
                          </p>
                          <span className="text-muted-foreground/40 text-xs">•</span>
                          <p className="text-xs text-muted-foreground font-mono">{item.token}</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 pb-3">
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                        💡 Segera kembalikan buku ke petugas perpustakaan dan tunjukkan kode token{' '}
                        <span className="font-mono font-bold">{item.token}</span> untuk diproses.
                      </p>
                    </div>
                  </Card>
                )
              })}

              <div className="mt-2">
                <Link to="/peminjaman">
                  <Button variant="outline" size="sm" className="w-full">
                    Lihat semua riwayat peminjaman →
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
