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

// routes/users.js
router.post('/register', async (req, res) => {
  const { name, email, tel } = req.body;

  try {
    // Aynı email veya telefon var mı kontrol et
    const existingUser = await User.findOne({ 
      $or: [{ email: email }, { tel: tel }]
    });

    if (existingUser) {
      // Aynı email veya telefon zaten kayıtlı ise hata döndür
      return res.status(400).json({ msg: 'Bu email veya telefon numarası zaten kullanılıyor.' });
    }

    // Yeni kullanıcı oluştur
    const user = new User({
      name,
      email,
      tel,
    });

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
        if (err) {
          console.error('JWT imzalama hatası:', err);
          return res.status(500).json({ msg: 'JWT imzalama hatası' });
        }
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Kayıt sırasında hata:', err);
    res.status(500).json({ msg: 'Sunucu hatası' });
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
