import * as cdk from 'aws-cdk-lib';
// import { Code, LayerVersion, LayerVersionProps, Runtime } from "@aws-cdk/aws-lambda"
// import { AssetHashType, Construct, IgnoreMode } from "@aws-cdk/core"
import * as crypto from "crypto"
import { Construct } from 'constructs';

// deps to npm install to the layer
const PRISMA_DEPS = ["prisma", "@prisma/migrate", "@prisma/sdk", "@prisma/client"]

export interface PrismaLayerProps extends Omit<cdk.aws_lambda.LayerVersionProps, "code"> {
  // e.g. 3.1.1
  prismaVersion?: string

  // some more modules to add to the layer
  nodeModules?: string[]
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
export class PrismaLayer extends cdk.aws_lambda.LayerVersion {
  externalModules: string[]
  environment: Record<string, string>

  constructor(scope: Construct, id: string, props: PrismaLayerProps = {}) {

    const { prismaVersion } = props
    const nodeModules = props.nodeModules || []

    const layerDir = "/asset-output/nodejs"
    const nm = `${layerDir}/node_modules`
    const engineDir = `${nm}/@prisma/engines`

    // what are we asking npm to install?
    let modulesToInstall = PRISMA_DEPS.concat(nodeModules)
    if (prismaVersion) modulesToInstall = modulesToInstall.map((dep) => `${dep}@${prismaVersion}`)
    const modulesToInstallArgs = modulesToInstall.join(" ")

    const createBundleCommand = [
      // create asset bundle in docker
      "bash",
      "-c",
      [
        `mkdir -p ${layerDir}`,
        // install PRISMA_DEPS
        `cd ${layerDir} && HOME=/tmp npm install ${modulesToInstallArgs}`,
        // delete unneeded engines
        `rm -f ${engineDir}/introspection-engine* ${engineDir}/prisma-fmt*`,
        // get rid of some junk
        `rm -rf ${nm}/prisma/build/public`,
        `rm -rf ${nm}/prisma/prisma-client/src/__tests__`,
        `rm -rf ${nm}/@types`,
      ].join(" && "),
    ]

    // hash our parameters so we know when we need to rebuild
    const bundleCommandHash = crypto.createHash("sha256")
    bundleCommandHash.update(JSON.stringify(createBundleCommand))

    // bundle
    const code = cdk.aws_lambda.Code.fromAsset(".", {
      // don't send all our files to docker (slow)
      ignoreMode: cdk.IgnoreMode.GLOB,
      exclude: ["*"],

      // if our bundle commands (basically our "dockerfile") changes then rebuild the image
      assetHashType: cdk.AssetHashType.CUSTOM,
      assetHash: bundleCommandHash.digest("hex"),

      bundling: {
        image: cdk.aws_lambda.Runtime.NODEJS_14_X.bundlingImage,
        command: createBundleCommand,
      },
    })

    super(scope, id, { ...props, code })

    // hint for prisma to find the engine
    this.environment = {
      // PRISMA_QUERY_ENGINE_LIBRARY: "/opt/nodejs/node_modules/prisma/libquery_engine-rhel-openssl-1.0.x.so.node",
      PRISMA_QUERY_ENGINE_LIBRARY:
        "/opt/nodejs/node_modules/@prisma/engines/libquery_engine-rhel-openssl-1.0.x.so.node",
    }
    // modules provided by layer
    this.externalModules = [
      "aws-sdk",
      "@prisma/migrate",
      "@prisma/sdk",
      "@prisma/engines",
      "@prisma/engines-version",
      ...nodeModules,
    ]
  }
}