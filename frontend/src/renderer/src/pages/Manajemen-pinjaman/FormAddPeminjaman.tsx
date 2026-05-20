import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import { Plus, CalendarIcon, Search } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { peminjamanSchema, type PeminjamanSchema } from '@/schemas/schema'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { ANGGOTA_API_URL, BUKU_API_URL, PEMINJAMAN_API_URL } from '@/constants/constant'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function AddPeminjaman({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [anggotaList, setAnggotaList] = useState<any[]>([])
  const [bukuList, setBukuList] = useState<any[]>([])
  const [anggotaSearch, setAnggotaSearch] = useState('')
  const [bukuSearch, setBukuSearch] = useState('')
  const [anggotaOpen, setAnggotaOpen] = useState(false)
  const [bukuOpen, setBukuOpen] = useState(false)
  const [anggotaPage, setAnggotaPage] = useState(1)
  const [anggotaHasMore, setAnggotaHasMore] = useState(true)
  const [bukuPage, setBukuPage] = useState(1)
  const [bukuHasMore, setBukuHasMore] = useState(true)
  const [anggotaLoading, setAnggotaLoading] = useState(false)
  const [bukuLoading, setBukuLoading] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<PeminjamanSchema>({
    resolver: zodResolver(peminjamanSchema),
    defaultValues: {
      tanggal_pinjam: undefined,
      tanggal_jatuh_tempo: undefined
    }
  })

  // Fetch Anggota with search & pagination
  useEffect(() => {
    if (!open) return
    setAnggotaLoading(true)
    const source = axios.CancelToken.source()
    const delayDebounceFn = setTimeout(() => {
      axios.get(ANGGOTA_API_URL, { 
        params: { search: anggotaSearch, limit: 10, page: anggotaPage },
        cancelToken: source.token
      })
      .then(res => {
        if (anggotaPage === 1) {
          setAnggotaList(res.data.data)
        } else {
          setAnggotaList(prev => {
            const existingIds = new Set(prev.map(p => p.id))
            const newItems = res.data.data.filter((item: any) => !existingIds.has(item.id))
            return [...prev, ...newItems]
          })
        }
        setAnggotaHasMore(res.data.pagination.currentPage < res.data.pagination.totalPages)
      })
      .catch(err => { if (!axios.isCancel(err)) console.error(err) })
      .finally(() => setAnggotaLoading(false))
    }, 300)
    return () => {
      clearTimeout(delayDebounceFn)
      source.cancel()
    }
  }, [anggotaSearch, anggotaPage, open])

  // Fetch Buku with search & pagination
  useEffect(() => {
    if (!open) return
    setBukuLoading(true)
    const source = axios.CancelToken.source()
    const delayDebounceFn = setTimeout(() => {
      axios.get(BUKU_API_URL, { 
        params: { search: bukuSearch, limit: 10, page: bukuPage },
        cancelToken: source.token
      })
      .then(res => {
        if (bukuPage === 1) {
          setBukuList(res.data.data)
        } else {
          setBukuList(prev => {
            const existingIds = new Set(prev.map(p => p.id))
            const newItems = res.data.data.filter((item: any) => !existingIds.has(item.id))
            return [...prev, ...newItems]
          })
        }
        setBukuHasMore(res.data.pagination.currentPage < res.data.pagination.totalPages)
      })
      .catch(err => { if (!axios.isCancel(err)) console.error(err) })
      .finally(() => setBukuLoading(false))
    }, 300)
    return () => {
      clearTimeout(delayDebounceFn)
      source.cancel()
    }
  }, [bukuSearch, bukuPage, open])

  const handleAnggotaSearch = (val: string) => {
    setAnggotaSearch(val)
    setAnggotaPage(1)
  }

  const handleBukuSearch = (val: string) => {
    setBukuSearch(val)
    setBukuPage(1)
  }

  const handleAnggotaScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 10 && anggotaHasMore && !anggotaLoading) {
      setAnggotaLoading(true)
      setAnggotaPage(prev => prev + 1)
    }
  }

  const handleBukuScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 10 && bukuHasMore && !bukuLoading) {
      setBukuLoading(true)
      setBukuPage(prev => prev + 1)
    }
  }

  async function onSubmit(data: PeminjamanSchema) {
    try {
      await axios.post(PEMINJAMAN_API_URL, data)
      toast.success('Peminjaman berhasil ditambahkan')
      reset()
      setAnggotaSearch('')
      setBukuSearch('')
      onSuccess()
      setOpen(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menambahkan peminjaman')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Tambah Peminjaman
        </Button>
      </DialogTrigger>

      <DialogContent 
        className="max-w-md" 
      >
        <DialogHeader>
          <DialogTitle>Tambah Peminjaman</DialogTitle>
          <DialogDescription>
            Pilih anggota dan buku yang akan dipinjam, serta tentukan tanggal jatuh tempo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
          {/* Anggota Selection */}
          <Field aria-invalid={!!errors.anggotaId}>
            <FieldLabel>Peminjam (Anggota)</FieldLabel>
            <Controller
              name="anggotaId"
              control={control}
              render={({ field }) => (
                <Popover open={anggotaOpen} onOpenChange={setAnggotaOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-between font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? anggotaList.find((a) => a.id === field.value)?.nama || "Pilih Anggota"
                        : "Pilih Anggota"}
                      <Search className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <div className="flex flex-col w-full">
                      <div className="p-2 border-b w-full">
                        <input
                          className="flex h-9 w-full rounded-md bg-transparent px-3 py-1 text-sm outline-none placeholder:text-muted-foreground"
                          placeholder="Cari anggota..."
                          value={anggotaSearch}
                          onChange={(e) => handleAnggotaSearch(e.target.value)}
                        />
                      </div>
                      <div 
                        className="max-h-[200px] overflow-y-auto p-1"
                        onWheel={(e) => e.stopPropagation()}
                        onScroll={handleAnggotaScroll}
                      >
                        {anggotaList.length === 0 ? (
                          <div className="p-2 text-sm text-center text-muted-foreground">Tidak ditemukan</div>
                        ) : (
                          anggotaList.map((item) => (
                            <div
                              key={item.id}
                              role="button"
                              tabIndex={0}
                              className={cn(
                                "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                field.value === item.id && "bg-accent text-accent-foreground"
                              )}
                              onClick={() => {
                                field.onChange(item.id)
                                setAnggotaSearch(item.nama)
                                setAnggotaOpen(false)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  field.onChange(item.id)
                                  setAnggotaSearch(item.nama)
                                  setAnggotaOpen(false)
                                }
                              }}
                            >
                              {item.nama}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            />
            <FieldError errors={errors.anggotaId ? [{ message: errors.anggotaId.message }] : []} />
          </Field>

          {/* Buku Selection */}
          <Field aria-invalid={!!errors.bukuId}>
            <FieldLabel>Buku</FieldLabel>
            <Controller
              name="bukuId"
              control={control}
              render={({ field }) => (
                <Popover open={bukuOpen} onOpenChange={setBukuOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-between font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? bukuList.find((b) => b.id === field.value)?.judul || "Pilih Buku"
                        : "Pilih Buku"}
                      <Search className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <div className="flex flex-col">
                      <div className="p-2 border-b">
                        <input
                          className="flex h-9 w-full rounded-md bg-transparent px-3 py-1 text-sm outline-none placeholder:text-muted-foreground"
                          placeholder="Cari buku..."
                          value={bukuSearch}
                          onChange={(e) => handleBukuSearch(e.target.value)}
                        />
                      </div>
                      <div 
                        className="max-h-[200px] overflow-y-auto p-1"
                        onWheel={(e) => e.stopPropagation()}
                        onScroll={handleBukuScroll}
                      >
                        {bukuList.filter(b => !b.status || b.status.toLowerCase() === 'tersedia').length === 0 ? (
                          <div className="p-2 text-sm text-center text-muted-foreground">
                            {bukuList.length > 0 ? "Buku tidak tersedia (Sedang dipinjam/Rusak)" : "Tidak ditemukan"}
                          </div>
                        ) : (
                          bukuList
                            .filter(b => !b.status || b.status.toLowerCase() === 'tersedia')
                              .map((item) => (
                                <div
                                  key={item.id}
                                  role="button"
                                  tabIndex={0}
                                  className={cn(
                                    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                    field.value === item.id && "bg-accent text-accent-foreground"
                                  )}
                                  onClick={() => {
                                    field.onChange(item.id)
                                    setBukuSearch(item.judul)
                                    setBukuOpen(false)
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      field.onChange(item.id)
                                      setBukuSearch(item.judul)
                                      setBukuOpen(false)
                                    }
                                  }}
                                >
                                  {item.judul}
                                </div>
                              ))
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            />
            <FieldError errors={errors.bukuId ? [{ message: errors.bukuId.message }] : []} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            {/* Tanggal Pinjam */}
            <Field aria-invalid={!!errors.tanggal_pinjam}>
              <FieldLabel>Tgl Pinjam</FieldLabel>
              <Controller
                name="tanggal_pinjam"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              <FieldError errors={errors.tanggal_pinjam ? [{ message: errors.tanggal_pinjam.message }] : []} />
            </Field>

            {/* Tanggal Jatuh Tempo */}
            <Field aria-invalid={!!errors.tanggal_jatuh_tempo}>
              <FieldLabel>Jatuh Tempo</FieldLabel>
              <Controller
                name="tanggal_jatuh_tempo"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              <FieldError errors={errors.tanggal_jatuh_tempo ? [{ message: errors.tanggal_jatuh_tempo.message }] : []} />
            </Field>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Peminjaman'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
