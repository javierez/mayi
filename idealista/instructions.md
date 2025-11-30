idealista properties integration - v6.00
Introduction
This document describes how to export properties from an external source to idealista website.

Business requirements
Properties must be associated to a specific customer.
Customer needs an active subscription in order to import its properties and advertise them on idealista.
Customer needs an active new development service in order to import its new development properties and advertise them on idealista.
Important: You must contact us for a change of the file version. It is not an automatic process.
To publish their Virtual Tours the customers must contact with their idealista account manager first in order to activate the service. The Virtual Tour providers allowed in idealista are:
3D: Matterport and VistaPlayer3d
Other: Immoviewer, Spectando, Floorplanner, Realisti_co, Goldmark, Floorfy, Fastout, Panotour, Everpano, Toursvirtuales360, KeepEyeOnBall, Inmovilla, Abitarepn, Pano2VR, Plushglobalmedia, Vizor.io, Nodalview, Gothru, Guru360, Creotour, Habiteo, Vitrio, Plug-in.studio, Ppgstudios, 360forcurious, Roundme, Virtualitour, Sircase, Divein.studio, Casagest24, Spherical, Gizmo-3d, Kuula, Emporda360, Vista360, Clicktours, Espaciosvirtuales.es, Cloudpano, Bizionar, Casatour, Casa360.net, Marzipano, iGuide, Realtourvision and Matterport360. If you are sending a VT type different from the ones listed above, contact us to ensure we can process it.
N.B. We do not accept any streaming platform (Youtube, Vimeo, etc), only direct url that would allow us to download and process the file itself.
Data format and validation
A JSON file for every customer has to be sent. Its fields are described in and can be validated against the following JSON schemas:

customer.json - the main schema to validate the data.
address.json
building.json
contact.json
description.json
features.json
garage.json
homes.json
images.json
videos.json
documents.json
virtualtours.json
virtualTour3D.json
virtualTour.json
land.json
offices.json
operation.json
premises.json
property.json
newDevelopment.json
promo.json
typology.json
storage.json
room.json
rules.json
Example
You can find a file example here. You can find a file example for newDevelopment here.

Data delivery and process
The file has to be sent to an FTP account encoded with UTF-8 charset, usually we create one, but you can use your own FTP account. File's name must contain the "customerCode" (the idealista identification code of the customer, a 43 characters code that begins with 'ilc'), but you can add your own customer reference.

You can send as many files as you wish and they will be processed in arrival order. If you have both second hand and new development properties, you can send it in the same file or in separate files, either way we will process it. We check the FTP account every 15 minutes, import the files, do a backup in our servers and delete them from the original FTP account. Please, be certain to use FTP binary transfer mode and do not send image files or any other data to the FTP folder.

The file has to contain every property that the customer would like to publish on our website. We will identify all the changes and process the information.

The properties not sent in the file will be deactivated. If we do not receive any file or if the file received does not contain any property, we will not execute any change (the properties status will be maintained).

You must send files only if any of your properties have been modified or you are creating new ones. Do not send files without any change continuously, otherwise we could block the automatic load. If you prefer that we download your file at a concrete hour instead of every 15 minutes lets us know to set it.

If the same property is going to be listed as both sale and rent, you must send the same information twice (including the propertyCode), only changing the operation type and the price. This will generate two ads but it will only consume one publication slot.

If you are going to start using this service and you have properties previously created on idealista, you will have to send it using the same reference, the same operation type and the same typology that they currently have in order to integrate it in our mass loading process. Otherwise the system won't detect it and they will be deleted and created again, losing its statistics.

Data quality
The more and accurate information you send, the more effectively we can present it to our users and generate qualified traffic to our customers. Moreover, in order to guarantee the quality and the effectiveness of the services provided to our users, keep in mind that the following fields are mandatory:

Price
Constructed area or plot area
Bedrooms value (Spain and Portugal), rooms value (Italy). The only exception to this is that the property is a studio, or the conservation state is "toRestore"
Bathrooms value for housing typologies
It is mandatory at least one of these three combinations in the address fields:
street name and postal code / locality
coordinates (latitude and longitude)
Only for Portugal: postal code with 7 digits
Only for coodinates positioning: if the number of the address is not sent the visibility will never be complete and show only street visibility without number. If the property has been geocoded without number and the number wants to be also displayed it must be sent in file and also be notified to our team so we can force the update of the visibility.
Properties that do not respect these points are filtered out for quality reasons.

Coherence adjustments
We can make small changes in order to improve the quality of the ad, based on the data sent. Here are a summary of the most relevant changes:

If a property doesn't have bathrooms
if constructedArea <= 75, we set bathroom number to 1
if constructedArea > 75, we set bathroom number to 2
If a property doesn't have bedrooms
if constructedArea <= 70, we set room number to 2
if constructedArea > 70, we set room number to 3
If a property doesn't have lift
if there is addressFloor and it is >= 6, we set lift to true
If a property doesn't have constructedArea, we calculate it as usable area + 20% for Spain and Italy or usable area + 15% for Portugal
If a property doesn't have propertyVisibility, we set it to "idealista" by default
If a property doesn't have addressVisibility, we set it to "street" by default
Process feedback
We have two kinds of feedback available:

We can send you an email after every customer import process. This email contains the number of the ads received, processed and deactivated. If you would like to receive this kind of feedback, don't forget to ask for it and specify the email addresses where we should send it.
You can use our properties status service. Please, click here for more information.
Contact
If you would like to activate the export or if you have any question, don't hesitate to let us know: datafeed@idealista.com.

Change Log
22/10/2025
Modified
Max video file size has been raised to 750 MB.
26/08/2025
Added
Property homes feature. Added residentOnly.
11/06/2025
Added
- Property room feature. Added featuresCouplesCosts, featuresRoomArea, featuresHasDesk, featuresHasRoomAirConditioning and featuresHasWashingMachine.
04/04/2025
Added
- Property premises feature. Added featuresReferenceImages for transfers properties.
03/01/2025
Added
- Added short term license national field
03/10/2024
Fixed
- Documentation error corrected for field featuresAreaPlot. Updated range from `integer1to999999999` to `integer1to99999999`.
06/08/2024
Added
- On featuresCurrentOccupation enum (not_free, free, bare_ownership, tenanted), added new value illegally_occupied
05/07/2024
Added
- Property homes features. Added featuresResidential and featuresSeasonalRental
19/03/2024
Added
- Updated premises and transfers fields
21/11/2023
Added
- Property features, new short term fields
11/08/2023
Modified
- Increased max video size to 600MB.
07/06/2023
Modified
- Improved featuresEquippedWithFurniture field description.
04/04/2023
Added
- Image management: added the possibility to load user images to the properties. The formats allowed are JPG, GIF, PNG, and the maximum number of images are 200 per property.
28/03/2023
Fixed
- Fixed propertyAddress and propertyFeatures for newDevelopment required
25/10/2022
Fixed
- Fixed featuresFloorsProperty for premises features
05/08/2022
Modified
- Modified requirement for featuresEquippedWithFurniture and featuresEquippedKitchen. These values are only available for rent operation.
24/06/2022
Added
- Added Ukrainian language for descriptions
30/05/2022
Added
- Added recommended for children and tenant number fields for housing typologies
23/05/2022
Modified
- Modified features Energy Certificate Performance value to 4 digits
- Modified features Energy Certificate Emissions value to 4 digits
03/02/2022
Added
- Added feature bridge crane in premises typology
27/01/2022
Changed
- Marked doorman field as deprecated for housing typologies
25/01/2022
Added
- Added feature loading dock in premises typology
13/12/2021
Added
- Added new fields to indicate if new development typologies are for sale, for rent or for rent to own
10/11/2021
Added
- Added energy certification emissions fields
07/10/2021
Added
- Added new featuresConservation values: "new_development_in_construction" and "new_development_finished". These values are only available for Italy with sale operations.
05/07/2021
Added
- Added feature garage capacity type in garage tipology
- Deprecated feature constructed area in garage tipology, featuresGarageCapacityType now available to indicate the garage capacity type instead of calculate it with the meters.
28/06/2021
Added
- Added new development documents
14/04/2021
Modified
- Modified limits featuresAreaBuildable, featuresAreaConstructed, featuresAreaPlot
08/04/2021
Added
- Added new field addressCasaZoneId. Only available for Italy
05/04/2021
Added
- Added change limit to four digits (min: 1000 - max:2999) for featuresBuiltYear.
22/03/2021
Added
Added casaPropertyCode. This field is to syncrhonize properties with Casa.it if the customer contracts Pack Max to send properties to Casa
23/02/2021
Added
Added new features for sending to Casa.it, only available for Italy. Please refer to each tipology schema to verify which field applies to each of them
featuresConservation: enum new value "fully_reformed" (Nuovo / Completamente ristrutturato).
featuresCurrentOccupation: enum (not_free, free, bare_ownership, tenanted)
featuresGardenType: enum (private, community)
featuresParkingSpaceCapacity: enum (single, double)
featuresParkingSpaceArea: double
featuresOutdoorParkingSpace: boolean
featuresOutdoorParkingSpaceType: enum (covered, uncovered)
featuresOutdoorParkingSpaceNumber: integer
featuresHiddenPrice: boolean (Trattativa riservata)
22/01/2021
Added
Added auction features. Available just for Italy.
05/10/2020
Added
Video management: added the possibility to load user videos to the properties. The formats allowed are AVI, MOV, WMV, MPEG, RM, MP4, FLV, M2T, 3GP, and the maximum number of videos are 6 per property.
21/08/2020
Added
New Price reference index feature: The reference index of rental prices is a compulsory public guidance figure from the Housing Agency of Catalonia (Spain) for the vast majority of its municipalities, indicating the price analysed according to the area and its specific characteristics. The law obliges us to show this index in public listings, so as an advertiser, it is your responsibility to indicate this reference index.
15/06/2020
Added
New Typology Room
24/04/2020
Added
Virtual Tour service publication
07/06/2019
Added
new language available: danish.
13/05/2019
Added
data quality section.
26/04/2019
Added
new languages available: finnish, dutch, polish, romanian and swedish.
11/12/2018
Added
new image tags available.
17/09/2018
Added
featuresAccessType to specify the access type for lands.
29/08/2018
Added
featuresHeatingType to specify the type of heating for homes.
04/12/2017
Inital version