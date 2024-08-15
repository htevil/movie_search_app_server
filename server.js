const express = require('express');
const cors = require('cors');
const fs = require("fs");
const csv = require('csv-parser');
const { parse } = require("csv-parse");
const filePath = 'movies_v2.csv';
const data = [];


fs.createReadStream("./movies_v2.csv")
    .pipe(
        parse({
            delimiter: ",",
            columns: true,
            ltrim: true,
        })
    )
    .on("data", function (row) {
        data.push(row);
    })
    .on("error", function (error) {
        console.log(error.message);
    })
    .on("end", function () {
        console.log("parsed csv data:");
    });

const app = express();
app.use(express.json());
app.use(cors())

app.get('/', (req, res) => {
    res.send('Hello Express app!')
});

app.get('/api/movies', (req, res) => {
    console.log('movies data');
    res.json(data)
});

app.get('/api/movies/search', (req, res) => {
    const query = req.query.search;
    const movie = data.filter(({
            title,
            director,
            writer,
        }) => title.toLowerCase().includes(query.toLowerCase()) ||
        director.toLowerCase().includes(query.toLowerCase()) ||
        writer.split(",").find(title => title.toLowerCase() === query.toLowerCase()));
    res.json(movie);
});

app.get('/api/movies/genres', (req, res) => {
    const genresSet = new Set();
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.genres) {
          try {
            const genres = JSON.parse(row.genres.replace(/'/g, '"'));
            genres.forEach(genre => genresSet.add(genre));
          } catch (e) {
            console.error('Error parsing genres:', e);
          }
        }
      })
      .on('end', () => {
        res.json(Array.from(genresSet).sort());
      })
      .on('error', (err) => {
        res.status(500).json({ error: err.message });
      });
  });

  app.get('/api/movies/filter', (req, res) => {
    const genre = req.query.genre;
    const rating = parseFloat(req.query.rating);

    let filteredMovies = data.filter(({ genres }) => genres.toLowerCase().includes(genre.toLowerCase()));
    filteredMovies = filteredMovies.filter(({ ratings }) => ratings >= rating);
    res.json(filteredMovies);
  });


app.listen(3000, () => {
    console.log('server started');
});

