var fs = require('fs');
var emailer = require('./emailer');

var checkUpdates = function(path, hours, callback){
    var changedFileList = [];
    var millisInHour = 3600000;
    var now = (new Date()).getTime();
    var startTime = now - (millisInHour * hours);

    fs.readdir(path, function (error, fileList){
        if (error){
            return callback(error);
        }

        for (var file in fileList){
            var filename = path + '/' + fileList[file];
            var stats = fs.statSync(filename);

            var modifiedTime = stats.mtime.getTime();
            if (modifiedTime >= startTime){
                changedFileList.push(filename);
            }
        }

        return callback(null, changedFileList);
    });
};

var createEmailBody = function (changedFileList, hours){
    var correctUsageOfHours = ' hours';
    if (hours === 1) {
        correctUsageOfHours = ' hour';
    }

    var body = 'There were no updated files in the past ' + hours + correctUsageOfHours + '.\n';

    if (changedFileList.length > 0){
        body = 'These files were updated in the past ' + hours + correctUsageOfHours + ':\n\n';

        for (var file in changedFileList){
            body += changedFileList[file];
            body += '\n';
        }
    }

    body += '\nSincerely,\nCS4278 Dropbox Team';

    return body;
};

var emailUpdates = function(path, emailAddress, hours){
    checkUpdates(path, hours, function (error, changedFileList){
        if (error){
            console.error(error);
            return;
        }

        var emailBody = createEmailBody(changedFileList, hours);

        emailer.email(emailAddress, emailBody, function (err){
            if (err){
                if (err === 'Invalid Email.'){
                    console.log('Invalid Email.');
                    return;
                }

                console.error(err);
            } else {
                console.log('Email successfully sent to ' + emailAddress + '.');
            }
        });
    });
};

module.exports = {
    emailUpdates : emailUpdates
};