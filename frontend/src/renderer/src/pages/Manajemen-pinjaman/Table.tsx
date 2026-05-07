import { DataTable } from '@renderer/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { PEMINJAMAN_API_URL } from '@/constants/constant'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Trash2 } from 'lucide-react'

type Peminjaman = {
  id: number
  anggotaId: number
  bukuId: number
  tanggal_pinjam: string
  tanggal_jatuh_tempo: string
  tanggal_kembali: string | null
  status: 'Dipinjam' | 'Dikembalikan'
  anggota: {
    nama: string
  }
  buku: {
    judul: string
  }
}

export default function ManajemenPinjamanTable({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<Peminjaman[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const [pageCount, setPageCount] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [returnId, setReturnId] = useState<number | null>(null)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [returnCondition, setReturnCondition] = useState<'utuh' | 'rusak'>('utuh')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [idsToDelete, setIdsToDelete] = useState<number[]>([])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(PEMINJAMAN_API_URL, {
        params: {
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          search: search,
          status: status
        }
      })
      setData(response.data.data)
      setPageCount(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal mengambil data peminjaman')
    } finally {
      setLoading(false)
    }
  }

  const handleKembalikan = async (id: number, kondisi: 'utuh' | 'rusak') => {
    try {
      await axios.put(`${PEMINJAMAN_API_URL}/kembalikan/${id}`, { kondisi })
      toast.success(`Buku berhasil dikembalikan (${kondisi})`)
      setIsReturnDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Kembalikan error:', error)
      toast.error('Gagal mengembalikan buku')
    }
  }

  const handleHapus = async () => {
    try {
      await axios.post(`${PEMINJAMAN_API_URL}/bulk-delete`, { ids: idsToDelete })
      toast.success('Data berhasil dihapus')
      setIsDeleteDialogOpen(false)
      setIdsToDelete([])
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus data')
    }
  }

  const columns: ColumnDef<Peminjaman>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            disabled={row.original.status.toLowerCase() === 'dipinjam'}
          />
        ),
        enableSorting: false,
        enableHiding: false
      },
      {
        id: 'peminjam',
        accessorKey: 'anggota.nama',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Peminjam
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      {
        id: 'buku',
        accessorKey: 'buku.judul',
        header: 'Buku'
      },
      {
        accessorKey: 'tanggal_pinjam',
        header: 'Tgl Pinjam',
        cell: ({ row }) =>
          format(new Date(row.getValue('tanggal_pinjam')), 'dd MMMM yyyy', { locale: id })
      },
      {
        accessorKey: 'tanggal_jatuh_tempo',
        header: 'Jatuh Tempo',
        cell: ({ row }) => {
          const date = new Date(row.getValue('tanggal_jatuh_tempo'))
          const isOverdue = new Date() > date && row.original.status === 'Dipinjam'
          return (
            <span className={isOverdue ? 'text-destructive font-bold' : ''}>
              {format(date, 'dd MMMM yyyy', { locale: id })}
            </span>
          )
        }
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = (row.getValue('status') as string) || ''
          const variants: Record<string, string> = {
            dipinjam: 'bg-yellow-500 hover:bg-yellow-600 text-white',
            dikembalikan: 'bg-green-500 hover:bg-green-600 text-white',
            rusak: 'bg-red-500 hover:bg-red-600 text-white'
          }
          const variantClass = variants[status.toLowerCase()] || 'bg-blue-500 text-white'
          return <Badge className={variantClass}>{status}</Badge>
        }
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const pinjam = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {pinjam.status === 'Dipinjam' && (
                  <DropdownMenuItem
                    onClick={() => {
                      setReturnId(pinjam.id)
                      setIsReturnDialogOpen(true)
                    }}
                  >
                    Kembalikan Buku
                  </DropdownMenuItem>
                )}
                {(pinjam.status.toLowerCase() === 'dikembalikan' ||
                  pinjam.status.toLowerCase() === 'rusak') && (
                  <DropdownMenuItem
                    onClick={() => {
                      setIdsToDelete([pinjam.id])
                      setIsDeleteDialogOpen(true)
                    }}
                    variant="destructive"
                  >
                    Hapus Data
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      }
    ],
    []
  )

  useEffect(() => {
    fetchData()
  }, [pagination, search, status, refreshKey])

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={loading}
        searchKey="peminjam"
        searchPlaceholder="Cari peminjam..."
        onSearchChange={(value) => {
          if (value !== search) {
            setSearch(value)
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
          }
        }}
        onFilterChange={(value) => {
          setStatus(value)
          setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        }}
        pageCount={pageCount}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={setPagination}
        initialSorting={[{ id: 'peminjam', desc: false }]}
        filterKey="status"
        filterOptions={[
          { label: 'Dipinjam', value: 'Dipinjam' },
          { label: 'Dikembalikan', value: 'Dikembalikan' },
          { label: 'Rusak', value: 'Rusak' }
        ]}
        renderBulkActions={(table) => (
          <Button
            variant="destructive"
            onClick={() => {
              const ids = table.getSelectedRowModel().rows.map((row: any) => row.original.id)
              setIdsToDelete(ids)
              setIsDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus ({table.getSelectedRowModel().rows.length})
          </Button>
        )}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data peminjaman yang dipilih
              secara permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleHapus} variant="destructive">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pengembalian</AlertDialogTitle>
            <AlertDialogDescription>
              Silakan pilih kondisi buku saat dikembalikan untuk memperbarui status inventaris.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="kondisi">Kondisi buku</Label>
              <Select
                value={returnCondition}
                onValueChange={(value: any) => setReturnCondition(value)}
              >
                <SelectTrigger id="kondisi" className="w-full">
                  <SelectValue placeholder="Pilih kondisi" />
                </SelectTrigger>
                <SelectContent className="w-[--radix-select-trigger-width]">
                  <SelectItem value="utuh">Utuh</SelectItem>
                  <SelectItem value="rusak">Rusak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => returnId && handleKembalikan(returnId, returnCondition)}
            >
              Konfirmasi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
