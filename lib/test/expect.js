var _ = require('lodash')

function test(config,theTest) {

    var name = config.name || "Unnamed Test"
    var before = config.before || function(){};
    var after = config.after || function(){};

    console.log("---- Testing: "+name);

    var testNumber = 1;

    function expectThat(test) {
        var check = test.check;
        var async = test.checkAsync;
        var expectedValue = test.expectedValue;
        var msg = test.msg;

        var exception = null;
        var actualValue = null;

        before();

        var rsltFetcher = function(cb){
            if(check){
                actualValue = check();
                cb(actualValue);
            }
            else if(async){
                async(cb);
            }
            else {
                throw "No check method was defined for the test: "+test.msg;
            }
        }

        var rsltChecker = function(actualValue){
            try {

                if (_.isFunction(expectedValue)) {
                    actualValue = expectedValue(actualValue);
                    expectedValue = true;
                }

            } catch (ex) {
                exception = ex;
            }

            after();

            if (!exception && (expectedValue === actualValue)) {
                console.log("Test " + testNumber + " ["+ msg + "]: passed");
            }
            else if (exception) {
                console.log("Test " + testNumber + " ["+ msg + "]: failed");
                console.log("At: " + exception.stack);
            }
            else {
                console.log("Test " + testNumber + " ["+ msg + "]: failed");
            }
        };

        testNumber++;

        rsltFetcher(rsltChecker);

        return tester;
    }

    var tester = {
        before:function(func){
            before = func;
            return tester;
        },
        after:function(func){
            after = after;
            return tester;
        },
        expectThat:expectThat
    }

    theTest(tester);
}

module.exports = {
    test:test
}