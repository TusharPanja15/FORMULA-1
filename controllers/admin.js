const express = require('express');

const logger = require('../log/winston');
const Event = require('../models/events');
const Order = require('../models/order');

exports.postEvent = async (req, res, next) => {
    const eventRoundNo = req.body.eventRoundNo;
    const eventName = req.body.eventName;
    const eventLocation = req.body.eventLocation;
    const subEvents = req.body.subEvents;
    const eventDate = req.body.eventDate;
    const eventStartDate = req.body.eventStartDate;
    const eventEndDate = req.body.eventEndDate;

    const event = new Event({
        eventRoundNo: eventRoundNo,
        eventName: eventName,
        eventLocation: eventLocation,
        subEvents: subEvents,
        eventDate: eventDate,
        eventStartDate: eventStartDate,
        eventEndDate: eventEndDate
    });

    try {
        await event.save();

        const response = {
            responseCode: 201,
            message: 'Event added successfully',
            eventData: event
        };

        res.status(201).json(response);
        logger.info(JSON.stringify(response));
    } catch (err) {
        const response = {
            responseCode: 401,
            message: 'Cound not add event'
        }

        res.status(401).json(response);
        logger.error(err);
        logger.error(JSON.stringify(response));
    }
};

exports.check_qrcode = async (req, res, next) => {
    const date = new Date();
    const orderId = req.body.ticketId;

    try {
        const ticket = await Order.findById(orderId);

        if (!ticket) {
            const error = new Error('Invaild Ticket Code!');
            error.statusCode = 404;
            throw error;
        } else if (!ticket.isValid) {
            const error = new Error('Ticket Code already used!');
            error.statusCode = 401;
            throw error;
        }

        const event = await Event.findById(ticket.products[0].product);

        if (date < event.eventStartDate || date > event.eventEndDate) {
            const error = new Error('Ticket unauthorized to use!');
            error.statusCode = 401;
            throw error;
        }

        res.status(200).json({
            message: "Ticket found",
            data: ticket
        });

        ticket.isValid = false;
        ticket.save();
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};