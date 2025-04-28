const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tel: { type: String, required: false }, // `tel` alanını ekleyin
});

module.exports = mongoose.model('User', UserSchema);
