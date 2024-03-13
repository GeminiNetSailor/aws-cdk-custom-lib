import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as logs from 'aws-cdk-lib/aws-logs';

interface DomainsCdkStackProps extends cdk.StackProps {
  domain: string
  hostedZoneId: string
  subdomains: {
    name: string
    certificateArn: string
  }[]
};

export class DomainsCdkStack extends cdk.Stack {
  lambdaDs: cdk.aws_appsync.LambdaDataSource;
  api: cdk.aws_appsync.GraphqlApi;
  domainOptions: { [key: string]: { certificate: cdk.aws_certificatemanager.ICertificate; domainName: string; } } = {};
  constructor(scope: Construct, id: string, props: DomainsCdkStackProps) {
    super(scope, id, props);

    console.log('StackName 👉', cdk.Stack.of(this).stackName);
    console.log('StackName Param 👉', cdk.Aws.STACK_NAME);

    const myHostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.domain
    });

    for (let i = 0; i < props.subdomains.length; i++) {
      let subDomain = props.subdomains[i];
      const domainName = subDomain.name + "." + myHostedZone.zoneName;

      console.log('Domain Name 👉 ', domainName);

      const certificate = cdk.aws_certificatemanager.Certificate.fromCertificateArn(this, 'cert', subDomain.certificateArn);

      console.log(certificate);

      this.domainOptions[subDomain.name] = {
        certificate,
        domainName,
      }
    }


  }

}
