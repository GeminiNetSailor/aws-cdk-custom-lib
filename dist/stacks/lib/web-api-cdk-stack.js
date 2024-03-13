"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebApiCdkStack = void 0;
const path = require("path");
const cdk = require("aws-cdk-lib");
const aws_apigateway_1 = require("aws-cdk-lib/aws-apigateway");
const FILES_LOCATION = path.join(process.cwd(), 'dist');
class WebApiCdkStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // ===================================
        // AWS API GATEWAY RestApi 🏙️
        // ===================================
        this.api = new aws_apigateway_1.RestApi(this, `${id}-rest-api`, {
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
        }
        ;
        // 🍄 Root Resouce with the API Enviroment, Version
        const rootApiInfo = new aws_apigateway_1.MockIntegration({
            integrationResponses: [
                { statusCode: '200' },
            ],
            passthroughBehavior: aws_apigateway_1.PassthroughBehavior.NEVER,
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
}
exports.WebApiCdkStack = WebApiCdkStack;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViLWFwaS1jZGstc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zdGFja3MvbGliL3dlYi1hcGktY2RrLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZCQUE2QjtBQUM3QixtQ0FBbUM7QUFHbkMsK0RBSW9DO0FBRXBDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBUXhELE1BQWEsY0FBZSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBRTNDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBNkI7UUFDckUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsc0NBQXNDO1FBQ3RDLDhCQUE4QjtRQUM5QixzQ0FBc0M7UUFDdEMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLHdCQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUU7WUFDN0MsZ0JBQWdCLEVBQUUsRUFBRTtZQUNwQixpQkFBaUI7WUFDakIsMkJBQTJCLEVBQUU7Z0JBQzNCLFlBQVksRUFBRTtvQkFDWixjQUFjO29CQUNkLGVBQWU7b0JBQ2YsWUFBWTtvQkFDWixXQUFXO2lCQUNaO2dCQUNELFlBQVksRUFBRSxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXO2dCQUNqRCxZQUFZLEVBQUUsR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsV0FBVztnQkFDakQsZ0JBQWdCLEVBQUUsSUFBSTthQUN2QjtZQUNELGNBQWMsRUFBRSxLQUFLO1lBQ3JCLHlEQUF5RDtTQUMxRCxDQUFDLENBQUM7UUFFSCxNQUFNO1FBQ04sSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLFVBQVUsSUFBSSxLQUFLLENBQUMsY0FBYyxJQUFJLEtBQUssQ0FBQyxlQUFlLEVBQUU7WUFFOUUsTUFBTSxV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YUFBYSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUN0RSxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLDJCQUEyQixFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO1FBQ2hHLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO1lBQzdCLEtBQUssRUFBRSxXQUFXLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxnQkFBZ0IsSUFBSSxDQUFDLE1BQU0sc0JBQXNCO1NBQ3RGLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXRHRCx3Q0FzR0M7QUFBQSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gXCJhd3MtY2RrLWxpYlwiO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcblxuaW1wb3J0IHtcbiAgTW9ja0ludGVncmF0aW9uLFxuICBQYXNzdGhyb3VnaEJlaGF2aW9yLFxuICBSZXN0QXBpLFxufSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXlcIjtcblxuY29uc3QgRklMRVNfTE9DQVRJT04gPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ2Rpc3QnKTtcblxuaW50ZXJmYWNlIFJlc3RBUElSb290U3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgcmVhZG9ubHkgZG9tYWluTmFtZT86IHN0cmluZztcbiAgcmVhZG9ubHkgY2VydGlmaWNhdGVBcm4/OiBzdHJpbmc7XG4gIHJlYWRvbmx5IHN1YmRvbWFpblByZWZpeD86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFdlYkFwaUNka1N0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgYXBpOiBjZGsuYXdzX2FwaWdhdGV3YXkuUmVzdEFwaTtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBSZXN0QVBJUm9vdFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gQVdTIEFQSSBHQVRFV0FZIFJlc3RBcGkg8J+Pme+4j1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgdGhpcy5hcGkgPSBuZXcgUmVzdEFwaSh0aGlzLCBgJHtpZH0tcmVzdC1hcGlgLCB7XG4gICAgICBiaW5hcnlNZWRpYVR5cGVzOiBbXSxcbiAgICAgIC8vIPCfkYcgZW5hYmxlIENPUlNcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd0hlYWRlcnM6IFtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJyxcbiAgICAgICAgICAnQXV0aG9yaXphdGlvbicsXG4gICAgICAgICAgJ1gtQW16LURhdGUnLFxuICAgICAgICAgICdYLUFwaS1LZXknLFxuICAgICAgICBdLFxuICAgICAgICBhbGxvd01ldGhvZHM6IGNkay5hd3NfYXBpZ2F0ZXdheS5Db3JzLkFMTF9NRVRIT0RTLFxuICAgICAgICBhbGxvd09yaWdpbnM6IGNkay5hd3NfYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLFxuICAgICAgICBhbGxvd0NyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIGNsb3VkV2F0Y2hSb2xlOiBmYWxzZSxcbiAgICAgIC8vIGNsb3VkV2F0Y2hSb2xlUmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWVxuICAgIH0pO1xuXG4gICAgLy8gV0lQXG4gICAgaWYgKHByb3BzICYmIHByb3BzLmRvbWFpbk5hbWUgJiYgcHJvcHMuY2VydGlmaWNhdGVBcm4gJiYgcHJvcHMuc3ViZG9tYWluUHJlZml4KSB7XG5cbiAgICAgIGNvbnN0IGRvbWFpbkNlcnQgPSBjZGsuYXdzX2NlcnRpZmljYXRlbWFuYWdlci5DZXJ0aWZpY2F0ZS5mcm9tQ2VydGlmaWNhdGVBcm4odGhpcywgJ2RvbWFpbkNlcnQnLCBwcm9wcy5jZXJ0aWZpY2F0ZUFybik7XG5cbiAgICAgIHRoaXMuYXBpLmFkZERvbWFpbk5hbWUoXCJkb21haW5fbmFtZVwiLCB7XG4gICAgICAgIGRvbWFpbk5hbWU6IHByb3BzLmRvbWFpbk5hbWUsXG4gICAgICAgIHNlY3VyaXR5UG9saWN5OiBjZGsuYXdzX2FwaWdhdGV3YXkuU2VjdXJpdHlQb2xpY3kuVExTXzFfMixcbiAgICAgICAgY2VydGlmaWNhdGU6IGRvbWFpbkNlcnRcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBkb21haW4gPSBuZXcgY2RrLmF3c19hcGlnYXRld2F5LkRvbWFpbk5hbWUodGhpcywgXCJhcGlfZG9tYWluX25hbWVcIiwge1xuICAgICAgICBkb21haW5OYW1lOiBwcm9wcy5zdWJkb21haW5QcmVmaXggKyBcIi5cIiArIHByb3BzLmRvbWFpbk5hbWUsXG4gICAgICAgIHNlY3VyaXR5UG9saWN5OiBjZGsuYXdzX2FwaWdhdGV3YXkuU2VjdXJpdHlQb2xpY3kuVExTXzFfMixcbiAgICAgICAgY2VydGlmaWNhdGU6IGRvbWFpbkNlcnQsXG4gICAgICAgIGVuZHBvaW50VHlwZTogY2RrLmF3c19hcGlnYXRld2F5LkVuZHBvaW50VHlwZS5FREdFXG4gICAgICB9KTtcblxuICAgICAgLy8gdmFyIGJhc2VQYXRoID0gcHJvcHMuYmFzZVBhdGggIT0gdW5kZWZpbmVkPyBwcm9wcy5iYXNlUGF0aCA6IHByb3BzLm5hbWU7XG4gICAgICAvLyBiYXNlUGF0aCA9IGJhc2VQYXRoLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvW15hLXpBLVowLTldL2csICcnKTtcblxuICAgICAgZG9tYWluLmFkZEFwaU1hcHBpbmcodGhpcy5hcGkuZGVwbG95bWVudFN0YWdlKTtcbiAgICB9O1xuXG4gICAgLy8g8J+NhCBSb290IFJlc291Y2Ugd2l0aCB0aGUgQVBJIEVudmlyb21lbnQsIFZlcnNpb25cbiAgICBjb25zdCByb290QXBpSW5mbyA9IG5ldyBNb2NrSW50ZWdyYXRpb24oe1xuICAgICAgaW50ZWdyYXRpb25SZXNwb25zZXM6IFtcbiAgICAgICAgeyBzdGF0dXNDb2RlOiAnMjAwJyB9LFxuICAgICAgXSxcbiAgICAgIHBhc3N0aHJvdWdoQmVoYXZpb3I6IFBhc3N0aHJvdWdoQmVoYXZpb3IuTkVWRVIsXG4gICAgICByZXF1ZXN0VGVtcGxhdGVzOiB7XG4gICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogJ3sgXCJzdGF0dXNDb2RlXCI6IDIwMCB9JyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0aGlzLmFwaS5yb290LmFkZE1ldGhvZCgnQU5ZJywgcm9vdEFwaUluZm8sIHtcbiAgICAgIG1ldGhvZFJlc3BvbnNlczogW1xuICAgICAgICB7IHN0YXR1c0NvZGU6ICcyMDAnIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5hd3Nfc3NtLlN0cmluZ1BhcmFtZXRlcih0aGlzLCBcIlBhcmFtZXRlckFwaWdhdGV3YXlcIiwge1xuICAgICAgcGFyYW1ldGVyTmFtZTogYC8ke2lkfS9BcGlHYXRld2F5YCxcbiAgICAgIGRlc2NyaXB0aW9uOiBgJHtpZH0gQXBpR2F0ZXdheSBjb25maWd1cmF0aW9uYCxcbiAgICAgIHN0cmluZ1ZhbHVlOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIGFwaUdhdGV3YXlSZXN0QXBpSWQ6IHRoaXMuYXBpLnJlc3RBcGlJZCxcbiAgICAgICAgYXBpR2F0ZXdheVJvb3RSZXNvdXJjZUlkOiB0aGlzLmFwaS5yZXN0QXBpUm9vdFJlc291cmNlSWRcbiAgICAgIH0pLFxuICAgIH0pO1xuXG4gICAgLy8gQVBJIFVzYWdlcGxhblxuICAgIGNvbnN0IHVzYWdlcGxhbiA9IHRoaXMuYXBpLmFkZFVzYWdlUGxhbignVXNhZ2VQbGFuJywge1xuICAgICAgbmFtZTogJ2RlZmF1bHQnLFxuICAgICAgYXBpU3RhZ2VzOiBbe1xuICAgICAgICBhcGk6IHRoaXMuYXBpLFxuICAgICAgICBzdGFnZTogdGhpcy5hcGkuZGVwbG95bWVudFN0YWdlLFxuICAgICAgfV0sXG4gICAgfSk7XG5cbiAgICAvLyBBUEkgS2V5IGZvciBhdXRob3JpemF0aW9uXG4gICAgY29uc3QgYXBpS2V5ID0gdGhpcy5hcGkuYWRkQXBpS2V5KCdBcGlLZXknLCB7XG4gICAgICBhcGlLZXlOYW1lOiAnaW5pdGlhbEtleSdcbiAgICB9KTtcblxuICAgIHVzYWdlcGxhbi5hZGRBcGlLZXkoYXBpS2V5KTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gT3V0cHV0c1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJTdGFjayBSZWdpb25cIiwgeyB2YWx1ZTogdGhpcy5yZWdpb24gfSk7XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1Jlc3QgQVBJIElEJywgeyB2YWx1ZTogdGhpcy5hcGkucmVzdEFwaUlkIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdSZXN0IEFQSSByb290IHJlc291cmNlIElEJywgeyB2YWx1ZTogdGhpcy5hcGkucmVzdEFwaVJvb3RSZXNvdXJjZUlkIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVUkwnLCB7XG4gICAgICB2YWx1ZTogYGh0dHBzOi8vJHt0aGlzLmFwaS5yZXN0QXBpSWR9LmV4ZWN1dGUtYXBpLiR7dGhpcy5yZWdpb259LmFtYXpvbmF3cy5jb20vcHJvZC9gLFxuICAgIH0pO1xuICB9XG59OyJdfQ==