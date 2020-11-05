import request from 'request';
import { parse, Parser } from 'json2csv';
import * as fs from 'fs'

const ws = fs.createWriteStream('out.csv', { flags: 'a' })
const parser = new Parser()

var propertyIds;
var details = [];

// request.post('https://api37.realtor.ca/Listing.svc/PropertySearch_Post',
//     {
//         form: {
//             CultureId: 1,
//             ApplicationId: 1,
//             PropertySearchTypeId: 1,
//             HashCode: 0
//         }},
//     (err, httpResponse, body) => {
//         console.log(body);
//         try {
//
//             var jsonbody = JSON.parse(body);
//             // console.log(jsonbody);
//             // console.log(jsonbody.Results);
//             propertyIds = jsonbody.Results.map(({Id, MlsNumber}) => ({Id, MlsNumber}));
//             // console.log(propertyIds);
//
//             //requesting details from second endpoint
//         } catch (e) {
//         }
// });

async function getPage(number) {
    return new Promise((resolve, reject) => {
        request.post('https://api37.realtor.ca/Listing.svc/PropertySearch_Post',
            {
                form: {
                    CultureId: 1,
                    ApplicationId: 1,
                    PropertySearchTypeId: 1,
                    HashCode: 0,
                    CurrentPage: parseInt(number),
                    ZoomLevel: 11,
                    LatitudeMax: 43.90135,
                    LongitudeMax: -79.05332,
                    LatitudeMin: 43.51420,
                    LongitudeMin: -79.69945,
                    PriceMin: 100000,
                    PriceMax: 1500000,
                    Sort: "6-D",
                    PropertyTypeGroupID: 1,
                    TransactionTypeId: 2,
                }},
            (err, httpResponse, body) => {
                const json = JSON.parse(body).Results;
                resolve(json);
            });
    })
}

function writeCsv(json, showHeaders) {
    const formatted = json.map((u) => {
        return {
            MlsNumber: u.MlsNumber,
            PublicRemarks: u.PublicRemarks,
            Bathrooms: u.Building.BathroomTotal,
            Bedrooms: u.Building.Bedrooms,
            InteriorSize: u.Building.SizeInterior,
            Type: u.Building.Type,
            Ammenities: u.Building.Ammenities,
            Address: u.Property.AddressText,
            Price: u.Property.ConvertedPrice,
            PropertyType: u.Property.Type,
            ParkingSpace: u.Property.ParkingSpaceTotal,
            OwnershipType: u.Property.OwnershipType,
            PostalCode: u.PostalCode,
        };
    });

    const csv = parser.parse(formatted);
    ws.write(csv);
    //console.log(json);
}

function getDetails(propertyIds) {
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
}

fs.unlink('out.csv', (err) => {
    if (err) console.log('file does not exist');
    console.log('out.csv was deleted');
  });

for (let i=1; i < 51; i++) {
    const json = await getPage(i);
    writeCsv(json);
    console.log("Completed: " + i + " requests")
}