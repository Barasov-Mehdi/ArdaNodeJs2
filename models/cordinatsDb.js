const mongoose = require('mongoose');

const coordinateSchema = new mongoose.Schema({
    addressName: {
        type: String,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Coordinate', coordinateSchema);
