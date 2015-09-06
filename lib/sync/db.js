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
        database: 'user'
    });
    connection.connect();
    query(value, callback);
    connection.end();
}

function addLogin(usernamePassword, queryFinished) {
    connectDb(function (usernamePassword, queryFinished) {
        connection.query('INSERT INTO user VALUES("'+usernamePassword.username+'", "'+usernamePassword.password+'")',
            function (err) {
                if (err) throw err;

                queryFinished(usernamePassword.username);
            });
    }, usernamePassword, queryFinished);
}

function usernameExists(username, queryFinished) {
    connectDb(function (username, queryFinished) {
        connection.query('SELECT username FROM user WHERE username="'+username+'"', function (err, rows) {
            if (err) throw err;

            queryFinished(rows.length > 0);
        })
    }, username, queryFinished)
}

function getPassword(username, queryFinished) {
    connectDb(function (username, queryFinished) {
        connection.query('SELECT * FROM user WHERE username="'+username+'"', function (err, rows) {
            if (err) throw err;

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

module.exports = {
    addLogin: addLogin,
    getPassword: getPassword,
    usernameExists: usernameExists
}