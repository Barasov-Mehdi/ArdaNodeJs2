const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // password: { type: String, required: flase },
  tel: { type: String, required: false },
  orders: [{
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiRequest' },
    status: { type: String, default: 'pending' }, // veya 'confirmed', 'completed' gibi durumlar
    createdAt: { type: Date, default: Date.now }
  }] 
});

module.exports = mongoose.model('User', UserSchema);
