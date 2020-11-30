import * as cdk from '@aws-cdk/core';
import * as path from 'path';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';

export class AmplifyS3BasicAuthStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const fn = new NodejsFunction(this, 'basicAuthFunction', {
            entry: 'resources/lambda/basicAuthFunction/index.ts',
            handler: 'handler',
            minify: true,
        });
    }
}
