const mongoose = require('mongoose');
const taxiRequestSchema = new mongoose.Schema({
  currentAddress: {
    text: { type: String, required: true },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false }
  },
  destinationAddress: {
    text: { type: String, required: true },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false }
  },
  destination2: {
    text: { type: String, required: false },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false }
  },
  additionalData: {
    type: Boolean,
    required: false
  },
  handleConfirmOrder: {
    type: Boolean,
    required: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    type: Number, // Price set by the driver
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: false
  },
  driverDetails: {
    id: { type: String, required: false },
    firstName: { type: String, required: false },
    carPlate: { type: String, required: false },
    carModel: { type: String, required: false },
    carColor: { type: String, required: false },
    phone: { type: String, required: false }
  },
  date: {
    type: Date,
    default: Date.now
  },
  isTaken: {
    type: Boolean,
    default: false // Başlangıçta alınmamış olarak işaretlenecek.
  },
  tel: {
    type: String,
    required: true // Telefon numarasının gerekli olduğunu belirtiyoruz
  },
  name: {
    type: String,
    required: true // Telefon numarasının gerekli olduğunu belirtiyoruz
  },
  isConfirmed: {
    type: Boolean,
    default: false // Onaylanmamış olarak başlangıçta ayarlanır
  },
  time: {
    type: String,
    required: false // Telefon numarasının gerekli olduğunu belirtiyoruz
  },
  additionalInfo: {
    type: String,
    required: false
  },
  isFinished: { 
    type: Boolean,
    default: false 
  },

});

module.exports = mongoose.model('TaxiRequest', taxiRequestSchema);
