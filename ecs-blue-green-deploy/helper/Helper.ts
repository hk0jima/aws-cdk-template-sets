import * as CloudFormation from 'aws-sdk/clients/cloudformation';
import * as ECS from 'aws-sdk/clients/ecs';
import * as IAM from 'aws-sdk/clients/iam';
import { Cluster } from '@aws-cdk/aws-ecs';

const templateJson = {
    applicationName: 'myCodeDeployApp',
    autoRollbackConfiguration: {
        enabled: true,
        events: ['DEPLOYMENT_FAILURE'],
    },
    blueGreenDeploymentConfiguration: {
        deploymentReadyOption: {
            actionOnTimeout: 'CONTINUE_DEPLOYMENT',
            waitTimeInMinutes: 0,
        },
        terminateBlueInstancesOnDeploymentSuccess: {
            action: 'TERMINATE',
            terminationWaitTimeInMinutes: 5,
        },
    },
    deploymentGroupName: 'tutorial-bluegreen-dg',
    deploymentStyle: {
        deploymentOption: 'WITH_TRAFFIC_CONTROL',
        deploymentType: 'BLUE_GREEN',
    },
    loadBalancerInfo: {
        targetGroupPairInfoList: [
            {
                targetGroups: [
                    {
                        name: 'EcsBl-targe-1HUL3IX7BWG20',
                    },
                    {
                        name: 'EcsBl-targe-AJ1U4F9TXNC3',
                    },
                ],
                prodTrafficRoute: {
                    listenerArns: ['arn:aws:elasticloadbalancing:ap-northeast-1:371396914426:listener/app/EcsBl-MyFar-1RI90YY25VQZ9/1931433732cd8b02/1a5eabcf010208a2'],
                },
            },
        ],
    },
    serviceRoleArn: 'arn:aws:iam::371396914426:role/EcsBlueGreenDeployStack-MyCodeDeployECSRole2C89F1D-19A3Q55PDLY0D',
    ecsServices: [
        {
            serviceName: 'EcsBlueGreenDeployStack-MyFargateServiceF490C034-14O0L4PPTO3QY',
            clusterName: 'EcsBlueGreenDeployStack-MyCluster4C1BA579-vgQiNdCEeCa8',
        },
    ],
};

class Helper {
    cf: CloudFormation;
    ecs: ECS;
    iam: IAM;

    constructor() {
        const region = 'ap-northeast-1';
        this.cf = new CloudFormation({ region });
        this.ecs = new ECS({ region });
        this.iam = new IAM({ region });
    }
    async generateDeployJSON(): Promise<object> {
        const response = await this.cf
            .describeStackResources({
                StackName: 'EcsBlueGreenDeployStack',
            })
            .promise();

        if (response.StackResources === undefined) {
            return {};
        }

        const resourceTypeCodeDeployApp = 'AWS::CodeDeploy::Application';
        const resourceTypeTargetGp = 'AWS::ElasticLoadBalancingV2::TargetGroup';
        const resourceTypeListner = 'AWS::ElasticLoadBalancingV2::Listener';
        const resourceTypeECSService = 'AWS::ECS::Service';
        const resourceTypeECSCluster = 'AWS::ECS::Cluster';
        const resourceTypeCodeDeployRole = 'AWS::IAM::Role';

        let codeDeployAppName;
        let targetGroups: string[] = [];
        let listenerArns: string[] = [];
        let ecsServiceName;
        let ecsClusterName;
        let codeDeplyRole;

        for (let rs of response.StackResources) {
            switch (rs.ResourceType) {
                case resourceTypeCodeDeployApp:
                    codeDeployAppName = rs.PhysicalResourceId;
                    break;
                case resourceTypeTargetGp:
                    const targetGroup = rs.PhysicalResourceId?.split('/')[1];
                    targetGroup ? targetGroups.push(targetGroup) : null;
                    break;
                case resourceTypeListner:
                    const listenerArn = rs.PhysicalResourceId;
                    listenerArn ? listenerArns.push(listenerArn) : null;
                    break;
                case resourceTypeECSService:
                    ecsServiceName = rs.PhysicalResourceId?.split('/')[1];
                    break;
                case resourceTypeECSCluster:
                    ecsClusterName = rs.PhysicalResourceId;
                    break;
                case resourceTypeCodeDeployRole:
                    if (rs.PhysicalResourceId?.includes('CodeDeploy')) {
                        const role = await this.iam.getRole({ RoleName: rs.PhysicalResourceId }).promise();
                    }
                    break;
                default:
            }
        }

        const newJson = { ...templateJson };
        codeDeployAppName ? (newJson.applicationName = codeDeployAppName) : null;
        targetGroups.length > 1 ? (newJson.loadBalancerInfo.targetGroupPairInfoList[0].targetGroups = [{ name: targetGroups[0] }, { name: targetGroups[1] }]) : null;
        listenerArns.length > 0 ? (newJson.loadBalancerInfo.targetGroupPairInfoList[0].prodTrafficRoute.listenerArns = listenerArns) : null;
        ecsServiceName ? (newJson.ecsServices[0].serviceName = ecsServiceName) : null;
        ecsClusterName ? (newJson.ecsServices[0].clusterName = ecsClusterName) : null;
        codeDeplyRole ? (newJson.serviceRoleArn = codeDeplyRole) : null;

        console.log(JSON.stringify(newJson));
        return newJson;
    }
}

const main = () => {
    const helper = new Helper();
    helper.generateDeployJSON();
};

main();
