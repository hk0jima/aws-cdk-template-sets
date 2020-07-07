#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { Vpc, InstanceType, SubnetType } from '@aws-cdk/aws-ec2';
import { Role, ServicePrincipal, ManagedPolicy } from '@aws-cdk/aws-iam';
import { Cluster, FargateCluster } from '@aws-cdk/aws-eks';

import { deployment, service } from './manifest';
import { timeLog } from 'console';

export class EKS101Stack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

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
            ],
        });

        const eksRole = new Role(this, 'eksRole', {
            assumedBy: new ServicePrincipal('eks.amazonaws.com'),
        });
        eksRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'));
        eksRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSServicePolicy'));

        // Reference: https://github.com/weaveworks/eksctl/issues/204
        eksRole.addManagedPolicy(ManagedPolicy.fromManagedPolicyName(this, 'policy', 'awsEKSHkojimaPolicy'));

        const cluster = new Cluster(this, 'cluster', {
            vpc,
            mastersRole: eksRole,
            clusterName: 'boringWozniak',
        });

        cluster.addCapacity('capacity', {
            desiredCapacity: 1,
            instanceType: new InstanceType('t3.large'),
        });
        cluster.addResource('resource', deployment, service);
    }
}

timeLog;
const app = new cdk.App();
new EKS101Stack(app, 'EKS101Stack', {
    env: {
        region: 'ap-northeast-1',
    },
});
app.synth();
