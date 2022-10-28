const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ordersSchema = new Schema({
    products: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Event',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        _id: false
    }],
    user: {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    isValid: {
        type: Boolean,
        required: true,
        default: true
    }
}, {
    timestamps: true, 
    versionKey: false
});

module.exports = mongoose.model('Order', ordersSchema);