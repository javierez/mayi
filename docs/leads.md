{
  "openapi": "3.1.0",
  "info": {
    "title": "Leads API",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://leads.gw.fotocasa.pro"
    }
  ],
  "paths": {
    "/v1/publishers/{publisherId}/leads": {
      "get": {
        "tags": ["Leads"],
        "summary": "Finds by dates ranges",
        "operationId": "findLeadsByRange",
        "parameters": [
          {
            "name": "api-key",
            "in": "header",
            "description": "Api key",
            "required": true,
            "explode": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "publisherId",
            "in": "path",
            "description": "The ID of the publisher",
            "required": true,
            "explode": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "from",
            "in": "query",
            "description": "Start date for filtering. Formats: yyyy-MM-dd (2025-02-14) or yyyy-MM-dd HH:mm:ss (2025-02-14 08:13:00)",
            "required": true,
            "explode": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "to",
            "in": "query",
            "description": "End date for filtering. Formats: yyyy-MM-dd (2025-02-14) or yyyy-MM-dd HH:mm:ss (2025-02-14 08:13:00)",
            "required": true,
            "explode": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Lead"
                  }
                }
              }
            }
          },
          "400": {
            "description": "Bad request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Lead not found"
          },
          "500": {
            "description": "Internal server error"
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Lead": {
        "required": ["id", "date", "site", "tpye"],
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "uuid",
            "examples": ["fa7ddb89-9a6e-4f4d-a571-216116866e29"]
          },
          "date": {
            "type": "string",
            "format": "date-time",
            "examples": ["2025-02-26T13:11:00Z"]
          },
          "message": {
            "type": "string",
            "examples": ["Deseo más información del inmueble con referencia: habitaclia/001047"]
          },
          "site": {
            "type": "string",
            "description": "Marketplace",
            "examples": ["FOTOCASA"],
            "enum": ["FOTOCASA", "HABITACLIA", "MILANUNCIOS"]
          },
          "type": {
            "type": "string",
            "examples": ["CALL_TRACKING"],
            "enum": ["PROPERTY", "MINISITE", "PROMOTION", "TYPOLOGY", "CALL_TRACKING"]
          },
          "transactionType": {
            "type": "string",
            "examples": ["BUY"],
            "enum": ["UNDEFINED", "BUY", "RENT", "TRANSFER", "SHARE", "RENT_BUY_OPTION", "VACATION_RENTAL"]
          },
          "reference": {
            "type": "string",
            "examples": ["001047"]
          },
          "contactDetails": {
            "$ref": "#/components/schemas/LeadContactDetail"
          }
        }
      },
      "LeadContactDetail": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "phone": {
            "type": "string"
          },
          "audioUrl": {
            "type": "string"
          },
          "duration": {
            "type": "number"
          },
          "calledPhone": {
            "type": "string"
          },
          "attendedCall": {
            "type": "boolean"
          }
        }
      }
    }
  }
}



Leads API
 1.0.0 
OAS 3.1
https://frtassets.fotocasa.es/ut/texts/en/api-documentation/swagger/swagger-leads.json
Leads


GET
/v1/publishers/{publisherId}/leads
Finds by dates ranges

Parameters
Name	Description
api-key *
string
(header)
Api key

api-key
publisherId *
string
(path)
The ID of the publisher

publisherId
from *
string
(query)
Start date for filtering. Formats: yyyy-MM-dd (2025-02-14) or yyyy-MM-dd HH:mm:ss (2025-02-14 08:13:00)

from
to *
string
(query)
End date for filtering. Formats: yyyy-MM-dd (2025-02-14) or yyyy-MM-dd HH:mm:ss (2025-02-14 08:13:00)

to
Responses
Code	Description	Links
200	
successful operation

Media type

application/json
Controls Accept header.
Example Value
Schema
[
  {
    "id": "fa7ddb89-9a6e-4f4d-a571-216116866e29",
    "date": "2025-02-26T13:11:00Z",
    "message": "Deseo más información del inmueble con referencia: habitaclia/001047",
    "site": "FOTOCASA",
    "type": "CALL_TRACKING",
    "transactionType": "BUY",
    "reference": "001047",
    "contactDetails": {
      "name": "string",
      "email": "string",
      "phone": "string",
      "audioUrl": "string",
      "duration": 0,
      "calledPhone": "string",
      "attendedCall": true
    }
  }
]
No links
400	
Bad request

No links
401	
Unauthorized

No links
404	
Lead not found

No links
500	
Internal server error

No links

Schemas
LeadCollapse allobject
idCollapse allintegeruuid
ExamplesCollapse allarray
#0"fa7ddb89-9a6e-4f4d-a571-216116866e29"
dateCollapse allstringdate-time
ExamplesCollapse allarray
#0"2025-02-26T13:11:00Z"
messageCollapse allstring
ExamplesExpand allarray
siteCollapse allstring
Marketplace

EnumCollapse allarray
#0"FOTOCASA"
#1"HABITACLIA"
#2"MILANUNCIOS"
ExamplesCollapse allarray
#0"FOTOCASA"
typeCollapse allstring
EnumCollapse allarray
#0"PROPERTY"
#1"MINISITE"
#2"PROMOTION"
#3"TYPOLOGY"
#4"CALL_TRACKING"
ExamplesCollapse allarray
#0"CALL_TRACKING"
transactionTypeCollapse allstring
EnumCollapse allarray
#0"UNDEFINED"
#1"BUY"
#2"RENT"
#3"TRANSFER"
#4"SHARE"
#5"RENT_BUY_OPTION"
#6"VACATION_RENTAL"
ExamplesCollapse allarray
#0"BUY"
referenceCollapse allstring
ExamplesCollapse allarray
#0"001047"
contactDetailsCollapse allobject
namestring
emailstring
phonestring
audioUrlstring
durationnumber
calledPhonestring
attendedCallboolean
LeadContactDetailCollapse allobject
namestring
emailstring
phonestring
audioUrlstring
durationnumber
calledPhonestring
attendedCallboolean




