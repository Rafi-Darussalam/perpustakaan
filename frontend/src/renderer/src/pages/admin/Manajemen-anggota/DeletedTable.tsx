import { DataTable } from '@renderer/components/ui/data-table'
import { ColumnDef, Table as ReactTable } from '@tanstack/react-table'
import { ArrowUpDown, RotateCcw, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { toast } from 'sonner'
import axios from 'axios'

type User = {
  id: string
  name: string
  email: string
  role: string
  deletedAt: string
}

export default function DeletedTable() {
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const [pageCount, setPageCount] = useState(0)
  const [search, setSearch] = useState('')

  const [restoreOpen, setRestoreOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const [hardDeleteOpen, setHardDeleteOpen] = useState(false)
  const [hardDeleteUser, setHardDeleteUser] = useState<User | null>(null)
  const [hardDeleteConfirmText, setHardDeleteConfirmText] = useState('')
  const [dynamicChallenge, setDynamicChallenge] = useState('')

  const [bulkRestoreOpen, setBulkRestoreOpen] = useState(false)
  const [tableInstance, setTableInstance] = useState<ReactTable<User> | null>(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_URL}/api/admin/users/deleted`, {
        params: {
          limit: pagination.pageSize,
          offset: pagination.pageIndex * pagination.pageSize,
          ...(search ? { searchField: 'name', searchValue: search } : {})
        },
        withCredentials: true
      })
      setData(res.data.users)
      const total = res.data.total || 0
      setPageCount(Math.ceil(total / pagination.pageSize))
    } catch (error) {
      console.error('Error fetching deleted users:', error)
      toast.error('Gagal memuat data anggota yang dihapus')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!selectedUser) return

    try {
      await axios.post(`${API_URL}/api/admin/users/${selectedUser.id}/restore`, {}, { withCredentials: true })
      toast.success(`${selectedUser.name} berhasil dipulihkan`)
      fetchData()
      setRestoreOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Restore error:', error)
      toast.error('Gagal memulihkan anggota')
    }
  }

  const handleHardDelete = async () => {
    if (!hardDeleteUser) return

    try {
      await axios.delete(`${API_URL}/api/admin/users/${hardDeleteUser.id}/hard-delete`, { withCredentials: true })
      toast.success(`Anggota "${hardDeleteUser.name}" berhasil dihapus permanen`)
      fetchData()
      setHardDeleteOpen(false)
      setHardDeleteUser(null)
      setHardDeleteConfirmText('')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Gagal menghapus anggota permanen')
    }
  }

  const handleBulkRestore = async () => {
    if (!tableInstance) return

    const selectedRows = tableInstance.getFilteredSelectedRowModel().rows
    const users = selectedRows.map((row) => row.original as User)

    if (users.length === 0) return

    try {
      await Promise.all(
        users.map((user) =>
          axios.post(`${API_URL}/api/admin/users/${user.id}/restore`, {}, { withCredentials: true })
        )
      )
      toast.success(`${users.length} anggota berhasil dipulihkan`)
      tableInstance.resetRowSelection()
      fetchData()
      setBulkRestoreOpen(false)
    } catch (error) {
      console.error('Bulk restore error:', error)
      toast.error('Gagal memulihkan anggota terpilih')
    }
  }

  const confirmRestore = (user: User) => {
    setSelectedUser(user)
    setRestoreOpen(true)
  }

  const confirmHardDelete = (user: User) => {
    setHardDeleteUser(user)
    setHardDeleteConfirmText('')
    // Generate random 4 alphanumeric string
    const challenge = 'HAPUS-' + Math.random().toString(36).substring(2, 6).toUpperCase()
    setDynamicChallenge(challenge)
    setHardDeleteOpen(true)
  }

  const confirmBulkRestore = (table: ReactTable<User>) => {
    setTableInstance(table)
    setBulkRestoreOpen(true)
  }

  const columns: ColumnDef<User>[] = useMemo(
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
        accessorKey: 'name',
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
        accessorKey: 'email',
        header: 'Email'
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const role = row.getValue('role') as string
          return (
            <Badge variant="outline">
              {role === 'admin' ? 'Petugas' : 'Anggota'}
            </Badge>
          )
        }
      },
      {
        accessorKey: 'deletedAt',
        header: 'Waktu Dihapus',
        cell: ({ row }) => {
          const dateStr = row.getValue('deletedAt') as string
          if (!dateStr) return '-'
          const date = new Date(dateStr)
          return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const user = row.original
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
                <DropdownMenuItem onClick={() => confirmRestore(user)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Pulihkan
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => confirmHardDelete(user)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Permanen
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
  }, [pagination, search])

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={loading}
        searchKey="name"
        searchPlaceholder="Cari nama anggota yang dihapus..."
        onSearchChange={(value) => {
          if (value !== search) {
            setSearch(value)
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
          }
        }}
        pageCount={pageCount}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={setPagination}
        renderBulkActions={(table) => (
          <Button variant="outline" onClick={() => confirmBulkRestore(table)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Pulihkan ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
        )}
      />

      {/* Restore confirmation */}
      <AlertDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pulihkan anggota?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan memulihkan <span className="font-semibold">{selectedUser?.name}</span>.
              Anggota ini akan kembali aktif dan dapat login ke dalam sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>Pulihkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk restore confirmation */}
      <AlertDialog open={bulkRestoreOpen} onOpenChange={setBulkRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pulihkan anggota terpilih?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan memulihkan <span className="font-semibold">{tableInstance?.getFilteredSelectedRowModel().rows.length}</span> anggota.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkRestore}>Pulihkan Semua</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hard delete confirmation */}
      <AlertDialog
        open={hardDeleteOpen}
        onOpenChange={(open) => {
          setHardDeleteOpen(open)
          if (!open) setHardDeleteConfirmText('')
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus permanen?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 mt-3">
                <p>
                  Tindakan ini sangat fatal dan <strong>tidak dapat dibatalkan</strong>. Data anggota{' '}
                  <span className="font-semibold">{hardDeleteUser?.name}</span> beserta semua data terkaitnya akan dihapus permanen dari database.
                </p>
                <p>
                  Ketik{' '}
                  <span className="font-mono font-bold text-destructive select-none">{dynamicChallenge}</span>{' '}
                  untuk mengonfirmasi penghapusan permanen.
                </p>
                <Input
                  value={hardDeleteConfirmText}
                  onChange={(e) => setHardDeleteConfirmText(e.target.value)}
                  placeholder={`Ketik ${dynamicChallenge} di sini...`}
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHardDelete}
              variant="destructive"
              disabled={hardDeleteConfirmText !== dynamicChallenge}
            >
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
