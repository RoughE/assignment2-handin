/**
 * Created by chrissu on 9/3/15.
 */

var fs = require('fs');
var Twit = require('twit');

var TwitterApp = new Twit({
    consumer_key:         'lF0toTHTD5BQxbvrfoy87scqz'
    , consumer_secret:      'ERq30rIPQlouR0qpNKrYDudsdpIzplmTxeAhz9C5RivmovZ8bK'
    , access_token:         '3529755022-pSnr3zgRME4H1jK7hR6s109LCg1Ace8205EnmCO'
    , access_token_secret:  'xjmXeXsigPoDBYFY6ZGMDPKds0wQibf8iOZ599k1cs0R1'
})

//Upload media to Twitter

//The image passed should be the raw binary of the image or binary base64 encoded
var mediaContent= fs.readFileSync('clock.png', { encoding: 'base64' })

TwitterApp.post('media/upload', { media_data: mediaContent }, function (err, data, response) {

    var mediaIdStr = data.media_id_string
    console.log(mediaIdStr)
    console.log(data)
    var params = { media_ids: [mediaIdStr]}

    TwitterApp.post('statuses/update', params, function (err, data, response) {
        console.log(data)
    })
})