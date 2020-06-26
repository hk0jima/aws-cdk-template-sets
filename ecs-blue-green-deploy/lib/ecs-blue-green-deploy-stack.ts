import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';
import * as code_deploy from '@aws-cdk/aws-codedeploy';
import * as iam from '@aws-cdk/aws-iam';
import * as alb from '@aws-cdk/aws-elasticloadbalancingv2';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { EcsApplication } from '@aws-cdk/aws-codedeploy';
import { Protocol } from '@aws-cdk/aws-ec2';

export class EcsBlueGreenDeployStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, 'MyVpc', {
            maxAzs: 3, // Default is all AZs in region
        });

        const cluster = new ecs.Cluster(this, 'MyCluster', {
            vpc: vpc,
        });

        const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'MyFargateService', {
            cluster: cluster,
            cpu: 512,
            desiredCount: 1,
            taskImageOptions: { image: ecs.ContainerImage.fromRegistry('hirokoji/web-blue') },
            memoryLimitMiB: 2048,
            publicLoadBalancer: true,
        });

        const targetGroupGreen = new alb.ApplicationTargetGroup(this, 'targetGroupGreen', {
            port: 8080,
            protocol: alb.ApplicationProtocol.HTTP,
            vpc,
            targetType: alb.TargetType.IP,
        });

        fargateService.loadBalancer.addListener('ListnerGreen', {
            defaultTargetGroups: [targetGroupGreen],
            open: true,
            protocol: alb.ApplicationProtocol.HTTP,
            port: 8080,
        });

        const awsCodeDeployRoleForECS = new iam.Role(this, 'MyCodeDeployECSRole', {
            assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
        });

        awsCodeDeployRoleForECS.addToPolicy(
            new PolicyStatement({
                resources: ['*'],
                actions: [
                    'ecs:DescribeServices',
                    'ecs:CreateTaskSet',
                    'ecs:UpdateServicePrimaryTaskSet',
                    'ecs:DeleteTaskSet',
                    'elasticloadbalancing:DescribeTargetGroups',
                    'elasticloadbalancing:DescribeListeners',
                    'elasticloadbalancing:ModifyListener',
                    'elasticloadbalancing:DescribeRules',
                    'elasticloadbalancing:ModifyRule',
                    'lambda:InvokeFunction',
                    'cloudwatch:DescribeAlarms',
                    'sns:Publish',
                    's3:GetObject',
                    's3:GetObjectMetadata',
                    's3:GetObjectVersion',
                ],
            })
        );

        const codeDeployApp = new code_deploy.EcsApplication(this, 'MyCodeDeploy', {
            applicationName: 'myCodeDeployApp',
        });

        // const deploymentGroup = new code_deploy.CfnDeploymentGroup(this, 'MyDeploymentGroup', {
        // applicationName: codeDeployApp.applicationName || 'no-name',
        // serviceRoleArn: awsCodeDeployRoleForECS.roleArn,
        // loadBalancerInfo: {
        // elbInfoList: [{ name: fargateService.loadBalancer.loadBalancerName }],
        // targetGroupInfoList: [{ name: fargateService.targetGroup.targetGroupName }],
        // },
        // autoRollbackConfiguration: {
        // enabled: true,
        // events: ['DEPLOYMENT_FAILURE'],
        // },
        // });

        const ecsDeployment = code_deploy.EcsDeploymentGroup.fromEcsDeploymentGroupAttributes(this, 'ecsDeployGroup', {
            application: codeDeployApp,
            deploymentGroupName: 'testgroup',
        });

        // const hoge = code_deploy.EcsDeploymentGroup
    }
}
