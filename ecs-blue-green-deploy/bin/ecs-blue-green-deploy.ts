#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { EcsBlueGreenDeployStack } from '../lib/ecs-blue-green-deploy-stack';

const app = new cdk.App();
const env: cdk.Environment = { region: 'ap-northeast-1' };
new EcsBlueGreenDeployStack(app, 'EcsBlueGreenDeployStack', { env });
