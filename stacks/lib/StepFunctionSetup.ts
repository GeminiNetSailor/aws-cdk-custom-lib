import { Construct } from "constructs";
import { aws_lambda, aws_stepfunctions, aws_stepfunctions_tasks, Duration } from "aws-cdk-lib";

export class StepFunctionSetup extends Construct {
    public readonly stateMachine: aws_stepfunctions.StateMachine;

    constructor(scope: Construct, id: string, lambdaFunction: aws_lambda.Function, env: string) {
        super(scope, id);

        const invokeLambda = new aws_stepfunctions_tasks.LambdaInvoke(this, 'Invoke Lambda', {
            lambdaFunction,
            outputPath: '$.Payload'
        });

        const isSuccessful = new aws_stepfunctions.Pass(this, 'Is Successful', {
            result: aws_stepfunctions.Result.fromObject({ status: 'SUCCESS' })
        });

        const isFailure = new aws_stepfunctions.Pass(this, 'Is Failure', {
            result: aws_stepfunctions.Result.fromObject({ status: 'FAILURE' })
        });

        const choice = new aws_stepfunctions.Choice(this, 'Check Result');
        choice.when(aws_stepfunctions.Condition.numberEquals('$.statusCode', 200), isSuccessful);
        choice.when(aws_stepfunctions.Condition.numberEquals('$.statusCode', 400), isFailure);

        const definition = invokeLambda.next(choice);

        this.stateMachine = new aws_stepfunctions.StateMachine(this, 'StateMachine', {
            definitionBody: aws_stepfunctions.DefinitionBody.fromChainable(definition),
            timeout: Duration.minutes(5),
        });
    }
}