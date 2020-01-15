import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import Ec2WithGlobalIp = require('../lib/ec2-with-global-ip-stack');

test('EC2 Instance Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Ec2WithGlobalIp.Ec2WithGlobalIpStack(app, 'MyTestStack');
    // THEN
    console.log(stack)
    expectCDK(stack).to(haveResource("AWS::EC2::Instance"));
});

test('VPC Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Ec2WithGlobalIp.Ec2WithGlobalIpStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(haveResource("AWS::EC2::VPC"));
});