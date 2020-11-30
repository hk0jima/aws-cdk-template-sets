import { S3Event, Context, Callback, CloudFrontRequestEvent } from 'aws-lambda';

exports.handler = (event: CloudFrontRequestEvent, context: Context, callback: Callback) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    // Set your username and password
    const authUser = 'user';
    const authPass = 'pass';

    const authString = 'Basic ' + new Buffer(authUser + ':' + authPass).toString('base64');

    if (typeof headers.authorization === 'undefined' || headers.authorization[0].value !== authString) {
        const body = 'Unauthorized';
        const response = {
            status: '401',
            statusDescription: 'Unauthorized',
            body: body,
            headers: {
                'www-authenticate': [{ key: 'WWW-Authenticate', value: 'Basic' }],
            },
        };
        callback(null, response);
    }

    callback(null, request);
};
