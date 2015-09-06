var _ = require('lodash')

var uris = require("./lib/sync/dropboxuris");

var test = require('./lib/test/expect').test;
var sync = require('./lib/sync/sync');
var Pipeline = require('./lib/sync/pipeline').Pipeline;

var directory1 = "./test-data/folder1";
var directory2 = "./test-data/folder2";

test({name:"Dropbox URIs"}, function(tester){
    tester.expectThat(
        {
            check:function(){
                return uris.getProtocol("foo://asdf.com?asdf3=2")
            },
            expectedValue:"foo",
            msg: "protocols are parsed correctly from full uris"
        }
    ).expectThat(
        {
            check:function(){
                return uris.getProtocol("/foo/bar")
            },
            expectedValue:"file",
            msg: "protocols are defaulted to file if no scheme is present in the uri"
        }
    )
});

test({name:"Sync Module"}, function(tester) {
    tester.expectThat(
        {
            checkAsync: function (cb) {
                sync.compare(directory1, directory2, sync.filesMatchNameAndSize, function(rslt){
                    cb(rslt.directoriesMatch());
                });
            },
            expectedValue: false,
            msg: "Directories with files that are the same name but different sizes shouldn't match"
        }
    ).expectThat(
        {
            checkAsync: function (cb) {
                sync.compare(directory1, directory2, sync.filesMatchName,function(rslt){
                    cb(rslt.directoriesMatch());
                });
            },
            expectedValue: false,
            msg: "Directories with files that are the same name but different sizes should match"
        }
    ).expectThat(
        {
            checkAsync: function (cb) {
                sync.compare(directory1, directory2, sync.filesMatchName,function(rslt){
                    cb(rslt.syncToSrc.length === 1 && rslt.syncToSrc[0] === "test2.txt");
                });
            },
            expectedValue: true,
            msg: "The src should need test2.txt sync'd to it"
        }
    ).expectThat(
        {
            checkAsync: function (cb) {
                sync.compare(directory1, directory2, sync.filesMatchNameAndSize, function(rslt){
                   cb(rslt)
                });
            },
            expectedValue: function (rslt){
                var ignoredInSrc1 = !_.contains(rslt.syncToTrg, "ignoreme.txt");
                var ignoredInSrc2 = !_.contains(rslt.syncToTrg, "samenameignore.txt");
                var ignoredInTrg1 = !_.contains(rslt.syncToSrc, "ignoreme2.txt");
                var ignoredInTrg2 = !_.contains(rslt.syncToSrc, "samenameignore.txt");
                return ignoredInSrc1 && ignoredInSrc2 && ignoredInTrg1 && ignoredInTrg2;
            }
            ,
            msg: "Files that are in _.dropboxignore should be ignored by the program"
        }
    )
});


test({name:"Pipeline Module"}, function(tester) {

        var myPipeline = new Pipeline();
        myPipeline.addAction({
            exec: function (data) {
                return data + 1;
            }
        });

        tester.expectThat(
        {
            check: function () {
                return myPipeline.exec(0);
            },
            expectedValue: function (rslt) {
                var hasResult = (rslt.result);
                var hasHistory = (rslt.history);
                var resultIs1 = rslt.result === 1;
                var historyHas2Items = (rslt.history.length === 2);
                var historyHasCorrectItems = (rslt.history[0] === 0 && rslt.history[1] === 1);

                return hasResult && hasHistory && resultIs1 && historyHas2Items && historyHasCorrectItems;
            },
            msg: "folder1 should need test2.txt and test.txt sync'd to it, but folder2 shouldn't need anything sync'd"
        }
    );
});