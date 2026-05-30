import { DataTable } from '@renderer/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, CheckCircle, XCircle, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/axios'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { getImageUrl } from '@/lib/utils'

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
    gambar?: string | null
  }
  anggota: {
    id: string
    nama: string
    email: string
  }
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Menunggu',
    className:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-900/50'
  },
  disetujui: {
    label: 'Disetujui',
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
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ManajemenPeminjamanTable({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<Peminjaman[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [pageCount, setPageCount] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)

  const [actionOpen, setActionOpen] = useState(false)
  const [actionTarget, setActionTarget] = useState<{ id: number; newStatus: string } | null>(null)
  
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/peminjaman', {
        params: {
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          search,
          status
        }
      })
      setData(response.data.data)
      setPageCount(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching peminjaman:', error)
    } finally {
      setLoading(false)
    }
  }

  const confirmAction = (id: number, newStatus: string) => {
    setActionTarget({ id, newStatus })
    setActionOpen(true)
  }

  const handleStatusUpdate = async () => {
    if (!actionTarget) return
    try {
      await api.put(`/peminjaman/${actionTarget.id}/status`, { status: actionTarget.newStatus })
      const labels: Record<string, string> = {
        disetujui: 'disetujui',
        ditolak: 'ditolak',
        dikembalikan: 'dikembalikan'
      }
      toast.success(`Peminjaman berhasil ${labels[actionTarget.newStatus] ?? 'diperbarui'}`)
      setActionOpen(false)
      fetchData()
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Gagal memperbarui status')
      } else {
        toast.error('Gagal memperbarui status peminjaman')
      }
    }
  }

  const confirmDelete = (id: number) => {
    setDeleteTarget(id)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await api.delete(`/peminjaman/admin/${deleteTarget}`)
      toast.success('Peminjaman berhasil dihapus')
      setDeleteOpen(false)
      fetchData()
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Gagal menghapus peminjaman')
      } else {
        toast.error('Gagal menghapus peminjaman')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDelete = async (table: import('@tanstack/react-table').Table<Peminjaman>) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const ids = selectedRows.map((row) => row.original.id)
    
    if (ids.length === 0) return
    setIsDeleting(true)
    try {
      const response = await api.post('/peminjaman/admin/bulk-delete', { ids })
      toast.success(response.data.message || 'Peminjaman terpilih berhasil dihapus')
      table.toggleAllPageRowsSelected(false)
      fetchData()
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Gagal menghapus peminjaman')
      } else {
        toast.error('Gagal menghapus peminjaman terpilih')
      }
    } finally {
      setIsDeleting(false)
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
        cell: ({ row }) => {
          const status = row.original.status
          // Only allow selection if status is one of the deletable ones
          const canDelete = ['ditolak', 'dikembalikan', 'dibatalkan'].includes(status)
          return (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              disabled={!canDelete}
            />
          )
        },
        enableSorting: false,
        enableHiding: false,
        size: 40
      },
      {
        id: 'cover',
        header: 'Cover',
        cell: ({ row }) => {
          const gambar = row.original.buku.gambar
          return gambar ? (
            <div className="w-9 h-12 rounded overflow-hidden border bg-muted flex-shrink-0">
              <img src={getImageUrl(gambar) || ''} alt="cover" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-9 h-12 rounded border border-dashed bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
              <span className="text-[9px] text-center leading-tight px-0.5">No img</span>
            </div>
          )
        },
        enableSorting: false,
        size: 52
      },
      {
        accessorKey: 'buku.judul',
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Judul Buku
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-medium line-clamp-1">{row.original.buku.judul}</p>
            <p className="text-xs text-muted-foreground">{row.original.buku.penulis}</p>
          </div>
        )
      },
      {
        accessorKey: 'anggota.nama',
        header: 'Peminjam',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.anggota.nama}</p>
            <p className="text-xs text-muted-foreground">{row.original.anggota.email}</p>
          </div>
        )
      },
      {
        accessorKey: 'token',
        header: 'Kode Token',
        cell: ({ row }) => (
          <span className="font-mono font-bold tracking-widest text-sm">{row.original.token}</span>
        )
      },
      {
        accessorKey: 'tanggalPinjam',
        header: 'Periode',
        cell: ({ row }) => (
          <div className="text-sm">
            <p>{formatDate(row.original.tanggalPinjam)}</p>
            <p className="text-muted-foreground">s.d. {formatDate(row.original.tanggalKembali)}</p>
          </div>
        )
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const s = row.original.status
          const cfg = STATUS_LABELS[s] ?? { label: s, className: '' }
          return (
            <Badge className={`${cfg.className} border`}>{cfg.label}</Badge>
          )
        }
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const item = row.original
          const isPending = item.status === 'pending'
          const isApproved = item.status === 'disetujui'
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
                {isPending && (
                  <>
                    <DropdownMenuItem
                      onClick={() => confirmAction(item.id, 'disetujui')}
                      className="text-green-600 focus:text-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Setujui Pinjaman
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => confirmAction(item.id, 'ditolak')}
                      variant="destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Tolak Pinjaman
                    </DropdownMenuItem>
                  </>
                )}
                {isApproved && (
                  <DropdownMenuItem
                    onClick={() => confirmAction(item.id, 'dikembalikan')}
                    className="text-blue-600 focus:text-blue-700"
                  >
                    <Undo2 className="mr-2 h-4 w-4" />
                    Tandai Dikembalikan
                  </DropdownMenuItem>
                )}
                {['ditolak', 'dikembalikan', 'dibatalkan'].includes(item.status) && (
                  <>
                    {!isPending && !isApproved && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() => confirmDelete(item.id)}
                      className="text-red-600 focus:text-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus Riwayat
                    </DropdownMenuItem>
                  </>
                )}
                {!isPending && !isApproved && !['ditolak', 'dikembalikan', 'dibatalkan'].includes(item.status) && (
                  <DropdownMenuItem disabled>
                    Tidak ada aksi tersedia
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

  const ACTION_LABELS: Record<string, string> = {
    disetujui: 'menyetujui',
    ditolak: 'menolak',
    dikembalikan: 'menandai dikembalikan pada'
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={loading}
        searchKey="buku.judul"
        searchPlaceholder="Cari buku atau token..."
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
        filterKey="status"
        filterOptions={[
          { label: 'Menunggu', value: 'pending' },
          { label: 'Disetujui', value: 'disetujui' },
          { label: 'Ditolak', value: 'ditolak' },
          { label: 'Dikembalikan', value: 'dikembalikan' }
        ]}
        pageCount={pageCount}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={setPagination}
        renderBulkActions={(table) => {
          const selectedCount = table.getFilteredSelectedRowModel().rows.length
          if (selectedCount === 0) return null
          return (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkDelete(table)}
              disabled={isDeleting}
              className="ml-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus {selectedCount} Terpilih
            </Button>
          )
        }}
      />

      <AlertDialog open={actionOpen} onOpenChange={setActionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Tindakan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin{' '}
              <strong>{ACTION_LABELS[actionTarget?.newStatus ?? ''] ?? 'memperbarui'}</strong> peminjaman ini?
              {actionTarget?.newStatus === 'disetujui' && (
                <span className="block mt-1 text-green-600">
                  Status buku akan berubah menjadi <strong>Dipinjam</strong>.
                </span>
              )}
              {(actionTarget?.newStatus === 'ditolak' || actionTarget?.newStatus === 'dikembalikan') && (
                <span className="block mt-1 text-blue-600">
                  Status buku akan dikembalikan menjadi <strong>Tersedia</strong>.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusUpdate}
              variant={actionTarget?.newStatus === 'ditolak' ? 'destructive' : 'default'}
            >
              Ya, Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Riwayat Peminjaman</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data peminjaman ini? Data yang sudah dihapus tidak
              dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              variant="destructive"
              disabled={isDeleting}
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
