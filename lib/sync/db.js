/**
 * Created by tommy on 9/5/15.
 */

var mysql = require('mysql');
var connection;

function connectDb(query, value, callback) {
    connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'dropbox_users'
    });
    connection.connect();
    query(value, callback);
    connection.end();
}

function addLogin(usernamePassword, queryFinished) {
    connectDb(function (usernamePassword, queryFinished) {
        connection.query('INSERT INTO users VALUES("'+usernamePassword.username+'", "'+usernamePassword.password+'")',
            function (err) {
                if (err) {
                    handleError(err);
                }

                queryFinished(usernamePassword.username);
            });
    }, usernamePassword, queryFinished);
}

function usernameExists(username, queryFinished) {
    connectDb(function (username, queryFinished) {
        connection.query('SELECT username FROM users WHERE username="'+username+'"', function (err, rows) {
            if (err) {
                handleError(err);
            }

            queryFinished(rows.length > 0);
        })
    }, username, queryFinished)
}

function getPassword(username, queryFinished) {
    connectDb(function (username, queryFinished) {
        connection.query('SELECT * FROM users WHERE username="'+username+'"', function (err, rows) {
            if (err) {
                handleError(err);
            }

            var password;
            if (rows.length != 0) {
                password = rows[0].password;
            }
            var login = {
                username: username,
                password: password
            }
            queryFinished(login);
        });
    }, username, queryFinished);
}

function handleError(err) {
    if (err.message == 'connect ECONNREFUSED') {
        console.log('\nCannot connect to MySQL. Please check that MySQL is installed.')
        process.exit();
    } else {
        throw err;
    }
}

module.exports = {
    addLogin: addLogin,
    getPassword: getPassword,
    usernameExists: usernameExists
}