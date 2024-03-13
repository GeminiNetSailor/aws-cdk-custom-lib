import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface AppSyncCdkStackProps extends cdk.StackProps {
  schema: cdk.aws_appsync.SchemaFile,
  domainOptions?: {
    certificateArn: string;
    domainName: string;
  };
  openIdConnectConfig?: cdk.aws_appsync.OpenIdConnectConfig;
}

const BASE_PREFIX = 'graphqlapi';

export class AppSyncCdkStack extends cdk.Stack {
  lambdaDataSource: cdk.aws_appsync.LambdaDataSource;
  api: cdk.aws_appsync.GraphqlApi;
  constructor(scope: Construct, id: string, props: AppSyncCdkStackProps) {
    super(scope, id, props);

    console.log('StackName 👉', cdk.Stack.of(this).stackName);
    console.log('StackName Param 👉', cdk.Aws.STACK_NAME);

    const logConfig: cdk.aws_appsync.LogConfig = {
      retention: logs.RetentionDays.ONE_WEEK,
    };


    let authorizationConfig: cdk.aws_appsync.AuthorizationConfig | undefined = (props.openIdConnectConfig !== undefined) ? {
      defaultAuthorization: {
        authorizationType: cdk.aws_appsync.AuthorizationType.OIDC,
        openIdConnectConfig: props.openIdConnectConfig
      }
    } : undefined;

    this.api = new cdk.aws_appsync.GraphqlApi(this, `${cdk.Stack.of(this).stackName}-graphql-api`, {
      name: `${cdk.Stack.of(this).stackName}-graphql-api`,
      schema: props.schema,
      authorizationConfig,
      domainName: (props.domainOptions !== undefined) ? {
        certificate: cdk.aws_certificatemanager.Certificate.fromCertificateArn(this, 'cert', props.domainOptions.certificateArn),
        domainName: props.domainOptions.domainName
      } : undefined,
      logConfig
    });

    // OUTPUTS
    // print out the AppSync GraphQL endpoint to the terminal
    new cdk.CfnOutput(this, "GraphQLAPIURL", {
      value: this.api.graphqlUrl
    });

    // print out the AppSync API Key to the terminal
    new cdk.CfnOutput(this, "Graphql API Domain", {
      value: this.api.appSyncDomainName || ''
    });

    // print out the stack region
    new cdk.CfnOutput(this, "Stack Region", {
      value: this.region
    });

  }

}
