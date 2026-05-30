import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Star, StarHalf, Ticket, Calendar as CalendarIcon, Search } from 'lucide-react'
import { api } from '@/lib/axios'
import { getImageUrl, cn } from '@/lib/utils'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { authClient } from '@/lib/auth-client'
import LoginModal from '@/components/LoginModal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import { Field, FieldLabel } from '@/components/ui/field'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import BookTitle from './TitleSection'
type Buku = {
  id: number
  judul: string
  penulis: string
  kategori: string
  gambar?: string | null
  status: string
  ratingAverage?: number | null
}

const PAGE_SIZE = 30

const renderRatingStars = (rating: number | null | undefined) => {
  const value = rating ?? 0
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const position = index + 1
        if (value >= position) {
          return <Star key={position} className="h-4 w-4 text-amber-500" />
        }

        if (value > position - 1) {
          return <StarHalf key={position} className="h-4 w-4 text-amber-500" />
        }

        return <Star key={position} className="h-4 w-4 text-muted-foreground" />
      })}
      <span className="text-sm font-medium text-foreground">{value.toFixed(1)}</span>
    </div>
  )
}

export default function UserBookPage() {
  const [books, setBooks] = useState<Buku[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Auth states
  const { data: session } = authClient.useSession()
  const [loginOpen, setLoginOpen] = useState(false)

  // Active borrows tracking (bukuId => true if pending/disetujui)
  const [activeBorrowedBookIds, setActiveBorrowedBookIds] = useState<Set<number>>(new Set())
  const [alreadyBorrowedOpen, setAlreadyBorrowedOpen] = useState(false)

  // Borrow States
  const [selectedBook, setSelectedBook] = useState<Buku | null>(null)
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false)
  const [tanggalPinjam, setTanggalPinjam] = useState<Date>()
  const [tanggalKembali, setTanggalKembali] = useState<Date>()
  const [borrowing, setBorrowing] = useState(false)

  // Success Token State
  const [successToken, setSuccessToken] = useState('')
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)

  const fetchBooks = useCallback(async (pageNumber: number, searchParams: string = '') => {
    setLoading(true)

    try {
      const response = await api.get('/buku', {
        params: {
          page: pageNumber,
          limit: PAGE_SIZE,
          search: searchParams
        }
      })

      const nextBooks: Buku[] = response.data.data ?? response.data ?? []
      const totalPages = response.data.pagination?.totalPages ?? Math.ceil((response.data.pagination?.totalItems ?? nextBooks.length) / PAGE_SIZE)

      setBooks((prevBooks) => (pageNumber === 1 ? nextBooks : [...prevBooks, ...nextBooks]))
      setHasMore(pageNumber < totalPages)
    } catch (error) {
      console.error('Gagal memuat buku:', error)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1) // Reset page on new search
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    fetchBooks(page, debouncedSearch)
  }, [fetchBooks, page, debouncedSearch])

  // Fetch active borrows for logged-in user
  useEffect(() => {
    if (!session) {
      setActiveBorrowedBookIds(new Set())
      return
    }
    api.get('/peminjaman/me').then((res) => {
      const active = (res.data.data as any[]).filter(
        (p) => p.status === 'pending' || p.status === 'disetujui'
      )
      setActiveBorrowedBookIds(new Set(active.map((p) => p.buku.id)))
    }).catch(() => {})
  }, [session])

  useEffect(() => {
    if (!sentinelRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && !loading && hasMore) {
          setPage((current) => current + 1)
        }
      },
      {
        rootMargin: '200px'
      }
    )

    observer.observe(sentinelRef.current)

    return () => observer.disconnect()
  }, [loading, hasMore])

  const handlePinjamClick = (book: Buku) => {
    if (!session) {
      setLoginOpen(true)
      return
    }

    if (book.status.toLowerCase() !== 'tersedia') {
      toast.error('Buku ini sedang tidak tersedia untuk dipinjam')
      return
    }

    // Check if user already has active borrow for this book
    if (activeBorrowedBookIds.has(book.id)) {
      setSelectedBook(book)
      setAlreadyBorrowedOpen(true)
      return
    }

    // Set default dates: today & today + 7 days
    const today = new Date()
    const returnDate = new Date()
    returnDate.setDate(today.getDate() + 7)

    setTanggalPinjam(today)
    setTanggalKembali(returnDate)
    setSelectedBook(book)
    setBorrowDialogOpen(true)
  }

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBook) return

    if (!tanggalPinjam || !tanggalKembali) {
      toast.error('Kedua tanggal harus diisi')
      return
    }

    const tPinjam = tanggalPinjam
    const tKembali = tanggalKembali

    if (tKembali <= tPinjam) {
      toast.error('Tanggal kembali harus setelah tanggal pinjam')
      return
    }

    setBorrowing(true)
    try {
      const response = await api.post('/peminjaman', {
        bukuId: selectedBook.id,
        tanggalPinjam: format(tPinjam, 'yyyy-MM-dd'),
        tanggalKembali: format(tKembali, 'yyyy-MM-dd')
      })

      if (response.data.success) {
        setSuccessToken(response.data.token)
        setBorrowDialogOpen(false)
        setSuccessDialogOpen(true)
        // Refresh page 1
        setPage(1)
        fetchBooks(1, debouncedSearch)
      } else {
        toast.error(response.data.error || 'Gagal memproses peminjaman')
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.response?.data?.error || 'Terjadi kesalahan sistem')
    } finally {
      setBorrowing(false)
    }
  }

  return (
    <div className="p-3">
      <BookTitle />

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari judul, penulis, atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {books.map((book) => (
          <Card
            key={book.id}
            className="overflow-hidden p-0 gap-0 py-0 flex flex-col justify-between"
          >
            <div className="h-64 overflow-hidden bg-muted">
              {book.gambar ? (
                <img
                  src={getImageUrl(book.gambar) || ''}
                  alt={`Cover ${book.judul}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center px-4 text-center text-sm font-medium text-muted-foreground">
                  Cover buku belum tersedia
                </div>
              )}
            </div>

            <CardContent className="space-y-3 p-5">
              <div>
                <Badge variant="secondary" className="mb-2 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md">
                  {book.kategori}
                </Badge>
                <h2 className="text-lg font-semibold leading-7 text-foreground line-clamp-2">{book.judul}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{book.penulis}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">{renderRatingStars(book.ratingAverage ?? 0)}</div>
                <div
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] border ${
                    book.status.toLowerCase() === 'tersedia'
                      ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400 dark:hover:bg-green-900/60 border-green-200 dark:border-green-900/50'
                      : book.status.toLowerCase() === 'dipinjam'
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:hover:bg-yellow-900/60 border-yellow-200 dark:border-yellow-900/50'
                      : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60 border-red-200 dark:border-red-900/50'
                  }`}
                >
                  {book.status}
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-5 pt-0">
              <button
                onClick={() => handlePinjamClick(book)}
                disabled={book.status.toLowerCase() !== 'tersedia'}
                className={`flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
                  book.status.toLowerCase() === 'tersedia'
                    ? 'bg-primary hover:bg-primary/90 cursor-pointer'
                    : 'bg-muted-foreground/30 text-muted-foreground/75 cursor-not-allowed'
                }`}
              >
                Pinjam
              </button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {books.length === 0 && !loading ? (
        <div className="mt-8 rounded-3xl border border-dashed border-muted/40 bg-muted/10 px-8 py-16 text-center text-sm text-muted-foreground">
          Tidak ada buku yang bisa ditampilkan.
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat buku...
        </div>
      ) : null}

      <div ref={sentinelRef} className="h-1" />

      {/* Guest Login Modal */}
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />

      {/* Borrow Date Picker Dialog */}
      <Dialog open={borrowDialogOpen} onOpenChange={setBorrowDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[1.3rem]">Pilih Tanggal Peminjaman</DialogTitle>
            <DialogDescription>
              Silakan isi durasi peminjaman untuk buku &ldquo;{selectedBook?.judul}&rdquo;
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBorrowSubmit} className="flex flex-col gap-4 pt-2">
            <Field className="flex flex-col gap-2">
              <FieldLabel>Tanggal Pinjam</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !tanggalPinjam && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tanggalPinjam ? format(tanggalPinjam, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tanggalPinjam}
                    onSelect={setTanggalPinjam}
                    disabled={{ before: new Date() }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </Field>

            <Field className="flex flex-col gap-2">
              <FieldLabel>Tanggal Kembali</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !tanggalKembali && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tanggalKembali ? format(tanggalKembali, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tanggalKembali}
                    onSelect={setTanggalKembali}
                    disabled={{ before: tanggalPinjam || new Date() }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </Field>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setBorrowDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={borrowing}>
                {borrowing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Lanjutkan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Borrow Success Token Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="max-w-md text-center py-6">
          <DialogHeader className="items-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <Ticket className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-[1.3rem] text-green-700">Kode Peminjaman Berhasil Dibuat</DialogTitle>
            <DialogDescription className="text-center">
              Tunjukkan kode token peminjaman di bawah ini kepada petugas perpustakaan untuk memvalidasi peminjaman Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="my-6 p-4 bg-muted rounded-2xl border border-border inline-block">
            <span className="text-3xl font-extrabold tracking-wider text-foreground select-all select-none">
              {successToken}
            </span>
          </div>

          <DialogFooter className="justify-center sm:justify-center">
            <Button className="w-full sm:w-auto" onClick={() => setSuccessDialogOpen(false)}>
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Already Borrowed Dialog */}
      <Dialog open={alreadyBorrowedOpen} onOpenChange={setAlreadyBorrowedOpen}>
        <DialogContent className="max-w-md text-center py-6">
          <DialogHeader className="items-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
              <Ticket className="h-6 w-6 text-amber-600" />
            </div>
            <DialogTitle className="text-[1.1rem] text-amber-700">Kamu Sudah Meminjam Buku Ini</DialogTitle>
            <DialogDescription className="text-center">
              Kamu memiliki peminjaman aktif untuk buku{' '}
              <strong>{selectedBook?.judul}</strong>. Tunggu hingga peminjaman selesai atau dibatalkan sebelum meminjam kembali.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-center sm:justify-center pt-4">
            <Button variant="outline" onClick={() => setAlreadyBorrowedOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
