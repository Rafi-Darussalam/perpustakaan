import { useEffect, useState } from 'react'
import axios from 'axios'
import { PEMINJAMAN_API_URL } from '@/constants/constant'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Loader2, Eye } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'

type Peminjaman = {
  id: number
  anggota: { nama: string }
  buku: { judul: string }
  tanggal_pinjam: string
  status: string
}

export default function RecentTable() {
  const [data, setData] = useState<Peminjaman[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await axios.get(PEMINJAMAN_API_URL, {
          params: {
            limit: 10,
            page: 1
          }
        })
        setData(response.data.data)
      } catch (error) {
        console.error('Error fetching recent data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <Card>
      <CardHeader className='flex justify-between items-center'>
        <div>
          <CardTitle>Aktivitas Terbaru</CardTitle>
          <CardDescription>Transaksi peminjaman terakhir</CardDescription>
        </div>
        <NavLink to="/manajemen-pinjaman">
          <Button> <Eye /> Lihat Semua</Button>
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
                  <TableHead>Peminjam</TableHead>
                  <TableHead>Buku</TableHead>
                  <TableHead>Tgl Pinjam</TableHead>
                  <TableHead className="text-left pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length > 0 ? (
                  data.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground pl-6">{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.anggota.nama}</TableCell>
                      <TableCell>{item.buku.judul}</TableCell>
                      <TableCell>
                        {format(new Date(item.tanggal_pinjam), 'dd MMM yyyy', { locale: id })}
                      </TableCell>
                      <TableCell className="text-left pr-6">
                        <Badge
                          variant="secondary"
                          className={
                            item.status.toLowerCase() === 'dipinjam'
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:hover:bg-yellow-900/60 border-yellow-200 dark:border-yellow-900/50'
                              : item.status.toLowerCase() === 'dikembalikan'
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400 dark:hover:bg-green-900/60 border-green-200 dark:border-green-900/50'
                                : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60 border-red-200 dark:border-red-900/50'
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Belum ada data.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
