const express = require('express')
const app = express()
const cors = require('cors')
const PORT = process.env.PORT || 7453

app.use(express.json())
app.use(cors())

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const LineSchema = new Schema({
    date: String,
    problems: Number,
    contracts: Number,
    screenshots: Number,
})

const Line = mongoose.model("Line", LineSchema)

mongoose.connect("mongodb://127.0.0.1:27017/lines")
    .then(console.log('Connected'))

async function Save (problems, contracts, screenshots) {
    const DateNow = new Date().toLocaleString() // Getting the date

    const NewLine = new Line({ date: DateNow, problems: problems, contracts: contracts, screenshots: screenshots})

    await NewLine.save()
    .then(console.log('Line saved'))
}

async function findByDate (date) {
    const regex = new RegExp(`\\b${date}\\b`, 'i')
    const found = await Line.find({date: { $regex: regex}})
    return found
}

async function sumValuesByDate(date) {
    try {
        const aggregationResult = await Line.aggregate([
            { $match: { date: { $lte: date } } }, // Изменено условие на $lte
            {
                $group: {
                    _id: null,
                    totalProblems: { $sum: "$problems" },
                    totalContracts: { $sum: "$contracts" },
                    totalScreenshots: { $sum: "$screenshots" },
                }
            }
        ])

        if (aggregationResult.length > 0) {
            return aggregationResult[0]; // Возвращаем первый элемент массива
        } else {
            return null // Возвращаем null, если нет данных
        }
    } catch (error) {
        console.error('Error:', error)
        return null
    }
}



app.listen(PORT)
console.log(`App starts on ${PORT}`)

app.get('/lists', async (req, res) => {
    console.log('Пришел запрос get на все записи')

    const finds = await Line.find()

    console.log(finds)

    res.send(finds)
})

app.get('/date', async (req,res) => {

    console.log('Пришел запрос get на все записи по дате')

    let result = []

    for (let i = 0; i < 5; i++){

        const DateNow = new Date().toLocaleString().split(',')[0]

        const dateSplit = DateNow.split('.')

        const day = parseInt(dateSplit[0]) + 1

        const newDate = (day - i) + '.' + dateSplit[1] + '.' + dateSplit[2]

        const data = await sumValuesByDate(newDate)

        result.push(data)
    }

    console.log(result)
    res.send(result)
})

app.get('/time', async (req, res) => {
    console.log('Пришел запрос get на время')

    let result = []

    for (let i = 0; i < 5; i++){

        const DateNow = new Date().toLocaleString().split(',')[0]

        const dateSplit = DateNow.split('.')

        const day = parseInt(dateSplit[0]) + 1

        const newDate = (day - i) + '.' + dateSplit[1] + '.' + dateSplit[2]

        const data = await sumValuesByDate(newDate)

        const time = (data.totalProblems * 5) + (data.totalContracts * 110) + (data.totalScreenshots * 10)

        result.push(time)
    }

    console.log(result)

    res.send({time:result})
})

app.post('/lists', async (req, res) => {
    const params = req.body
    
    console.log('Запрос post на создание записи')

    Save(Number(params.problems),Number(params.contracts),Number(params.screenshots))

    res.send('Saved to database')
})