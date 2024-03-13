import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import {
  MockIntegration,
  PassthroughBehavior,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";

const FILES_LOCATION = path.join(process.cwd(), 'dist');

interface RestAPIRootStackProps extends cdk.StackProps {
  readonly domainName?: string;
  readonly certificateArn?: string;
  readonly subdomainPrefix?: string;
}

export class WebApiCdkStack extends cdk.Stack {
  api: cdk.aws_apigateway.RestApi;
  constructor(scope: Construct, id: string, props?: RestAPIRootStackProps) {
    super(scope, id, props);

    // ===================================
    // AWS API GATEWAY RestApi 🏙️
    // ===================================
    this.api = new RestApi(this, `${id}-rest-api`, {
      binaryMediaTypes: [],
      // 👇 enable CORS
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
        ],
        allowMethods: cdk.aws_apigateway.Cors.ALL_METHODS,
        allowOrigins: cdk.aws_apigateway.Cors.ALL_ORIGINS,
        allowCredentials: true,
      },
      cloudWatchRole: false,
      // cloudWatchRoleRemovalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // WIP
    if (props && props.domainName && props.certificateArn && props.subdomainPrefix) {

      const domainCert = cdk.aws_certificatemanager.Certificate.fromCertificateArn(this, 'domainCert', props.certificateArn);

      this.api.addDomainName("domain_name", {
        domainName: props.domainName,
        securityPolicy: cdk.aws_apigateway.SecurityPolicy.TLS_1_2,
        certificate: domainCert
      });

      const domain = new cdk.aws_apigateway.DomainName(this, "api_domain_name", {
        domainName: props.subdomainPrefix + "." + props.domainName,
        securityPolicy: cdk.aws_apigateway.SecurityPolicy.TLS_1_2,
        certificate: domainCert,
        endpointType: cdk.aws_apigateway.EndpointType.EDGE
      });

      // var basePath = props.basePath != undefined? props.basePath : props.name;
      // basePath = basePath.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');

      domain.addApiMapping(this.api.deploymentStage);
    };

    // 🍄 Root Resouce with the API Enviroment, Version
    const rootApiInfo = new MockIntegration({
      integrationResponses: [
        { statusCode: '200' },
      ],
      passthroughBehavior: PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{ "statusCode": 200 }',
      },
    });

    this.api.root.addMethod('ANY', rootApiInfo, {
      methodResponses: [
        { statusCode: '200' },
      ],
    });

    new cdk.aws_ssm.StringParameter(this, "ParameterApigateway", {
      parameterName: `/${id}/ApiGateway`,
      description: `${id} ApiGateway configuration`,
      stringValue: JSON.stringify({
        apiGatewayRestApiId: this.api.restApiId,
        apiGatewayRootResourceId: this.api.restApiRootResourceId
      }),
    });

    // API Usageplan
    const usageplan = this.api.addUsagePlan('UsagePlan', {
      name: 'default',
      apiStages: [{
        api: this.api,
        stage: this.api.deploymentStage,
      }],
    });

    // API Key for authorization
    const apiKey = this.api.addApiKey('ApiKey', {
      apiKeyName: 'initialKey'
    });

    usageplan.addApiKey(apiKey);

    // ===================================
    // Outputs
    // ===================================
    new cdk.CfnOutput(this, "Stack Region", { value: this.region });
    new cdk.CfnOutput(this, 'Rest API ID', { value: this.api.restApiId });
    new cdk.CfnOutput(this, 'Rest API root resource ID', { value: this.api.restApiRootResourceId });
    new cdk.CfnOutput(this, 'URL', {
      value: `https://${this.api.restApiId}.execute-api.${this.region}.amazonaws.com/prod/`,
    });
  }
};