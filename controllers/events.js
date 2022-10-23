const express = require('express');

const logger = require('../log/winston');
const Event = require('../models/events');
const User = require('../models/user');
const Order = require('../models/order');

exports.getEvents = (req, res, next) => {
    req.user
        .populate()
        .then(user => {
            Event.find()
                .then((events) => {
                    res.status(200).json({
                        message: "Events fetched!!",
                        data: events,
                        user: user._id
                    })
                });
        })
        .catch(err => {
            console.log(err)
        })

    logger.info("Events fetched");
};

exports.getCart = (req, res, next) => {
    req.user
        .populate()
        .then(user => {
            return products = user.cart.items;
        })
        .then((result) => {
            res.status(200).json({
                message: "Cart Items",
                data: result
            })
        })
        .catch(err => {
            console.log(err)
        })
};

exports.postCart = (req, res, next) => {
    const event_ID = req.body.eventId;

    Event.findById(event_ID)
        .then(event => {
            res.status(201).json({
                message: "Event added to Cart."
            });
            return req.user.addToCart(event);
        })
        .catch(err => {
            console.log(err);
        })
};

exports.deleteCartProduct = (req, res, next) => {
    const event_ID = req.body.eventId;

    req.user
        .removeFromCart(event_ID)
        .then(() => {
            res.status(201).json({
                message: "Item deleted from cart."
            });
        })
        .catch(err => {
            console.log(err);
        })
};

exports.createOrder = (req, res, next) => {
    req.user
        .populate('cart.items.eventId')
        .then(user => {
            const products = user.cart.items.map(i => {
                return {
                    quantity: i.quantity,
                    product: { ...i.eventId._doc }
                }
            });
            const order = new Order({
                user: {
                    name: req.user.name,
                    userId: req.user
                },
                products: products
            });
            return order.save();
        })
        .then(() => {
            return req.user.clearCart();
        })
        .then(() => {
            res.status(201).json({
                message: "Order placed."
            });
        })
        .catch(err => {
            console.log(err);
        })
};

exports.getOrders = (req, res, next) => {
    Order
        .find({ "user.userId": req.user._id })
        .then(orders => {
            res.status(200).json({
                message: "Orders",
                data: orders
            })
        })
        .catch(err => {
            console.log(err);
        })
}