import * as code_deploy from '@aws-cdk/aws-codedeploy';
import { ApplicationTargetGroup, ApplicationLoadBalancer, ApplicationProtocol, TargetType } from '@aws-cdk/aws-elasticloadbalancingv2';
import { PolicyStatement, Role, ServicePrincipal, Policy, ManagedPolicy } from '@aws-cdk/aws-iam';
import { FargateTaskDefinition, LogDriver, FargateService, DeploymentControllerType, Cluster, ContainerImage } from '@aws-cdk/aws-ecs';
import { SecurityGroup, Peer, Port, Vpc } from '@aws-cdk/aws-ec2';
import { Stack, Construct, StackProps, CfnOutput } from '@aws-cdk/core';
import IAM = require('aws-sdk/clients/iam');

export class EcsBlueGreenDeployStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Create VPC

        const vpc = new Vpc(this, 'MyVpc', {
            maxAzs: 3, // Default is all AZs in region
        });

        // Create LB
        const albSecurityGroup = new SecurityGroup(this, 'albSecurityGroup', {
            allowAllOutbound: true,
            vpc,
        });
        albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80));

        const lb = new ApplicationLoadBalancer(this, 'alb', {
            internetFacing: true,
            securityGroup: albSecurityGroup,
            vpc,
            vpcSubnets: { subnets: vpc.publicSubnets },
        });

        const targetGroupGreen = new ApplicationTargetGroup(this, 'targetGroupGreen', {
            port: 80,
            protocol: ApplicationProtocol.HTTP,
            vpc,
            targetType: TargetType.IP,
        });

        lb.addListener('ListnerGreen', {
            defaultTargetGroups: [targetGroupGreen],
            open: true,
            protocol: ApplicationProtocol.HTTP,
            port: 80,
        });

        const targetGroupBlue = new ApplicationTargetGroup(this, 'targetGroupBlue', {
            port: 80,
            protocol: ApplicationProtocol.HTTP,
            vpc,
            targetType: TargetType.IP,
        });

        new CfnOutput(this, 'endpoint', {
            value: `http://${lb.loadBalancerDnsName}`,
        });

        // Create Ecs

        const cluster = new Cluster(this, 'MyCluster', {
            vpc: vpc,
        });

        // const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'MyFargateService', {
        //     cluster: cluster,
        //     cpu: 512,
        //     desiredCount: 1,
        //     taskImageOptions: { image: ecs.ContainerImage.fromRegistry('hirokoji/web-blue') },
        //     memoryLimitMiB: 2048,
        //     publicLoadBalancer: true,
        // });

        const taskDefinition = new FargateTaskDefinition(this, 'TaskDefinition', {
            cpu: 1024,
            memoryLimitMiB: 2048,
        });

        const containerName = 'container';
        const container = taskDefinition.addContainer(containerName, {
            image: ContainerImage.fromRegistry('hirokoji/web-blue'),
        });
        container.addPortMappings({
            containerPort: 80,
        });

        const securityGroup = new SecurityGroup(this, 'securityGroup', {
            vpc: vpc,
            allowAllOutbound: true,
        });
        securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80));

        const service = new FargateService(this, 'Service', {
            cluster,
            securityGroup,
            taskDefinition,
            deploymentController: {
                type: DeploymentControllerType.CODE_DEPLOY,
            },
        });

        targetGroupGreen.addTarget(
            service.loadBalancerTarget({
                containerName: containerName,
                containerPort: 80,
            })
        );

        // Code Deploy

        const awsCodeDeployRoleForECS = new Role(this, 'MyCodeDeployECSRole', {
            assumedBy: new ServicePrincipal('codedeploy.amazonaws.com'),
            managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AWSCodeDeployRoleForECS')],
        });

        // awsCodeDeployRoleForECS.addToPolicy(
        //     new PolicyStatement({
        //         resources: ['*'],
        //         actions: [
        //             'ecs:DescribeServices',
        //             'ecs:CreateTaskSet',
        //             'ecs:UpdateServicePrimaryTaskSet',
        //             'ecs:DeleteTaskSet',
        //             'elasticloadbalancing:DescribeTargetGroups',
        //             'elasticloadbalancing:DescribeListeners',
        //             'elasticloadbalancing:ModifyListener',
        //             'elasticloadbalancing:DescribeRules',
        //             'elasticloadbalancing:ModifyRule',
        //             'lambda:InvokeFunction',
        //             'cloudwatch:DescribeAlarms',
        //             'sns:Publish',
        //             's3:GetObject',
        //             's3:GetObjectMetadata',
        //             's3:GetObjectVersion',
        //             'ecr:GetAuthorizationToken',
        //             'ecr:BatchCheckLayerAvailability',
        //             'ecr:GetDownloadUrlForLayer',
        //             'ecr:BatchGetImage',
        //             'logs:CreateLogStream',
        //             'logs:PutLogEvents',
        //         ],
        //     })
        // );

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
