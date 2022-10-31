const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');

const logger = require('../log/winston');
const User = require('../models/user');
const Order = require('../models/order');
const Event = require('../models/events');
const mailer = require('../utils/mailer');
const qrCode = require('../utils/QRCode');

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

            if (!event) {
                const error = new Error('could not found event to add in cart.');
                error.statusCode = 404;
                throw error;
            }

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
        //const event_ID = req.body.eventId;
        try {
            // await req.user.removeFromCart(event_ID);
            await req.user.clearCart();

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
        const id = req.params.orderId;

        try {
            const order = await Order.findOne({ _id: id });

            console.log(order)

            if (!order) {
                const error = new Error('no Order found!');
                error.statusCode = 401;
                throw error;
            }

            const invoiceName = 'invoice-' + order._id + '.pdf';
            const invoicePath = path.join('data', 'invoices', invoiceName);
            const QRImageName = 'QR-' + order._id + '.png';
            const QRImagePath = path.join('data', 'images', QRImageName);

            await qrCode.generate(
                QRImagePath,
                JSON.stringify({
                    name: req.user.name,
                    userId: req.user.email,
                    ticketId: order._id
                }));

            let pdfDoc = new PDFDocument({
                size: [300, 500],
                margins: { top: 10, bottom: 10, left: 10, right: 10 }
            })

            let pdfBackgroundColor = 'black';

            pdfDoc.pipe(fs.createWriteStream(invoicePath));

            pdfDoc.rect(0, 0, 1000, 1000).fill(pdfBackgroundColor);  // outer-rect
            pdfDoc.roundedRect(25, 25, 250, 450, 5).fill('white');  // inner-rect

            pdfDoc
                .image(path.join('data', 'images', 'formula1.png'), 35, 35, {
                    fit: [100, 100],
                    align: 'center',
                    valign: 'center'
                });  // Logo image

            pdfDoc
                .image(path.join('data', 'images', 'fia-road-safety.png'), 35, 90, {
                    fit: [100, 100],
                    align: 'center',
                    valign: 'center'
                });  // Logo image 2

            pdfDoc
                .fontSize(15)
                .font('Courier-Bold')
                .fill('black')
                .text(order.products[0].product.eventName, 140, 80, {
                    height: 100,
                    width: 150
                });  // event-name

            pdfDoc
                .fontSize(10)
                .font('Courier')
                .fill('black')
                .text('Venue Date', 50, 200, {
                    height: 10,
                    width: 100
                });  // event-date-time-header

            pdfDoc
                .fontSize(22)
                .font('Helvetica-Bold')
                .fill('black')
                .text(order.products[0].product.eventDate, 50, 220, {
                    height: 10,
                    width: 100
                });  // event-date-time

            pdfDoc
                .fontSize(10)
                .font('Courier')
                .fill('black')
                .text('Entry Gate', 170, 200, {
                    height: 10,
                    width: 100
                });  // event-location-header

            pdfDoc
                .fontSize(22)
                .font('Helvetica-Bold')
                .fill('black')
                .text('6D', 170, 220, {
                    height: 10,
                    width: 100
                });  // event-location

            pdfDoc.circle(26, 190, 10).fill(pdfBackgroundColor);  // left-top
            pdfDoc.circle(26, 250, 10).fill(pdfBackgroundColor);  // left-bottom
            pdfDoc.circle(274, 190, 10).fill(pdfBackgroundColor);  // right-top
            pdfDoc.circle(274, 250, 10).fill(pdfBackgroundColor);  // right-bottom

            pdfDoc.moveTo(37, 190).lineTo(265, 190).dash(2, { space: 3 }).stroke('grey');  // horizontal-dashed
            pdfDoc.moveTo(160, 240).lineTo(160, 195).dash(2, { space: 3 }).stroke('grey');  // vertical-dashed
            pdfDoc.moveTo(37, 250).lineTo(265, 250).dash(2, { space: 3 }).stroke('grey');  // horizontal-dashed

            pdfDoc.image(QRImagePath, 75, 285, { fit: [150, 150], align: 'center', valign: 'center' });  // QR image
            pdfDoc
                .fontSize(10).font('Courier').fill('black').text(order._id, 79, 446, {
                    height: 10,
                    width: 150,
                });  // QR-code id

            pdfDoc
                .fontSize(7)
                .font('Helvetica')
                .fill('white')
                .text('Formula 1 Company. All rights reserved', 90, 485, {
                    height: 10,
                    width: 200
                });  // footer

            pdfDoc
                .rotate(270, { origin: [100, 190] })
                .fontSize(7)
                .font('Helvetica-BoldOblique')
                .fill('white').text('***For development purposes only', -10, 100, {
                    height: 400,
                    width: 450,
                    characterSpacing: 1
                });  // side-disclamer

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
            });

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