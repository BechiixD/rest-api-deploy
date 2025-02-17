const express = require('express')
const crypto = require('node:crypto')
const movies = require('./movies.json')
const cors = require('cors')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.use(express.json())
app.use(cors())
// app.use(cors({
//   origin: (origin, callback) => {
//     const ACCEPTED_ORIGINS = [
//       'http://localhost:3000',
//       'http://localhost:3001',
//       'https://myapp.com'
//     ]

//     if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
//       callback(null, true)
//     }

//     return callback(new Error('Not allowed by CORS'))
//   }}
// ))
app.disable('x-powered-by')

const ACCEPTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://myapp.com'
  ]

app.get('/', (req, res) => {
  res.json({message: 'Hello World'})
})

// Todos los recrsos MOVIES se identifican con /movies
app.get('/movies', (req, res) => {
  // const origin = req.header('origin')
  // // Cuando es del mismo ORIGIN, no se envia el header
  // if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
  //   res.header('Access-Control-Allow-Origin', '*')
  // }
  
  res.header('Access-Control-Allow-Origin', '*')

  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(movie => 
      movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )
    res.json(filteredMovies)
  }
  res.json(movies)
})

app.get('/movies/:id', (req, res) => { // path-to-regexp
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)

  res.status(404).json({message: 'Movie not found'})
})

app.post('/movies', (req, res) => {

  const result =  validateMovie(req.body)
 
  if (result.error) {
    // 422 Unprocessable Entity
    return res.status(400).json({error: JSON.parse(result.error.message)})
  }

  const newMovie = {
    id: crypto.randomUUID(), // UUID v4
    ...result.data // Todos los datos validados, sino no hacer de esta manera
  }

  // Esto no es REST, xq guardamos el estado en memoria
  movies.push(newMovie)

  res.status(201).json(newMovie) // Actualizar cache del cliente

})

app.delete('/movies/:id', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex < 0) {
    return res.status(404).json({message: 'Movie not found'})
  }

  movies.splice(movieIndex, 1)

  return res.json({message: 'Movie deleted'})
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)
  
  if (result.error) {
    return res.status(400).json({error: JSON.parse(result.error.message)})
  }

  const {id} = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex < 0) {
    return res.status(404).json({message: 'Movie not found'})
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

app.options('/movies/:id', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH')
  res.send(200)
})

const PORT = process.env.PORT ?? 1234

// app.listen(PORT, () => {
//   console.log(`Server running on port http://localhost:${PORT}`)
// })

module.exports = app