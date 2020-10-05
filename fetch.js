import request from 'request';
//import { Parser } from 'json2csv';
import json2csv from 'json2csv';
const { Parser } = json2csv;
const fields = ['Results.Id', 'Results.MlsNumber', 'Id', 'MlsNumber'];
const opts = { fields };

var propertyIds;
var details = [];
request.post('https://api37.realtor.ca/Listing.svc/PropertySearch_Post',
    {
        form: {
            CultureId: 1,
            ApplicationId: 1,
            PropertySearchTypeId: 1,
            HashCode: 0
        }},
    (err, httpResponse, body) => {
        console.log(body);
        try {
            
            var jsonbody = JSON.parse(body);
            // console.log(jsonbody);
            // console.log(jsonbody.Results);
            propertyIds = jsonbody.Results.map(({Id, MlsNumber}) => ({Id, MlsNumber}));
            // console.log(propertyIds);

            //requesting details from second endpoint
            propertyIds.forEach(item => {
                // console.log(item.Id);
                request.get('https://api37.realtor.ca//Listing.svc/PropertyDetails?PropertyId='+item.Id+'&ApplicationId=37&CultureId=1&HashCode=0&ReferenceNumber='+item.MlsNumber,
                (err, httpResponse, body) => {
                    // console.log(body);
                    try{
                        var listing = JSON.parse(body);
                        // console.log(listing);
                        details.push(listing);
                    }catch(e){

                    }
                });
            });
        } catch (e) {
        }
});


