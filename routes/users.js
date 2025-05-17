const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
// routes/users.js

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Register User
router.post('/register', async (req, res) => {
  console.log(req.body); // İstek gövdesini konsola yazdır
  const { name, email, password, tel } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      // Kullanıcı var ise, hata mesajı ile kayıt sayfasına döner
      return res.render('register', { errorMessage: 'Kullanıcı mevcut. Lütfen başka bir email deneyin.' });
    }

    user = new User({
      name,
      email,
      tel,
      password
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    // Sunucu hatası olursa, hata mesajı ile kayıt sayfasına döner
    res.render('register', { errorMessage: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { email, tel } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Email tapılmadı' });
    }

    // Check if tel matches
    if (user.tel !== tel) {
      return res.status(400).json({ msg: 'Yanlış telefon nömrəsi' });
    }

    // Return JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// if not, you might want to add that or define how you get the user location
router.get('/current-location', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('coordinates'); // Adjust based on your model
    if (!user || !user.coordinates) {
      return res.status(404).json({ msg: 'Kullanıcı koordinatları bulunamadı.' });
    }
    res.json(user.coordinates); // Sending back the coordinates
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});



module.exports = router;
