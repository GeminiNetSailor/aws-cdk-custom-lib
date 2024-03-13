import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
export interface AppSyncCdkStackProps extends cdk.StackProps {
    schema: cdk.aws_appsync.SchemaFile;
    domainOptions?: {
        certificateArn: string;
        domainName: string;
    };
    openIdConnectConfig?: cdk.aws_appsync.OpenIdConnectConfig;
}
export declare class AppSyncCdkStack extends cdk.Stack {
    lambdaDataSource: cdk.aws_appsync.LambdaDataSource;
    api: cdk.aws_appsync.GraphqlApi;
    constructor(scope: Construct, id: string, props: AppSyncCdkStackProps);
}
