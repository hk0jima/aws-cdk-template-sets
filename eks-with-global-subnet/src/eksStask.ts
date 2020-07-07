#!/usr/bin/env node
import cdk = require('@aws-cdk/core')
import { Vpc, InstanceType, SubnetType } from '@aws-cdk/aws-ec2'

export class EKS101Stack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const vpc = new Vpc(this, 'vpc', {
      cidr: '192.168.0.0/16',
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public1',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Public2',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private1',
          subnetType: SubnetType.PRIVATE,
        },
        {
          cidrMask: 24,
          name: 'Private2',
          subnetType: SubnetType.PRIVATE,
        },
      ]
    })
  }
}

const app = new cdk.App()
new EKS101Stack(app, 'EKS101Stack', {
  env: {
    region: 'ap-northeast-1'
  }
})
app.synth()