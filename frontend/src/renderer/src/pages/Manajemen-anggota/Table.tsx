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
import { ANGGOTA_API_URL } from '@/constants/constant'
import { toast } from 'sonner'
import FormUpdateAnggota from './FormUpdateAnggota'

type Anggota = {
  id: number
  nama: string
  nomor_telepon: string
  email: string
  alamat: string
  createdAt: string
}

export default function ManajemenAnggotaTable({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<Anggota[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const [pageCount, setPageCount] = useState(0)

  const [editOpen, setEditOpen] = useState(false)
  const [selectedAnggota, setSelectedAnggota] = useState<Anggota | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [tableInstance, setTableInstance] = useState<any>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(ANGGOTA_API_URL, {
        params: {
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize
        }
      })
      setData(response.data.data)
      setPageCount(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal mengambil data anggota')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await axios.delete(`${ANGGOTA_API_URL}/${deleteId}`)
      toast.success('Anggota berhasil dihapus')
      fetchData()
      setDeleteOpen(false)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Gagal menghapus anggota')
    }
  }

  const handleBulkDelete = async () => {
    if (!tableInstance) return
    
    const selectedRows = tableInstance.getFilteredSelectedRowModel().rows
    const ids = selectedRows.map((row: any) => row.original.id)

    if (ids.length === 0) return

    try {
      await axios.post(`${ANGGOTA_API_URL}/delete-bulk`, { ids })
      toast.success(`${ids.length} anggota berhasil dihapus`)
      tableInstance.resetRowSelection()
      fetchData()
      setBulkDeleteOpen(false)
    } catch (error) {
      console.error('Bulk delete error:', error)
      toast.error('Gagal menghapus anggota terpilih')
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

  const handleEdit = (anggota: Anggota) => {
    setSelectedAnggota(anggota)
    setEditOpen(true)
  }

  const columns: ColumnDef<Anggota>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
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
      accessorKey: 'nama',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nama
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      }
    },
    {
      accessorKey: 'nomor_telepon',
      header: 'Nomor Telepon'
    },
    {
      accessorKey: 'email',
      header: 'Email'
    },
    {
      accessorKey: 'alamat',
      header: 'Alamat',
      cell: ({ row }) => {
        const alamat = row.getValue('alamat') as string
        return <div className="max-w-[200px] truncate">{alamat || '-'}</div>
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const anggota = row.original
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
              <DropdownMenuItem onClick={() => handleEdit(anggota)}>Edit anggota</DropdownMenuItem>
              <DropdownMenuItem variant='destructive' onClick={() => confirmDelete(anggota.id)}>
                Hapus anggota
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ], [])

  useEffect(() => {
    fetchData()
  }, [pagination, refreshKey])

  if (loading && data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchKey="nama"
        searchPlaceholder="Cari nama anggota..."
        pageCount={pageCount}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={setPagination}
        renderBulkActions={(table) => (
          <Button
            variant="destructive"
            onClick={() => confirmBulkDelete(table)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
        )}
      />
      
      <FormUpdateAnggota 
        open={editOpen} 
        setOpen={setEditOpen} 
        anggotaData={selectedAnggota} 
        onSuccess={fetchData}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data anggota secara permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              variant='destructive'
            >
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
              Tindakan ini akan menghapus {tableInstance?.getFilteredSelectedRowModel().rows.length} anggota yang terpilih secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              variant='destructive'
            >
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
