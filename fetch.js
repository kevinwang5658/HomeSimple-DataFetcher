import request from 'request';
import { Parser } from 'json2csv';

const fields = ['Id', 'MlsNumber'];
const opts = { fields };

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
            const parser = new Parser(opts)
            console.log(Object.values(body));
            const csv = parser.parse(body.Results);

            console.log(csv);
        } catch (e) {

        }


})

