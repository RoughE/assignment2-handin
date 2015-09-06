var nodemailer = require('nodemailer');
var validator = require('validator');

var email = function (emailAddress, changedFileList) {

    if (!emailAddress || !validator.isEmail(emailAddress)) {
        console.log('No valid email found.');
    }

    var body = 'There were no updated files in the past 24 hours';

    if (changedFileList.length > 0){
        body = 'These files were changed today: \n';
        for (var file in changedFileList){
            body += file;
            body += '\n';
        }
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
        subject: '24 Hour Update',
        text: body
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return console.error(error);
        }

        console.log('Email successfully sent to ' + emailTarget + '.');
    });
};

module.exports = {
    email : email
};