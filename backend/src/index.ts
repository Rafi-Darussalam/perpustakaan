import express, { Request, Response } from 'express'

const app = express()

app.get('/', (req: Request, res: Response) => {
    res.json("Yo")
})

app.listen(3000, () => {
    console.log("http://localhost:3000")
})