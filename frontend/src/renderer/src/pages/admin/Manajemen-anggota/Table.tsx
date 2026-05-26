import { DataTable } from '@renderer/components/ui/data-table'
import { ColumnDef, Table as ReactTable } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, Trash2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
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

type User = {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
}

const CONFIRM_TEXT = 'HAPUS'

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
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [tableInstance, setTableInstance] = useState<ReactTable<User> | null>(null)
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await authClient.admin.listUsers({
        query: {
          limit: pagination.pageSize,
          offset: pagination.pageIndex * pagination.pageSize,
          ...(search
            ? { searchField: 'name', searchValue: search, searchOperator: 'contains' as const }
            : {})
        }
      })

      if (response.data) {
        setData(response.data.users as User[])
        const total = response.data.total || 0
        setPageCount(Math.ceil(total / pagination.pageSize))
      }
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
      await authClient.admin.removeUser({
        userId: deleteUser.id
      })
      toast.success(`Anggota "${deleteUser.name}" berhasil dihapus`)
      fetchData()
      setDeleteOpen(false)
      setDeleteUser(null)
      setDeleteConfirmText('')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus anggota')
    }
  }

  const handleBulkDelete = async () => {
    if (!tableInstance) return

    const selectedRows = tableInstance.getFilteredSelectedRowModel().rows
    const users = selectedRows.map((row) => row.original as User)

    if (users.length === 0) return

    try {
      await Promise.all(users.map((user: User) => authClient.admin.removeUser({ userId: user.id })))
      toast.success(`${users.length} anggota berhasil dihapus`)
      tableInstance.resetRowSelection()
      fetchData()
      setBulkDeleteOpen(false)
      setBulkDeleteConfirmText('')
    } catch (error) {
      console.error('Bulk delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus anggota terpilih')
    }
  }

  const confirmPromote = (user: User) => {
    setSelectedUser(user)
    setPromoteOpen(true)
  }

  const confirmDelete = (user: User) => {
    setDeleteUser(user)
    setDeleteConfirmText('')
    setDeleteOpen(true)
  }

  const confirmBulkDelete = (table: ReactTable<User>) => {
    setTableInstance(table)
    setBulkDeleteConfirmText('')
    setBulkDeleteOpen(true)
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

      {/* Single delete confirmation with verification */}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) setDeleteConfirmText('')
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Tindakan ini tidak dapat dibatalkan. Ini akan menghapus anggota{' '}
                  <span className="font-semibold">{deleteUser?.name}</span> secara permanen dari
                  database.
                </p>
                <p>
                  Ketik{' '}
                  <span className="font-mono font-semibold text-destructive">{CONFIRM_TEXT}</span>{' '}
                  untuk mengonfirmasi.
                </p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={`Ketik ${CONFIRM_TEXT} di sini...`}
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              variant="destructive"
              disabled={deleteConfirmText !== CONFIRM_TEXT}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation with verification */}
      <AlertDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          setBulkDeleteOpen(open)
          if (!open) setBulkDeleteConfirmText('')
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Tindakan ini akan menghapus{' '}
                  <span className="font-semibold">
                    {tableInstance?.getFilteredSelectedRowModel().rows.length}
                  </span>{' '}
                  anggota yang terpilih secara permanen.
                </p>
                <p>
                  Ketik{' '}
                  <span className="font-mono font-semibold text-destructive">{CONFIRM_TEXT}</span>{' '}
                  untuk mengonfirmasi.
                </p>
                <Input
                  value={bulkDeleteConfirmText}
                  onChange={(e) => setBulkDeleteConfirmText(e.target.value)}
                  placeholder={`Ketik ${CONFIRM_TEXT} di sini...`}
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              variant="destructive"
              disabled={bulkDeleteConfirmText !== CONFIRM_TEXT}
            >
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
