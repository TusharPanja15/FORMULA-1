const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');

const logger = require('../log/winston');
const User = require('../models/user');
const Order = require('../models/order');
const Event = require('../models/events');
const mailer = require('../utils/mailer');
const qrCode = require('../utils/QRCode');

const pdfDoc = new PDFDocument();

module.exports = {
    getEvents: async (req, res, next) => {
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
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        }
    },

    getCart: async (req, res, next) => {
        try {
            const user = await req.user.populate();
            const products = await user.cart.items;

            res.status(200).json({
                message: "Cart Items",
                data: products
            });
        } catch (err) {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        }
    },

    postCart: async (req, res, next) => {
        const event_ID = req.body.eventId;

        try {
            const event = await Event.findById(event_ID);
            await req.user.addToCart(event);

            res.status(201).json({
                message: "Event added to Cart."
            });
        } catch (err) {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        }
    },

    deleteCartProduct: async (req, res, next) => {
        const event_ID = req.body.eventId;
        try {
            await req.user.removeFromCart(event_ID);

            res.status(201).json({
                message: "Item deleted from cart."
            });
        } catch (err) {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        }
    },

    getOrders: async (req, res, next) => {
        try {
            const orders = await Order.find({ "user.userId": req.user._id });

            res.status(200).json({
                message: "Orders",
                data: orders
            });
        } catch (err) {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        }
    },

    createOrder: async (req, res, next) => {
        try {
            const user = await req.user.populate('cart.items.eventId');

            if (user.cart.items.length == 0) {
                const error = new Error('no cart items found.');
                error.statusCode = 404;
                throw error;
            }

            const products = user.cart.items.map(i => {
                return {
                    quantity: i.quantity,
                    product: { ...i.eventId._doc }
                }
            });

            const order = new Order({
                user: {
                    userId: req.user
                },
                products: products
            });

            await order.save();
            await req.user.clearCart();

            res.status(201).json({
                message: "Order placed.",
                data: {
                    orderId: order.id
                }
            });
        } catch (err) {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        }
    },

    getInvoice: async (req, res, next) => {
        try {
            const id = req.params.orderId;
            const order = await Order.findOne({ _id: id });

            console.log(order)

            if (!order) {
                const error = new Error('no Order found!');
                error.statusCode = 401;
                throw error;
            }

            const QRdata = JSON.stringify({
                name: req.user.name,
                userId: req.user.email,
                ticketId: order._id
            });

            const invoiceName = 'invoice-' + order._id + '.pdf';
            const invoicePath = path.join('data', 'invoices', invoiceName);
            const QRImageName = 'QR-' + order._id + '.png';
            const QRImagePath = path.join('data', 'images', QRImageName);

            await qrCode.generate(QRImagePath, QRdata);

            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.image(QRImagePath, 0, 15, { fit: [200, 200], align: 'center', valign: 'center' });
            pdfDoc.end();

            await mailer.sendMailToCustomer({
                to: process.env.TEST_EMAIL,
                subject: `[ ORDER_ID: ${order._id} ] has been created!`,
                html: `
                    <h5>Hi ${req.user.name},</h5>
                    <p>Thanks for shopping with us!</p>
                    <p>Your order with id '${order._id}' has been placed successfully.</p>
                    <p>Please find the invoice attached to your order and enjoy your weekend with us.</p>
                    <h5>Thanks and Regards,</h5>
                    <h5>FIA</h5>
                `,
                attachement: {
                    filename: invoiceName,
                    path: invoicePath
                }
            })

            res.status(201).json({
                message: `Mail sent to '${process.env.TEST_EMAIL}'`
            });
        } catch (err) {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        }
    }
};