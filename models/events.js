const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const eventsScema = new Schema({
    eventRoundNo: {
        type: Number,
        required: true
    },
    eventName: {
        type: String,
        required: true
    },
    eventLocation: {
        type: String,
        required: true
    },
    subEvents: {
        raceWeekend: [{
            title: {
                type: String,
                required: true
            },
            date: {
                type: String,
                required: true
            },
            _id: false
        }]
    },
    eventDate: {
        type: String,
        required: true
    },
    eventStartDate: {
        type: Date,
        required: true
    },
    eventEndDate: {
        type: Date,
        required: true
    }
}, {
    timestamps: true, 
    versionKey: false
});

module.exports = mongoose.model('Event', eventsScema);