# Review of Jonathan Schenker by Collin Jackson

## Overview

*Provide a 1-3 paragraph overview of the architecture of the code and the design rationale.*

<<<<<<< Updated upstream
Example: This code uses the reactor-pattern to dispatch service events to a series of service handlers. The service handler interface is specified as a Java interface allowing users of the application to extend the available services by creating a Java object that implements this interface. An event pre-processor is used to extract the “service type” header from events and then lookup the appropriate service handler using the type name. Service handlers are stored in a central HandlerRegistry and bound to service types, which are strings.

The code’s unit testing methodology is to create one unit test per concrete class. No unit tests are provided for classes that are primarily simple data structures with getters/setters. The unit tests are designed to call each of the methods on the test subject. No apparent boundary value analysis or other approach was used to devise the unit tests.

## Suggested Reading Materials

*Optionally, provide links to any reading materials that you believe would be beneficial to the reviewee.*

Please see Martin Fowler's discussion of Anti Patterns http://martinfowler.com/bliki/AntiPattern.html.

=======
>>>>>>> Stashed changes
## Suggested Improvements

*Provide a list of 5+ aspects of the code that should be improved. Each suggestion for improvement should be accompanied by a GitHub pull request on the reviewee's submission repo that shows how to perform the suggested refactoring. If the change is so substantial that it is "rewriting" the solution, break it down into a series of refactorings that build on each other to improve the solution (each refactoring committed separately and submitted as a pull request with a thorough explanation).*

<<<<<<< Updated upstream
1. There is a bug in the boundary condition checking in the manifold handler. This refactoring describes the issue in detail and provides a proposed fix.
https://github.com/cs4278-2015/assignment2-handin/pull/2
=======
1. The date creation for setting the changelog timestamp can be simplified and improved. Instead of calling the Date class to get the UTC string, creating a Date object with a time of 0, then setting the date using the UTC string, you can simply default construct a Date and pass it to UpdLog. This also alleviates an issue where the year was being stored incorrectly in the changelog.
>>>>>>> Stashed changes
