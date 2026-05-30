import { DataTable } from '@renderer/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, XCircle, Trash2, Star } from 'lucide-react'
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
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { MoreHorizontal } from 'lucide-react'
import { getImageUrl } from '@/lib/utils'
import type { Table as TanstackTable } from '@tanstack/react-table'

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
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Menunggu',
    className:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-900/50'
  },
  disetujui: {
    label: 'Disetujui (Dipinjam)',
    className:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-900/50'
  },
  ditolak: {
    label: 'Ditolak',
    className:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-900/50'
  },
  dikembalikan: {
    label: 'Selesai (Dikembalikan)',
    className:
      'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/40 dark:text-gray-400 dark:border-gray-900/50'
  },
  dibatalkan: {
    label: 'Dibatalkan',
    className:
      'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/40 dark:text-gray-400 dark:border-gray-900/50'
  }
}

const DELETABLE_STATUSES = ['dibatalkan', 'dikembalikan', 'ditolak']

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PeminjamanTable() {
  const [allData, setAllData] = useState<Peminjaman[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)

  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<number | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  // Rating state
  const [ratingOpen, setRatingOpen] = useState(false)
  const [ratingTargetId, setRatingTargetId] = useState<number | null>(null)
  const [currentRating, setCurrentRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [submittingRating, setSubmittingRating] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/peminjaman/me')
      setAllData(response.data.data as Peminjaman[])
    } catch (error) {
      console.error('Error fetching peminjaman:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter on frontend
  const data = useMemo(() => {
    let filtered = allData
    if (status) filtered = filtered.filter((item) => item.status === status)
    if (search) {
      const lower = search.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.buku.judul.toLowerCase().includes(lower) ||
          item.token.toLowerCase().includes(lower)
      )
    }
    return filtered
  }, [allData, search, status])

  const paginatedData = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    return data.slice(start, start + pagination.pageSize)
  }, [data, pagination])

  const pageCount = Math.ceil(data.length / pagination.pageSize)

  // Cancel
  const confirmCancel = (id: number) => {
    setCancelTarget(id)
    setCancelOpen(true)
  }
  const handleCancel = async () => {
    if (!cancelTarget) return
    try {
      await api.put(`/peminjaman/${cancelTarget}/cancel`)
      toast.success('Peminjaman berhasil dibatalkan')
      setCancelOpen(false)
      fetchData()
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Gagal membatalkan peminjaman')
      } else {
        toast.error('Gagal membatalkan peminjaman')
      }
    }
  }

  // Delete single
  const confirmDelete = (id: number) => {
    setDeleteTarget(id)
    setDeleteOpen(true)
  }
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/peminjaman/${deleteTarget}`)
      toast.success('Riwayat peminjaman berhasil dihapus')
      setDeleteOpen(false)
      fetchData()
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Gagal menghapus')
      } else {
        toast.error('Gagal menghapus peminjaman')
      }
    }
  }

  // Bulk delete
  const handleBulkDelete = async (table: TanstackTable<Peminjaman>) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const ids = selectedRows.map((r) => r.original.id)
    try {
      await api.delete('/peminjaman/bulk', { data: { ids } })
      toast.success('Riwayat terpilih berhasil dihapus')
      setBulkDeleteOpen(false)
      table.resetRowSelection()
      fetchData()
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Gagal menghapus')
      } else {
        toast.error('Gagal menghapus peminjaman')
      }
    }
  }

  // Rating
  const handleOpenRating = async (bukuId: number) => {
    setRatingTargetId(bukuId)
    setRatingOpen(true)
    setCurrentRating(0)
    setHoverRating(0)
    try {
      const res = await api.get(`/rating/my-rating/${bukuId}`)
      if (res.data?.rating) {
        setCurrentRating(res.data.rating)
      }
    } catch (error) {
      console.error('Gagal memuat rating', error)
    }
  }

  const handleSubmitRating = async () => {
    if (!ratingTargetId || currentRating === 0) return
    setSubmittingRating(true)
    try {
      await api.post('/rating', {
        bukuId: ratingTargetId,
        nilai: currentRating
      })
      toast.success('Rating berhasil disimpan')
      setRatingOpen(false)
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Gagal menyimpan rating')
      } else {
        toast.error('Gagal menyimpan rating')
      }
    } finally {
      setSubmittingRating(false)
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
          const isDeletable = DELETABLE_STATUSES.includes(row.original.status)
          return (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              disabled={!isDeletable}
              aria-label="Select row"
            />
          )
        },
        enableSorting: false,
        enableHiding: false
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
          return <Badge className={`${cfg.className} border`}>{cfg.label}</Badge>
        }
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const item = row.original
          const isPending = item.status === 'pending'
          const isDeletable = DELETABLE_STATUSES.includes(item.status)
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
                  <DropdownMenuItem
                    onClick={() => confirmCancel(item.id)}
                    variant="destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Batalkan Pinjaman
                  </DropdownMenuItem>
                )}
                {isDeletable && (
                  <DropdownMenuItem
                    onClick={() => confirmDelete(item.id)}
                    variant="destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus Riwayat
                  </DropdownMenuItem>
                )}
                {item.status === 'dikembalikan' && (
                  <DropdownMenuItem
                    onClick={() => handleOpenRating(item.buku.id)}
                  >
                    <Star className="mr-2 h-4 w-4 text-amber-500" />
                    Beri Rating
                  </DropdownMenuItem>
                )}
                {!isPending && !isDeletable && item.status !== 'dikembalikan' && (
                  <DropdownMenuItem disabled>Tidak ada aksi tersedia</DropdownMenuItem>
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
  }, [])

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [search, status])

  return (
    <>
      <DataTable
        columns={columns}
        data={paginatedData}
        isLoading={loading}
        searchKey="buku.judul"
        searchPlaceholder="Cari buku atau token..."
        onSearchChange={(value) => {
          if (value !== search) setSearch(value)
        }}
        onFilterChange={(value) => {
          setStatus(value)
        }}
        filterKey="status"
        filterOptions={[
          { label: 'Menunggu', value: 'pending' },
          { label: 'Disetujui', value: 'disetujui' },
          { label: 'Ditolak', value: 'ditolak' },
          { label: 'Dikembalikan', value: 'dikembalikan' },
          { label: 'Dibatalkan', value: 'dibatalkan' }
        ]}
        pageCount={pageCount}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={setPagination}
        renderBulkActions={(table) => {
          const selected = table.getFilteredSelectedRowModel().rows
          const allDeletable = selected.every((r) =>
            DELETABLE_STATUSES.includes(r.original.status)
          )
          if (selected.length === 0 || !allDeletable) return null
          return (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setBulkDeleteOpen(true)
                // Store table reference for use in dialog action
                ;(window as any).__peminjamanTable = table
              }}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Hapus {selected.length} Terpilih
            </Button>
          )
        }}
      />

      {/* Cancel Dialog */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Peminjaman?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membatalkan permintaan peminjaman buku ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Kembali</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} variant="destructive">
              Ya, Batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Single Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Riwayat Peminjaman?</AlertDialogTitle>
            <AlertDialogDescription>
              Riwayat peminjaman ini akan dihapus permanen dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Riwayat Terpilih?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua riwayat peminjaman yang dipilih akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const table = (window as any).__peminjamanTable
                if (table) handleBulkDelete(table)
              }}
              variant="destructive"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rating Dialog */}
      <Dialog open={ratingOpen} onOpenChange={setRatingOpen}>
        <DialogContent className="max-w-sm text-center py-6">
          <DialogHeader className="items-center">
            <DialogTitle>Berikan Rating Buku</DialogTitle>
            <DialogDescription>
              Bagaimana pendapatmu tentang buku ini?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-1 my-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-10 w-10 cursor-pointer transition-colors ${
                  (hoverRating || currentRating) >= star
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-muted-foreground/30 hover:text-amber-400/50'
                }`}
                onClick={() => setCurrentRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              />
            ))}
          </div>
          <DialogFooter className="sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setRatingOpen(false)}
              disabled={submittingRating}
            >
              Nanti Saja
            </Button>
            <Button
              onClick={handleSubmitRating}
              disabled={currentRating === 0 || submittingRating}
            >
              {submittingRating ? 'Menyimpan...' : 'Kirim Rating'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
