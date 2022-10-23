const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const CronJob = require('cron').CronJob;

const logger = require('./log/winston');

const eventRoute = require('./routes/events');
const adminRoute = require('./routes/admin');
const User = require('./models/user');

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.qvv5l.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

console.log(process.env.NODE_ENV)

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use((req, res, next) => {
    User.findById("62a8330c98456e8cba648ed5")
    .then(user => {
        req.user = user;
        next();
    })
    .catch(err => {
        logger.error(err);
    })
});

app.use('/events', eventRoute);
app.use('/admin', adminRoute);

// var job = new CronJob('* * * * * *', () => {
// 		console.log('You will see this message every second');
// 	},
// 	null,
// 	true,
// 	'Asia/Kolkata'
// );

// job.start();

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        User.findOne()
        .then(user => {
            if (!user) {
                const user = new User({
                    name: 'raj',
                    email: 'raj@raj.com',
                    cart: {
                        items: []
                    }
                })
                user.save()
            }
        })
        app.listen(process.env.PORT || 8888);
        // logger.info("Connected!!!");
    })
    .catch(err => {
        logger.error(err);
    })