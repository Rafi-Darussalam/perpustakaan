import AddBook from "./FormAddBook"

type ManajemenBukuTitleProps = {
  onSuccess: () => void
}

export default function ManajemenBukuTitle({ onSuccess }: ManajemenBukuTitleProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">Manajemen Buku</h1>
        <p className="text-muted-foreground">Kelola semua koleksi buku perpustakaan.</p>
      </div>
      <div>
        <AddBook onSuccess={onSuccess} />
      </div>
    </div>
  )
}
