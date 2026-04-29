import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@renderer/components/ui/card'
import axios from 'axios'

import { BUKU_API_URL } from '@/constants/constant'
import { useState, useEffect } from 'react'

export default function HomeCardSection() {
  const [totalBuku, setTotalBuku] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${BUKU_API_URL}/count`)
      setTotalBuku(response.data.count)
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
    { title: 'Buku', description: 'Total seluruh buku', value: totalBuku },
    { title: 'Anggota', description: 'Total seluruh anggota', value: 0 },
    { title: 'Buku Sedang Dipinjam', description: 'Total buku yang dipinjam', value: 0 },
    { title: 'Buku Terlambat', description: 'Total seluruh buku', value: 0 }
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
