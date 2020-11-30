#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AmplifyS3BasicAuthStack } from '../lib/amplify-s3-basic-auth-stack';

const app = new cdk.App();
new AmplifyS3BasicAuthStack(app, 'AmplifyS3BasicAuthStack');
