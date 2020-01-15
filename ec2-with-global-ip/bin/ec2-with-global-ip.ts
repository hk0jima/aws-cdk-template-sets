#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { Ec2WithGlobalIpStack } from '../lib/ec2-with-global-ip-stack';

const app = new cdk.App();
new Ec2WithGlobalIpStack(app, 'Ec2WithGlobalIpStack');