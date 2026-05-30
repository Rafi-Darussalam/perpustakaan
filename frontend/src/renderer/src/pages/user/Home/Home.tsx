import { useState, useEffect, lazy, Suspense } from 'react'
import { api } from '@/lib/axios'
import { authClient } from '@/lib/auth-client'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { NavLink } from 'react-router-dom'
import { format, differenceInDays, isPast } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Loader2, Eye, AlertTriangle, ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

const HomeUserChart = lazy(() => import('./Chart'))

type Peminjaman = {
  id: number
  token: string
  status: string
  tanggalPinjam: string
  tanggalKembali: string
  createdAt: string
  buku: {
    id: number
    judul: string
    penulis: string
  }
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Menunggu',
    className:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-900/50'
  },
  disetujui: {
    label: 'Dipinjam',
    className:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-900/50'
  },
  ditolak: {
    label: 'Ditolak',
    className:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-900/50'
  },
  dikembalikan: {
    label: 'Dikembalikan',
    className:
      'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/40 dark:text-gray-400 dark:border-gray-900/50'
  },
  dibatalkan: {
    label: 'Dibatalkan',
    className:
      'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-900/50'
  }
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat Pagi'
  if (hour < 15) return 'Selamat Siang'
  if (hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

export default function UserHome() {
  const { data: session } = authClient.useSession()
  const [borrows, setBorrows] = useState<Peminjaman[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setBorrows([])
      setLoading(false)
      return
    }
    setLoading(true)
    api
      .get('/peminjaman/me')
      .then((res) => setBorrows(res.data.data ?? []))
      .catch(() => setBorrows([]))
      .finally(() => setLoading(false))
  }, [session?.user?.id])

  const activeBorrows = borrows.filter((b) => b.status === 'disetujui')
  const pendingBorrows = borrows.filter((b) => b.status === 'pending')
  const returnedBorrows = borrows.filter((b) => b.status === 'dikembalikan')
  const overdueBorrows = activeBorrows.filter((b) => isPast(new Date(b.tanggalKembali)))
  const recentBorrows = borrows.slice(0, 10)

  const firstName = session?.user?.name?.split(' ')[0] || 'Pengguna'

  const cardInfo = [
    { title: 'Sedang Dipinjam', description: 'Buku aktif dipinjam', value: activeBorrows.length },
    { title: 'Menunggu', description: 'Menunggu persetujuan', value: pendingBorrows.length },
    { title: 'Terlambat', description: 'Melewati batas kembali', value: overdueBorrows.length },
    { title: 'Dikembalikan', description: 'Total buku dikembalikan', value: returnedBorrows.length }
  ]

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          {getGreeting()}, {firstName}!
        </h1>
        <p className="text-muted-foreground text-sm">
          {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: localeId })}
        </p>
      </div>

      {/* Overdue Alert */}
      {!loading && overdueBorrows.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  {overdueBorrows.length} buku melewati batas pengembalian
                </p>
                <p className="text-xs text-muted-foreground">
                  Segera kembalikan untuk menghindari sanksi.
                </p>
              </div>
            </div>
            <NavLink to="/notifikasi">
              <Button variant="destructive" size="sm">
                Lihat <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </NavLink>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="flex gap-4 flex-wrap">
        {cardInfo.map(({ title, description, value }, i) => (
          <Card className="flex-1 min-w-[200px] bg-linear-to-b from-background to-sidebar" key={i}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="font-bold text-muted-foreground">...</p>
              ) : (
                <p className="text-[2.5rem] font-bold">{value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Suspense fallback={<Skeleton className="w-full h-[370px] rounded-lg" />}>
        <HomeUserChart />
      </Suspense>

      {/* Recent Borrows Table */}
      <Card className="pb-0">
        <CardHeader className="flex justify-between items-center">
          <div>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>Riwayat peminjaman kamu yang terakhir</CardDescription>
          </div>
          <NavLink to="/peminjaman">
            <Button>
              <Eye /> Lihat Semua
            </Button>
          </NavLink>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-32 items-center justify-center border-t">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="border-t overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">No</TableHead>
                    <TableHead>Judul Buku</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Tgl Pinjam</TableHead>
                    <TableHead>Tgl Kembali</TableHead>
                    <TableHead className="pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBorrows.length > 0 ? (
                    recentBorrows.map((item, index) => {
                      const cfg = STATUS_LABELS[item.status] ?? { label: item.status, className: '' }
                      const isOverdue =
                        item.status === 'disetujui' && isPast(new Date(item.tanggalKembali))
                      const daysLeft = differenceInDays(
                        new Date(item.tanggalKembali),
                        new Date()
                      )
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-muted-foreground pl-6">{index + 1}</TableCell>
                          <TableCell>
                            <p className="font-medium line-clamp-1">{item.buku.judul}</p>
                            <p className="text-xs text-muted-foreground">{item.buku.penulis}</p>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs font-bold tracking-widest">
                              {item.token}
                            </span>
                          </TableCell>
                          <TableCell>
                            {format(new Date(item.tanggalPinjam), 'dd MMM yyyy', {
                              locale: localeId
                            })}
                          </TableCell>
                          <TableCell>
                            <span
                              className={isOverdue ? 'text-destructive font-semibold text-sm' : 'text-sm'}
                            >
                              {format(new Date(item.tanggalKembali), 'dd MMM yyyy', {
                                locale: localeId
                              })}
                            </span>
                            {isOverdue && (
                              <p className="text-[10px] text-destructive">
                                {Math.abs(daysLeft)} hari terlambat
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="pr-6">
                            <Badge className={`${cfg.className} border`}>{cfg.label}</Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Belum ada riwayat peminjaman.{' '}
                        <NavLink to="/buku" className="underline underline-offset-2">
                          Jelajahi koleksi buku
                        </NavLink>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
