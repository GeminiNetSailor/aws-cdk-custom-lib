import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
interface DomainsCdkStackProps extends cdk.StackProps {
    domain: string;
    hostedZoneId: string;
    subdomains: {
        name: string;
        certificateArn: string;
    }[];
}
export declare class DomainsCdkStack extends cdk.Stack {
    lambdaDs: cdk.aws_appsync.LambdaDataSource;
    api: cdk.aws_appsync.GraphqlApi;
    domainOptions: {
        [key: string]: {
            certificate: cdk.aws_certificatemanager.ICertificate;
            domainName: string;
        };
    };
    constructor(scope: Construct, id: string, props: DomainsCdkStackProps);
}
export {};
