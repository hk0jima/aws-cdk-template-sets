# [AWS CDK Template] EC2 with global ip

This is cdk template to create below three resources.
- ec2 instance (global ip assigned)
- vpc 
- security group (open ssh port from global)

## Precondition
- TypeScript installed

## Deploy reousrces.
You can deploy resources with below commands.

```
$ cp ./setting.default.json setting.json
$ npm install
$ cdk run build
$ cdk deploy
```
