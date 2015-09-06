var nodemailer = require('nodemailer');
var validator = require('validator');

var email = function (emailAddress, emailBody, callback) {

    if (!emailAddress || !validator.isEmail(emailAddress)) {
        return callback('Invalid email.');
    }

    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'cs4278dropbox@gmail.com',
            pass: 'cs4278cs4278'
        }
    });

    var mailOptions = {
        from: 'CS4278-DropBox <cs4278dropbox@gmail.com>',
        to: emailAddress,
        subject: 'Dropbox Update',
        text: emailBody
    };

    transporter.sendMail(mailOptions, function (error, info) {
        return callback(error);
    });
};

module.exports = {
    email : email
};