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

type User = {
  id: string
  judul: string
  penulis: string
  role: 'admin' | 'user' | 'moderator'
  status: 'tersedia' | 'rusak' | 'dipinjam'
  rating: string
}

const users: User[] = [
  {
    id: '1',
    judul: 'Laskar Pelangi',
    penulis: 'jokowi',
    role: 'admin',
    status: 'tersedia',
    rating: '5/5'
  }
]

const columns: ColumnDef<User>[] = [
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
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const variants: Record<string, string> = {
        tersedia: 'bg-green-500',
        rusak: 'bg-red-500',
        dipinjam: 'bg-yellow-500'
      }
      return <Badge className={variants[status]}>{status}</Badge>
    }
  },
  {
    accessorKey: 'rating',
    header: 'Rating'
  },
  {
    id: 'actions',
    cell: ({ row }) => {
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
            <DropdownMenuItem>Edit buku</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Hapus buku</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]

export default function ManajemenBukuTable() {
  return (
    <DataTable columns={columns} data={users} searchKey="judul" searchPlaceholder="Cari judul..." />
  )
}
