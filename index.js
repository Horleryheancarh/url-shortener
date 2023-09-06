require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const shortId = require('shortid');
const validUrl = require('valid-url');

// Basic Configuration
const app = express();

const port = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use('/public', express.static(`${process.cwd()}/public`));

// Database Connection
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
});
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log('MongoDB database connection establiished successfully');
});

// Database Model
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});
const URL = mongoose.model('URL', urlSchema);

// Routes
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async (req, res) => {
  const url = req.body.url;

  if (!validUrl.isWebUri(url)) {
    return res.status(401).json({
      error: 'invalid url'
    });
  }

  try {
    let nUrl = await URL.findOne({ original_url: url });

    if (nUrl) {
      return res.json({
        original_url: nUrl.original_url,
        short_url: nUrl.short_url
      });
    }

    nUrl = new URL({
      original_url: url,
      short_url: shortId.generate()
    });
    await nUrl.save();

    return res.json({
      original_url: nUrl.original_url,
      short_url: nUrl.short_url
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json('Server error...');
  }
})

app.get('/api/shorturl/:url', async (req, res) => {
  try {
    const short_url = req.params.url;

    const nUrl = await URL.findOne({ short_url });

    if (nUrl) {
      res.redirect(nUrl.original_url);
    } else {
      return res.status(404).json('No URL Found');
    }
  } catch (err) {
    console.log(err);
    res.status(500).json('Server error...');
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
