const express = require('express');

const logger = require('../log/winston');
const Event = require('../models/events');
const User = require('../models/user');
const Order = require('../models/order');

exports.getEvents = async (req, res, next) => {
    try {
        const user = await req.user.populate();
        const events = await Event.find();

        res.status(200).json({
            message: "Events fetched!!",
            data: events,
            user: user._id
        });
        
        logger.info("Events fetched");
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.getCart = async (req, res, next) => {
    try {
        const user = await req.user.populate();
        const products = await user.cart.items;

        res.status(200).json({
            message: "Cart Items",
            data: products
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.postCart = async (req, res, next) => {
    const event_ID = req.body.eventId;

    try {
        const event = await Event.findById(event_ID);
        await req.user.addToCart(event);

        res.status(201).json({
            message: "Event added to Cart."
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.deleteCartProduct = async (req, res, next) => {
    const event_ID = req.body.eventId;
    try {
        await req.user.removeFromCart(event_ID);

        res.status(201).json({
            message: "Item deleted from cart."
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.getOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ "user.userId": req.user._id });

        res.status(200).json({
            message: "Orders",
            data: orders
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.createOrder = async (req, res, next) => {
    try {
        const user = await req.user.populate('cart.items.eventId');

        if (user.cart.items.length == 0) {
            throw new Error('no cart items')
        }

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

        await order.save();
        await req.user.clearCart();

        res.status(201).json({
            message: "Order placed."
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};