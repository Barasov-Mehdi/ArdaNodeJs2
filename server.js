const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const app = express();
const path = require('path'); 
require('dotenv').config();

connectDB();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 

app.use(cors());
app.use(express.static('public'));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

const indexRouter = require('./routes/index'); 
app.use('/', indexRouter); 

app.get('/register/user', (req, res) => {
    res.render('userRegister');
});

app.get('/register/driver', (req, res) => {
    res.render('add-coordinates');
});

app.get('/order/taxi', (req, res) => {
    res.render('taxiOrder'); 
});

app.get('/add-coordinates', (req, res) => {
    res.render('addCoordinates'); // views/addCoordinates.ejs dosyasını göstermek için
});


app.use('/api/users', require('./routes/users'));
app.use('/api/taxis', require('./routes/taxis'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/help', require('./routes/helps'));
app.use('/api/coordinates', require('./routes/cordinatsRoutes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));