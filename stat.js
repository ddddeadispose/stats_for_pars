const express = require('express')
const app = express()
const PORT = process.env.PORT || 7453

app.use(express.json())

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
      const regex = new RegExp(`^${date}`, 'i')
  
      const aggregationResult = await Line.aggregate([
        { $match: { date: { $regex: regex } } },
        {
          $group: {
            _id: null,
            totalProblems: { $sum: "$problems" },
            totalContracts: { $sum: "$contracts" },
            totalScreenshots: { $sum: "$screenshots" }
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

    const result = await sumValuesByDate('10.08.2023')
    console.log(result)
    res.send(result)
})

app.post('/lists', async (req, res) => {
    const params = req.body
    
    console.log('Запрос post на создание записи')

    Save(Number(params.problems),Number(params.contracts),Number(params.screenshots))

    res.send('Saved to database')
})