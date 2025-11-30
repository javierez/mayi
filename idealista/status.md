idealista status integration - v6.00
Introduction
This document describes idealista's properties status service.

Account creation
You will be provided with an FTP server account (if needed). If you're going to use this service, please notify us to activate the send of the status files.

Data delivery
The process generates a JSON file for every customer and uploads it to an FTP account. If you already use a service to export properties to idealista, we will use the same FTP account used for that service and will upload the status files in a subfolder called 'status'.

File's name contains a unique identification code of the customer (a 43 characters code that begins with 'ilc', ilc000000000000000idealista0000000000000000_yyyyMMdd-HH:mm:ss.SSS.json) and the day and time.

Data format and validation
The fields are described in and can be validated against the following JSON schemas:

customer.json - the main schema to validate the data
property.json
Example
You can find a file example here.

Contact
If you have any question, don't hesitate to let us know: datafeed@idealista.com