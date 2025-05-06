const mongoose = require('mongoose');

const DriversSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    phone: {
        type: Number,
        required: true,
    },
    carPlate: {
        type: String,
        required: true,
    },
    carModel: {
        type: String,
        required: true,
    },
    carColor: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    dailyOrderCount: {
        type: Number,
        default: 0,
        required: false
    },
    lastOrderDate: {
        type: Date,
        default: null
    },
    limit: {
        type: Number,
        default: null,
        required: false,
    },
    ratingCount: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 }
    },
    dailyEarnings: {
        type: Number,
        default: 0
    }, 
    atWork: {
        type: Boolean,
        default: false, 
    },
    onOrder: {
        type: Boolean,
        default: false, 
    },
    lastOrderIds: {
        type: [mongoose.Schema.Types.ObjectId], 
        default: [], 
    },

});

module.exports = mongoose.model('Drivers', DriversSchema);
