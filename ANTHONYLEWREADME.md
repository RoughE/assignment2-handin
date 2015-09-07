New feature:

Added command line function to email user which files were updated in a given time period.
For example:
    "emailupdates bob@bob.com 15"
    
    This would email bob@bob.com which files were modified in the past 15 hours.

If the number of hours is not specified, it defaults to one day.
For example:
    "emailupdates bob@bob.com"

    This would email bob@bob.com which files were modified in the past 24 hours.