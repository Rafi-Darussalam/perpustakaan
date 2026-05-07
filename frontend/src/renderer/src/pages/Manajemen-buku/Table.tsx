import { DataTable } from '@renderer/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
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
import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { BUKU_API_URL } from '@/constants/constant'
import { toast } from 'sonner'
import UpdateBook from './FormUpdateBook'

type Buku = {
  id: number
  judul: string
  penulis: string
  kategori: string
  status: 'tersedia' | 'rusak' | 'dipinjam'
  createdAt: string
}

export default function ManajemenBukuTable({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<Buku[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const [pageCount, setPageCount] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)

  const [editOpen, setEditOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Buku | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [tableInstance, setTableInstance] = useState<any>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(BUKU_API_URL, {
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
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await axios.delete(`${BUKU_API_URL}/${deleteId}`)
      toast.success('Buku berhasil dihapus')
      fetchData()
      setDeleteOpen(false)
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.response?.data?.message || 'Gagal menghapus buku')
    }
  }

  const handleBulkDelete = async () => {
    if (!tableInstance) return

    const selectedRows = tableInstance.getFilteredSelectedRowModel().rows
    const ids = selectedRows.map((row: any) => row.original.id)

    if (ids.length === 0) return

    try {
      await axios.post(`${BUKU_API_URL}/delete-bulk`, { ids })
      toast.success(`${ids.length} buku berhasil dihapus`)
      tableInstance.resetRowSelection()
      fetchData()
      setBulkDeleteOpen(false)
    } catch (error: any) {
      console.error('Bulk delete error:', error)
      toast.error(error.response?.data?.message || 'Gagal menghapus buku terpilih')
    }
  }

  const confirmBulkDelete = (table: any) => {
    setTableInstance(table)
    setBulkDeleteOpen(true)
  }

  const confirmDelete = (id: number) => {
    setDeleteId(id)
    setDeleteOpen(true)
  }

  const handleEdit = (book: Buku) => {
    setSelectedBook(book)
    setEditOpen(true)
  }

  const columns: ColumnDef<Buku>[] = useMemo(
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
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40
      },
      {
        accessorKey: 'judul',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Judul
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        }
      },
      {
        accessorKey: 'penulis',
        header: 'Penulis'
      },
      {
        accessorKey: 'kategori',
        header: 'Kategori'
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = (row.getValue('status') as string) || 'Tersedia'
          const variants: Record<string, string> = {
            tersedia: 'bg-green-500 hover:bg-green-600 text-white',
            rusak: 'bg-red-500 hover:bg-red-600 text-white',
            dipinjam: 'bg-yellow-500 hover:bg-yellow-600 text-white'
          }
          const variantClass = variants[status.toLowerCase()] || 'bg-blue-500 text-white'
          return <Badge className={variantClass}>{status}</Badge>
        }
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const book = row.original
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
                <DropdownMenuItem onClick={() => handleEdit(book)}>Edit buku</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => confirmDelete(book.id)}>
                  Hapus buku
                </DropdownMenuItem>
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
        searchKey="judul"
        searchPlaceholder="Cari judul..."
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
          { label: 'Tersedia', value: 'tersedia' },
          { label: 'Rusak', value: 'rusak' },
          { label: 'Dipinjam', value: 'dipinjam' }
        ]}
        pageCount={pageCount}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={setPagination}
        renderBulkActions={(table) => (
          <Button variant="destructive" onClick={() => confirmBulkDelete(table)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
        )}
      />

      <UpdateBook
        open={editOpen}
        setOpen={setEditOpen}
        bookData={selectedBook}
        onSuccess={fetchData}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus buku secara permanen dari
              database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus {tableInstance?.getFilteredSelectedRowModel().rows.length}{' '}
              buku yang terpilih secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} variant="destructive">
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
