const express = require('express');

const router = express.Router();

const eventsControlller = require('../controllers/events');

router.get('/', eventsControlller.getEvents);

router.get('/cart', eventsControlller.getCart);

router.post('/cart', eventsControlller.postCart);

router.delete('/cart-delete-item', eventsControlller.deleteCartProduct);

router.post('/create-order', eventsControlller.createOrder);

router.get('/orders', eventsControlller.getOrders);

router.get('/orders/:orderId', eventsControlller.getInvoice);

module.exports = router;