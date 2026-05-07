import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@renderer/components/ui/card'
import axios from 'axios'

import { BUKU_API_URL, ANGGOTA_API_URL, PEMINJAMAN_API_URL } from '@/constants/constant'
import { useState, useEffect } from 'react'

export default function HomeCardSection() {
  const [stats, setStats] = useState({
    totalBuku: 0,
    totalAnggota: 0,
    totalDipinjam: 0,
    totalTerlambat: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [bukuRes, anggotaRes, pinjamRes] = await Promise.all([
        axios.get(`${BUKU_API_URL}/count`),
        axios.get(`${ANGGOTA_API_URL}/count`),
        axios.get(`${PEMINJAMAN_API_URL}/stats`)
      ])
      
      setStats({
        totalBuku: bukuRes.data.count,
        totalAnggota: anggotaRes.data.count,
        totalDipinjam: pinjamRes.data.totalDipinjam,
        totalTerlambat: pinjamRes.data.totalTerlambat
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const cardInfo = [
    { title: 'Buku', description: 'Total seluruh buku', value: stats.totalBuku },
    { title: 'Anggota', description: 'Total seluruh anggota', value: stats.totalAnggota },
    { title: 'Buku Dipinjam', description: 'Total buku dipinjam', value: stats.totalDipinjam },
    { title: 'Buku Terlambat', description: 'Total buku terlambat', value: stats.totalTerlambat }
  ]

  return (
    <div className="flex gap-4 flex-wrap">
      {cardInfo.map(({ title, description, value }, i) => (
        <Card className="flex-1 min-w-[200px] bg-linear-to-b from-background to-sidebar" key={i}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          {loading ? (
            <CardContent>
              <p className="font-bold">Loading...</p>
            </CardContent>
          ) : (
            <CardContent>
              <p className="text-[2.5rem] font-bold">{value}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}
