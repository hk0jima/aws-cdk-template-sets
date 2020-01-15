import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import setting from '../setting.json';

export class Ec2WithGlobalIpStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {

        super(scope, id, props);

        const vpc = new ec2.Vpc(
            this,
            this.getId() + '-vpc',
            {
                subnetConfiguration: [
                    {
                        cidrMask: 28,
                        subnetType: ec2.SubnetType.PUBLIC,
                        name: 'public'
                    },
                ]
            });


        const securityGroup = new ec2.SecurityGroup(
            this,
            this.getId() + '-sg',
            {
                securityGroupName: this.getId()  + '-sg',
                vpc: vpc
            });
        securityGroup.addIngressRule(this.getPeerSetting(), ec2.Port.tcp(22), 'SSH from anywhere');


        const image = new ec2.AmazonLinuxImage( { generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 });


        new ec2.Instance(this, this.getId() + '-instance', this.getOptions(vpc, image, securityGroup));

    }

    private getOptions(vpc: any, image: any, securityGroup: any) {

        const initialOptions: any = {
            vpc: vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
            machineImage: image,
            securityGroup: securityGroup,
        };

        if (setting["instance-setting"] === {}) {
            return initialOptions;
        } else {
            return Object.assign(initialOptions, setting["instance-setting"]);
        }
    }


    private getPeerSetting() {
        return ec2.Peer.anyIpv4();
    }

    private getId(){
        return setting.id;
    }

}
