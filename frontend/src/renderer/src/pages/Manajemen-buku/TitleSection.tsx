import AddBook from "./FormAddBook"

export default function ManajemenBukuTitle() {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">Manajemen Buku</h1>
        <p className="text-muted-foreground">Kelola semua koleksi buku perpustakaan.</p>
      </div>
      <div>
        <AddBook />
      </div>
    </div>
  )
}
