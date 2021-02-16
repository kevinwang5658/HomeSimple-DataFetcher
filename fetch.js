import request from 'request';
import { parse, Parser } from 'json2csv';
import * as fs from 'fs'
import * as ImageDownloader from 'image-downloader';

const LOCAL_LOGIC_API_KEY = "f50e4e0998d261cd78160bb80709ceb785cc18556729dd737771c0cbcb54ffd5644455cf1df300499b"

const BRADLEY_PARAMS  = {
    CultureId: 1,
    ApplicationId: 1,
    PropertySearchTypeId: 1,
    HashCode: 0,
    ZoomLevel: 10,
    LatitudeMax: 45.54154,
    LongitudeMax: -75.11625,
    LatitudeMin: 44.77617,
    LongitudeMin: -76.40851,
    PriceMax: 225000,
    Sort: "6-D",
    PropertyTypeGroupID: 1,
    TransactionTypeId: 2,
}

const CAROLYN_PARAMS = {
    CultureId: 1,
    ApplicationId: 1,
    PropertySearchTypeId: 1,
    HashCode: 0,
    ZoomLevel: 13,
    LatitudeMax: 43.51671,
    LongitudeMax: -80.43317,
    LatitudeMin: 43.41953,
    LongitudeMin: -80.59471,
    GeoIds: "g40_dpwz1wcm",
    PriceMin: 400000,
    PriceMax: 650000,
    Sort: "6-D",
    PropertyTypeGroupID: 1,
    TransactionTypeId: 2,
}

const MARKHAM_PARAMS  = {
    CultureId: 1,
    ApplicationId: 1,
    PropertySearchTypeId: 1,
    HashCode: 0,
    ZoomLevel: 12,
    LatitudeMax: 43.97722,
    LongitudeMax: -79.13795,
    LatitudeMin: 43.78420,
    LongitudeMin: -79.46101,
    PriceMin: 500000,
    PriceMax: 650000,
    Sort: "6-D",
    PropertyTypeGroupID: 1,
    TransactionTypeId: 2,
}

fs.unlink('out.csv', (err) => {
    if (err) console.log('file does not exist');
    console.log('out.csv was deleted');
});

const ws = fs.createWriteStream('out.csv', { flags: 'a' })
const parser = new Parser({
    header: false
})

async function getPage(number) {
    return new Promise((resolve, reject) => {
        const params = Object.assign(CAROLYN_PARAMS, {
            CurrentPage: parseInt(number),
        })
        request.post('https://api37.realtor.ca/Listing.svc/PropertySearch_Post',
            { form: params },
            (err, httpResponse, body) => {
                const json = JSON.parse(body).Results;
                resolve(json);
            });
    })
}

async function getDetailsRealtorCA(id, mlsNumber) {
    return new Promise((resolve, reject) => {
        request.get(
            'https://api37.realtor.ca//Listing.svc/PropertyDetails?PropertyId='
            + id
            +'&ApplicationId=37&CultureId=1&HashCode=0&ReferenceNumber='
            + mlsNumber, (err, httpResponse, body) => {
                const json = JSON.parse(body);
                resolve(json);
            });
    });
}

async function getLocationScores(lat, long) {
    return new Promise((resolve, reject) => {
        request({
            method: 'GET',
            url: 'https://api.locallogic.co/v1/scores',
            qs: {
                lat: lat,
                lng: long,
                key: LOCAL_LOGIC_API_KEY,
                include: 'cycling_friendly, transit_friendly, groceries, shopping, green, quiet, nightlife',
                fields: 'value, text',
                locale: 'en'
            }
        }, (err, httpResponse, body) => {
            console.log(httpResponse);

            const json = JSON.parse(body).data;
            resolve(json);
        });
    })
}



function writeCsv(generalDesc, detailsDesc) {
    const u = generalDesc;
    const v = detailsDesc;

    const photoPath = v.Property.Photo?.[0]?.HighResPath;
    const mlsNumber = u.MlsNumber;

    const formatted =  {
        MlsNumber: mlsNumber,
        PublicRemarks: u.PublicRemarks,
        Bathrooms: u.Building.BathroomTotal,
        Bedrooms: u.Building.Bedrooms,
        InteriorSize: u.Building.SizeInterior,
        Type: u.Building.Type,
        Ammenities: u.Building.Ammenities,
        Address: v.Property.Address.AddressText,
        Longitude: v.Property.Address.Longitude,
        Latitude: v.Property.Address.Latitude,
        PostalCode: u.PostalCode,
        NeighbourHood: v.Property.Address.CommunityName || v.Property.Address.Neighbourhood,
        Price: u.Property.ConvertedPrice,
        PropertyType: u.Property.Type,
        ParkingSpace: u.Property.ParkingSpaceTotal,
        OwnershipType: u.Property.OwnershipType,
        Appliances: v.Building.Appliances,
        FlooringType: v.Building.FlooringType,
        BasementType: v.Building.BasementType,
        HeatingType: v.Building.HeatingType,
        LandSize: v.Land.SizeTotal,
        AmmenitiesNearBy: v.Property.AmmenitiesNearBy,
        PropertyTax: v.Property.TaxAmount,
        ZoningDescription: v.Property.ZoningDescription,
        LowResPhoto: photoPath
    };

    const csv = parser.parse(formatted);
    ws.write(csv);
    ws.write('\n');
    //console.log(json);

    if (photoPath) {
        ImageDownloader.image({
            url: photoPath,
            dest: './images/'
        })
            .then(msg => console.log('Downlaoded file' + msg))
            .catch(err => console.log(err))
    }
}

var download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);

        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

for (let i=1; i < 51; i++) {
    const json = await getPage(i);

    for (let j = 0; j < json.length; j++) {
        const details = await getDetailsRealtorCA(json[j].Id, json[j].MlsNumber);

        // const locationDetails = await getLocationScores(
        //     details.Property.Address.Latitude,
        //     details.Property.Address.Longitude);

        writeCsv(json[j], details);
    }

    console.log("Completed: " + i + " requests")
}

