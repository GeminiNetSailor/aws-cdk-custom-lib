import * as path from "path";

import { Construct } from 'constructs';
import { aws_lambda, aws_iam, aws_stepfunctions } from 'aws-cdk-lib';
import { StepFunctionSetup } from './StepFunctionSetup';

export interface EnvInfrastructureValidationProps {
    env: string;
}

export class EnvInfrastructureValidation extends Construct {
    public readonly lambdaFunction: aws_lambda.Function;
    public readonly stateMachine: aws_stepfunctions.StateMachine;
    public readonly stepFunctionSetup: StepFunctionSetup;

    constructor(scope: Construct, id: string, props: EnvInfrastructureValidationProps) {
        super(scope, id);

        this.lambdaFunction = new aws_lambda.Function(this, 'EnvInfrastrcutureValidationFunction', {
            runtime: aws_lambda.Runtime.PYTHON_3_9,
            handler: 'handler.lambda_handler',
            code: aws_lambda.Code.fromAsset(path.join("src", "EnvInfrastructureValidation")),  // Path to your Lambda code
            environment: {
                'ENV': props.env // Change this based on your environment
            }
        });

        // Grant Lambda function permission to describe secrets
        this.lambdaFunction.addToRolePolicy(new aws_iam.PolicyStatement({
            actions: ['secretsmanager:DescribeSecret'],
            resources: ['*'], // Replace with specific resource ARNs for better security
        }));

        this.stepFunctionSetup = new StepFunctionSetup(this, 'StepFunctionSetup', this.lambdaFunction, props.env);
    }
}
