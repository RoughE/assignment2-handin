var nodemailer = require('nodemailer');
var validator = require('validator');

var email = function (emailAddress, changedFileList, callback) {

    if (!emailAddress || !validator.isEmail(emailAddress)) {
        callback('No valid email found.');
    }

    var body = 'There were no updated files in the past 24 hours';

    if (changedFileList.length > 0){
        body = 'These files were changed today: \n\n';

        for (var file in changedFileList){
            body += changedFileList[file];
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
        callback(error);
    });
};

module.exports = {
    email : email
};