/**
 * Created by chrissu on 9/3/15.
 */
var FB = require('fb');

var FB = require('fb');
FB.setAccessToken('CAACEdEose0cBAEVBgHMLSKVtWSHvxQtVXpRNyKODi3ZAyZAk9SMX8LcCM3DHlDgwJJMKdwvFY23hy9WYAep7DW0idae65JUmvYDZB1cZC81nrbqAOAjpaS7z0pia1nGBeCMRFRayLSi4dXsiLWKF5TUb5WerdkcHeu6DtrM8p2Qz47BCDmTnVMRTStkZBd5yZBoGBUnSkeZBQZDZD');

var body = 'My first post using facebook-node-sdk';
FB.api('me/feed', 'post', { message: body}, function (res) {
    if(!res || res.error) {
        console.log(!res ? 'error occurred' : res.error);
        return;
    }
    console.log('Post Id: ' + res.id);
});