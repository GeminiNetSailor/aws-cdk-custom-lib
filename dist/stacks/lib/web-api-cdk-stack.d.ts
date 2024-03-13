import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
interface RestAPIRootStackProps extends cdk.StackProps {
    readonly domainName?: string;
    readonly certificateArn?: string;
    readonly subdomainPrefix?: string;
}
export declare class WebApiCdkStack extends cdk.Stack {
    api: cdk.aws_apigateway.RestApi;
    constructor(scope: Construct, id: string, props?: RestAPIRootStackProps);
}
export {};
