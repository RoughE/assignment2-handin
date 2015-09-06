# Review of Jonathan Schenker by Collin Jackson

## Overview

*Provide a 1-3 paragraph overview of the architecture of the code and the design rationale.*

## Suggested Improvements

*Provide a list of 5+ aspects of the code that should be improved. Each suggestion for improvement should be accompanied by a GitHub pull request on the reviewee's submission repo that shows how to perform the suggested refactoring. If the change is so substantial that it is "rewriting" the solution, break it down into a series of refactorings that build on each other to improve the solution (each refactoring committed separately and submitted as a pull request with a thorough explanation).*

1. The date creation for setting the changelog timestamp can be simplified and improved. Instead of calling the Date class to get the UTC string, creating a Date object with a time of 0, then setting the date using the UTC string, you can simply default construct a Date and pass it to UpdLog. This also alleviates an issue where the year was being stored incorrectly in the changelog.

2. When updating the changelog, the file path that is being copied from is passed to `UpdLog`, instead of the file path that is being copied to.
