import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
export interface PrismaLayerProps extends Omit<cdk.aws_lambda.LayerVersionProps, "code"> {
    prismaVersion?: string;
    nodeModules?: string[];
}
/**
 * Construct a lambda layer with Prisma libraries.
 * Be sure to omit the prisma layer modules from your function bundles with the `externalModules` option.
 * Include `environment` to point prisma at the right library location.
 *
 * @example
 * ```ts
 *   const prismaLayer = new PrismaLayer(this, "PrismaLayer", {
 *     layerVersionName: `${id}-prisma`,
 *     removalPolicy: isProduction ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
 *   })
 *
 *   // default lambda function options
 *   const functionOptions: FunctionOptions = {
 *     layers: [prismaLayer],
 *     environment: { ...prismaLayer.environment, DEBUG: "*" },
 *     bundling: {
 *       externalModules: prismaLayer.externalModules,
 *     },
 *   }
 */
export declare class PrismaLayer extends cdk.aws_lambda.LayerVersion {
    externalModules: string[];
    environment: Record<string, string>;
    constructor(scope: Construct, id: string, props?: PrismaLayerProps);
}
