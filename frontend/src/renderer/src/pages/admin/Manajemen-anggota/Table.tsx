import { DataTable } from '@renderer/components/ui/data-table'
import { ColumnDef, Table as ReactTable } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, Trash2, ShieldCheck } from 'lucide-react'
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
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'
import axios from 'axios'

type User = {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
}

export default function ManajemenAnggotaTable() {
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const [pageCount, setPageCount] = useState(0)
  const [search, setSearch] = useState('')

  const [promoteOpen, setPromoteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [tableInstance, setTableInstance] = useState<ReactTable<User> | null>(null)
  
  const [countdown, setCountdown] = useState(0)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_URL}/api/admin/users`, {
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
      console.error('Error fetching users:', error)
      toast.error('Gagal memuat data anggota')
    } finally {
      setLoading(false)
    }
  }

  const handlePromote = async () => {
    if (!selectedUser) return

    try {
      await authClient.admin.setRole({
        userId: selectedUser.id,
        role: 'admin'
      })
      toast.success(`${selectedUser.name} berhasil ditetapkan sebagai petugas`)
      fetchData()
      setPromoteOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Promote error:', error)
      toast.error('Gagal menetapkan sebagai petugas')
    }
  }

  const handleDelete = async () => {
    if (!deleteUser) return

    try {
      await axios.post(`${API_URL}/api/admin/users/${deleteUser.id}/soft-delete`, {}, { withCredentials: true })
      toast.success(`Anggota "${deleteUser.name}" berhasil dihapus`)
      fetchData()
      setDeleteOpen(false)
      setDeleteUser(null)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Gagal menghapus anggota')
    }
  }

  const handleBulkDelete = async () => {
    if (!tableInstance) return

    const selectedRows = tableInstance.getFilteredSelectedRowModel().rows
    const users = selectedRows.map((row) => row.original as User)

    if (users.length === 0) return

    try {
      await axios.post(
        `${API_URL}/api/admin/users/bulk-soft-delete`,
        { ids: users.map(u => u.id) },
        { withCredentials: true }
      )
      toast.success(`${users.length} anggota berhasil dihapus`)
      tableInstance.resetRowSelection()
      fetchData()
      setBulkDeleteOpen(false)
    } catch (error) {
      console.error('Bulk delete error:', error)
      toast.error('Gagal menghapus anggota terpilih')
    }
  }

  const confirmPromote = (user: User) => {
    setSelectedUser(user)
    setPromoteOpen(true)
  }

  const startCountdown = () => {
    setCountdown(3)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const confirmDelete = (user: User) => {
    setDeleteUser(user)
    setDeleteOpen(true)
    startCountdown()
  }

  const confirmBulkDelete = (table: ReactTable<User>) => {
    setTableInstance(table)
    setBulkDeleteOpen(true)
    startCountdown()
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
          const isAdmin = role === 'admin'
          return (
            <Badge
              className={
                isAdmin
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:hover:bg-blue-900/60 border-blue-200 dark:border-blue-900/50'
                  : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400 dark:hover:bg-green-900/60 border-green-200 dark:border-green-900/50'
              }
            >
              {isAdmin ? 'Petugas' : 'Anggota'}
            </Badge>
          )
        }
      },
      {
        accessorKey: 'createdAt',
        header: 'Terdaftar',
        cell: ({ row }) => {
          const date = new Date(row.getValue('createdAt'))
          return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
        }
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const user = row.original
          const isAlreadyAdmin = user.role === 'admin'

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
                {!isAlreadyAdmin && (
                  <DropdownMenuItem onClick={() => confirmPromote(user)}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Tetapkan sebagai petugas
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem variant="destructive" onClick={() => confirmDelete(user)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus anggota
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
        searchPlaceholder="Cari nama anggota..."
        onSearchChange={(value) => {
          if (value !== search) {
            setSearch(value)
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
          }
        }}
        filterKey="role"
        filterOptions={[
          { label: 'Anggota', value: 'user' },
          { label: 'Petugas', value: 'admin' }
        ]}
        onFilterChange={() => {}}
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

      {/* Promote confirmation */}
      <AlertDialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tetapkan sebagai petugas?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menetapkan <span className="font-semibold">{selectedUser?.name}</span>{' '}
              sebagai petugas perpustakaan. Petugas memiliki akses penuh untuk mengelola buku,
              anggota, dan peminjaman.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromote}>Tetapkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single delete confirmation with countdown */}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) setCountdown(0)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus anggota?</AlertDialogTitle>
            <AlertDialogDescription>
              Anggota <span className="font-semibold">{deleteUser?.name}</span> akan dipindahkan ke daftar anggota yang dihapus.
              Anggota yang dihapus tidak akan bisa masuk ke dalam sistem. Anda masih bisa memulihkannya nanti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              variant="destructive"
              disabled={countdown > 0}
            >
              {countdown > 0 ? `Hapus (${countdown})` : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation with countdown */}
      <AlertDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          setBulkDeleteOpen(open)
          if (!open) setCountdown(0)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus anggota terpilih?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan memindahkan{' '}
              <span className="font-semibold">
                {tableInstance?.getFilteredSelectedRowModel().rows.length}
              </span>{' '}
              anggota yang terpilih ke daftar anggota yang dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              variant="destructive"
              disabled={countdown > 0}
            >
              {countdown > 0 ? `Hapus Semua (${countdown})` : 'Hapus Semua'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
