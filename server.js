const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const app = express();
const path = require('path'); // path modülünü ekle
require('dotenv').config();

// Connect Database
connectDB();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // EJS dosyalarının bulunduğu dizin

// Init Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json()); // JSON verileri için
app.use(express.urlencoded({ extended: true }));

// Rotalar
const indexRouter = require('./routes/index'); // indexRouter'ı buraya taşıyoruz
app.use('/', indexRouter); // Ana sayfa rotası



app.get('/register/user', (req, res) => {
    res.render('userRegister');
});

app.get('/register/driver', (req, res) => {
    res.render('driverRegister');
});

app.get('/order/taxi', (req, res) => {
    res.render('taxiOrder'); // taxiOrder.ejs dosyasını render et
});


// Define API Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/taxis', require('./routes/taxis'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/help', require('./routes/helps'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));