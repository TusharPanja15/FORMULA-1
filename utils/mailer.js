const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PASS
    }
});

module.exports = {
    sendMailToCustomer: async ({ to, subject, html, attachement }) => {
        console.log(to);
        try {
            return transporter.sendMail({
                to: to,
                from: process.env.EMAIL_ID,
                subject: subject,
                html: html,
                attachments: [attachement]
            });
        } catch (err) {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        }
    }
};