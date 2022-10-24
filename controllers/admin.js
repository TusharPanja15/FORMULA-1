const express = require('express');

const logger = require('../log/winston');
const Event = require('../models/events');

exports.postEvent = async (req, res, next) => {
    const eventRoundNo = req.body.eventRoundNo;
    const eventName = req.body.eventName;
    const eventLocation = req.body.eventLocation;
    const subEvents = req.body.subEvents;
    const eventDate = req.body.eventDate;

    const event = new Event({
        eventRoundNo: eventRoundNo,
        eventName: eventName,
        eventLocation: eventLocation,
        subEvents: subEvents,
        eventDate: eventDate
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