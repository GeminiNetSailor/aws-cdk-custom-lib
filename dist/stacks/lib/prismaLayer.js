"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaLayer = void 0;
const cdk = require("aws-cdk-lib");
// import { Code, LayerVersion, LayerVersionProps, Runtime } from "@aws-cdk/aws-lambda"
// import { AssetHashType, Construct, IgnoreMode } from "@aws-cdk/core"
const crypto = require("crypto");
// deps to npm install to the layer
const PRISMA_DEPS = ["prisma", "@prisma/migrate", "@prisma/sdk", "@prisma/client"];
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
class PrismaLayer extends cdk.aws_lambda.LayerVersion {
    constructor(scope, id, props = {}) {
        const { prismaVersion } = props;
        const nodeModules = props.nodeModules || [];
        const layerDir = "/asset-output/nodejs";
        const nm = `${layerDir}/node_modules`;
        const engineDir = `${nm}/@prisma/engines`;
        // what are we asking npm to install?
        let modulesToInstall = PRISMA_DEPS.concat(nodeModules);
        if (prismaVersion)
            modulesToInstall = modulesToInstall.map((dep) => `${dep}@${prismaVersion}`);
        const modulesToInstallArgs = modulesToInstall.join(" ");
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
        ];
        // hash our parameters so we know when we need to rebuild
        const bundleCommandHash = crypto.createHash("sha256");
        bundleCommandHash.update(JSON.stringify(createBundleCommand));
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
        });
        super(scope, id, { ...props, code });
        // hint for prisma to find the engine
        this.environment = {
            // PRISMA_QUERY_ENGINE_LIBRARY: "/opt/nodejs/node_modules/prisma/libquery_engine-rhel-openssl-1.0.x.so.node",
            PRISMA_QUERY_ENGINE_LIBRARY: "/opt/nodejs/node_modules/@prisma/engines/libquery_engine-rhel-openssl-1.0.x.so.node",
        };
        // modules provided by layer
        this.externalModules = [
            "aws-sdk",
            "@prisma/migrate",
            "@prisma/sdk",
            "@prisma/engines",
            "@prisma/engines-version",
            ...nodeModules,
        ];
    }
}
exports.PrismaLayer = PrismaLayer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpc21hTGF5ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zdGFja3MvbGliL3ByaXNtYUxheWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyx1RkFBdUY7QUFDdkYsdUVBQXVFO0FBQ3ZFLGlDQUFnQztBQUdoQyxtQ0FBbUM7QUFDbkMsTUFBTSxXQUFXLEdBQUcsQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUE7QUFVbEY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBb0JHO0FBQ0gsTUFBYSxXQUFZLFNBQVEsR0FBRyxDQUFDLFVBQVUsQ0FBQyxZQUFZO0lBSTFELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsUUFBMEIsRUFBRTtRQUVwRSxNQUFNLEVBQUUsYUFBYSxFQUFFLEdBQUcsS0FBSyxDQUFBO1FBQy9CLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFBO1FBRTNDLE1BQU0sUUFBUSxHQUFHLHNCQUFzQixDQUFBO1FBQ3ZDLE1BQU0sRUFBRSxHQUFHLEdBQUcsUUFBUSxlQUFlLENBQUE7UUFDckMsTUFBTSxTQUFTLEdBQUcsR0FBRyxFQUFFLGtCQUFrQixDQUFBO1FBRXpDLHFDQUFxQztRQUNyQyxJQUFJLGdCQUFnQixHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUE7UUFDdEQsSUFBSSxhQUFhO1lBQUUsZ0JBQWdCLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsSUFBSSxhQUFhLEVBQUUsQ0FBQyxDQUFBO1FBQzlGLE1BQU0sb0JBQW9CLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBRXZELE1BQU0sbUJBQW1CLEdBQUc7WUFDMUIsZ0NBQWdDO1lBQ2hDLE1BQU07WUFDTixJQUFJO1lBQ0o7Z0JBQ0UsWUFBWSxRQUFRLEVBQUU7Z0JBQ3RCLHNCQUFzQjtnQkFDdEIsTUFBTSxRQUFRLDZCQUE2QixvQkFBb0IsRUFBRTtnQkFDakUsMEJBQTBCO2dCQUMxQixTQUFTLFNBQVMsMEJBQTBCLFNBQVMsY0FBYztnQkFDbkUsdUJBQXVCO2dCQUN2QixVQUFVLEVBQUUsc0JBQXNCO2dCQUNsQyxVQUFVLEVBQUUscUNBQXFDO2dCQUNqRCxVQUFVLEVBQUUsU0FBUzthQUN0QixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7U0FDZixDQUFBO1FBRUQseURBQXlEO1FBQ3pELE1BQU0saUJBQWlCLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUNyRCxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUE7UUFFN0QsU0FBUztRQUNULE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7WUFDOUMsNENBQTRDO1lBQzVDLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUk7WUFDL0IsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBRWQscUZBQXFGO1lBQ3JGLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07WUFDdkMsU0FBUyxFQUFFLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFFMUMsUUFBUSxFQUFFO2dCQUNSLEtBQUssRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsYUFBYTtnQkFDdkQsT0FBTyxFQUFFLG1CQUFtQjthQUM3QjtTQUNGLENBQUMsQ0FBQTtRQUVGLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtRQUVwQyxxQ0FBcUM7UUFDckMsSUFBSSxDQUFDLFdBQVcsR0FBRztZQUNqQiw2R0FBNkc7WUFDN0csMkJBQTJCLEVBQ3pCLHFGQUFxRjtTQUN4RixDQUFBO1FBQ0QsNEJBQTRCO1FBQzVCLElBQUksQ0FBQyxlQUFlLEdBQUc7WUFDckIsU0FBUztZQUNULGlCQUFpQjtZQUNqQixhQUFhO1lBQ2IsaUJBQWlCO1lBQ2pCLHlCQUF5QjtZQUN6QixHQUFHLFdBQVc7U0FDZixDQUFBO0lBQ0gsQ0FBQztDQUNGO0FBekVELGtDQXlFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG4vLyBpbXBvcnQgeyBDb2RlLCBMYXllclZlcnNpb24sIExheWVyVmVyc2lvblByb3BzLCBSdW50aW1lIH0gZnJvbSBcIkBhd3MtY2RrL2F3cy1sYW1iZGFcIlxuLy8gaW1wb3J0IHsgQXNzZXRIYXNoVHlwZSwgQ29uc3RydWN0LCBJZ25vcmVNb2RlIH0gZnJvbSBcIkBhd3MtY2RrL2NvcmVcIlxuaW1wb3J0ICogYXMgY3J5cHRvIGZyb20gXCJjcnlwdG9cIlxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbi8vIGRlcHMgdG8gbnBtIGluc3RhbGwgdG8gdGhlIGxheWVyXG5jb25zdCBQUklTTUFfREVQUyA9IFtcInByaXNtYVwiLCBcIkBwcmlzbWEvbWlncmF0ZVwiLCBcIkBwcmlzbWEvc2RrXCIsIFwiQHByaXNtYS9jbGllbnRcIl1cblxuZXhwb3J0IGludGVyZmFjZSBQcmlzbWFMYXllclByb3BzIGV4dGVuZHMgT21pdDxjZGsuYXdzX2xhbWJkYS5MYXllclZlcnNpb25Qcm9wcywgXCJjb2RlXCI+IHtcbiAgLy8gZS5nLiAzLjEuMVxuICBwcmlzbWFWZXJzaW9uPzogc3RyaW5nXG5cbiAgLy8gc29tZSBtb3JlIG1vZHVsZXMgdG8gYWRkIHRvIHRoZSBsYXllclxuICBub2RlTW9kdWxlcz86IHN0cmluZ1tdXG59XG5cbi8qKlxuICogQ29uc3RydWN0IGEgbGFtYmRhIGxheWVyIHdpdGggUHJpc21hIGxpYnJhcmllcy5cbiAqIEJlIHN1cmUgdG8gb21pdCB0aGUgcHJpc21hIGxheWVyIG1vZHVsZXMgZnJvbSB5b3VyIGZ1bmN0aW9uIGJ1bmRsZXMgd2l0aCB0aGUgYGV4dGVybmFsTW9kdWxlc2Agb3B0aW9uLlxuICogSW5jbHVkZSBgZW52aXJvbm1lbnRgIHRvIHBvaW50IHByaXNtYSBhdCB0aGUgcmlnaHQgbGlicmFyeSBsb2NhdGlvbi5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqICAgY29uc3QgcHJpc21hTGF5ZXIgPSBuZXcgUHJpc21hTGF5ZXIodGhpcywgXCJQcmlzbWFMYXllclwiLCB7XG4gKiAgICAgbGF5ZXJWZXJzaW9uTmFtZTogYCR7aWR9LXByaXNtYWAsXG4gKiAgICAgcmVtb3ZhbFBvbGljeTogaXNQcm9kdWN0aW9uID8gUmVtb3ZhbFBvbGljeS5SRVRBSU4gOiBSZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gKiAgIH0pXG4gKlxuICogICAvLyBkZWZhdWx0IGxhbWJkYSBmdW5jdGlvbiBvcHRpb25zXG4gKiAgIGNvbnN0IGZ1bmN0aW9uT3B0aW9uczogRnVuY3Rpb25PcHRpb25zID0ge1xuICogICAgIGxheWVyczogW3ByaXNtYUxheWVyXSxcbiAqICAgICBlbnZpcm9ubWVudDogeyAuLi5wcmlzbWFMYXllci5lbnZpcm9ubWVudCwgREVCVUc6IFwiKlwiIH0sXG4gKiAgICAgYnVuZGxpbmc6IHtcbiAqICAgICAgIGV4dGVybmFsTW9kdWxlczogcHJpc21hTGF5ZXIuZXh0ZXJuYWxNb2R1bGVzLFxuICogICAgIH0sXG4gKiAgIH1cbiAqL1xuZXhwb3J0IGNsYXNzIFByaXNtYUxheWVyIGV4dGVuZHMgY2RrLmF3c19sYW1iZGEuTGF5ZXJWZXJzaW9uIHtcbiAgZXh0ZXJuYWxNb2R1bGVzOiBzdHJpbmdbXVxuICBlbnZpcm9ubWVudDogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBQcmlzbWFMYXllclByb3BzID0ge30pIHtcblxuICAgIGNvbnN0IHsgcHJpc21hVmVyc2lvbiB9ID0gcHJvcHNcbiAgICBjb25zdCBub2RlTW9kdWxlcyA9IHByb3BzLm5vZGVNb2R1bGVzIHx8IFtdXG5cbiAgICBjb25zdCBsYXllckRpciA9IFwiL2Fzc2V0LW91dHB1dC9ub2RlanNcIlxuICAgIGNvbnN0IG5tID0gYCR7bGF5ZXJEaXJ9L25vZGVfbW9kdWxlc2BcbiAgICBjb25zdCBlbmdpbmVEaXIgPSBgJHtubX0vQHByaXNtYS9lbmdpbmVzYFxuXG4gICAgLy8gd2hhdCBhcmUgd2UgYXNraW5nIG5wbSB0byBpbnN0YWxsP1xuICAgIGxldCBtb2R1bGVzVG9JbnN0YWxsID0gUFJJU01BX0RFUFMuY29uY2F0KG5vZGVNb2R1bGVzKVxuICAgIGlmIChwcmlzbWFWZXJzaW9uKSBtb2R1bGVzVG9JbnN0YWxsID0gbW9kdWxlc1RvSW5zdGFsbC5tYXAoKGRlcCkgPT4gYCR7ZGVwfUAke3ByaXNtYVZlcnNpb259YClcbiAgICBjb25zdCBtb2R1bGVzVG9JbnN0YWxsQXJncyA9IG1vZHVsZXNUb0luc3RhbGwuam9pbihcIiBcIilcblxuICAgIGNvbnN0IGNyZWF0ZUJ1bmRsZUNvbW1hbmQgPSBbXG4gICAgICAvLyBjcmVhdGUgYXNzZXQgYnVuZGxlIGluIGRvY2tlclxuICAgICAgXCJiYXNoXCIsXG4gICAgICBcIi1jXCIsXG4gICAgICBbXG4gICAgICAgIGBta2RpciAtcCAke2xheWVyRGlyfWAsXG4gICAgICAgIC8vIGluc3RhbGwgUFJJU01BX0RFUFNcbiAgICAgICAgYGNkICR7bGF5ZXJEaXJ9ICYmIEhPTUU9L3RtcCBucG0gaW5zdGFsbCAke21vZHVsZXNUb0luc3RhbGxBcmdzfWAsXG4gICAgICAgIC8vIGRlbGV0ZSB1bm5lZWRlZCBlbmdpbmVzXG4gICAgICAgIGBybSAtZiAke2VuZ2luZURpcn0vaW50cm9zcGVjdGlvbi1lbmdpbmUqICR7ZW5naW5lRGlyfS9wcmlzbWEtZm10KmAsXG4gICAgICAgIC8vIGdldCByaWQgb2Ygc29tZSBqdW5rXG4gICAgICAgIGBybSAtcmYgJHtubX0vcHJpc21hL2J1aWxkL3B1YmxpY2AsXG4gICAgICAgIGBybSAtcmYgJHtubX0vcHJpc21hL3ByaXNtYS1jbGllbnQvc3JjL19fdGVzdHNfX2AsXG4gICAgICAgIGBybSAtcmYgJHtubX0vQHR5cGVzYCxcbiAgICAgIF0uam9pbihcIiAmJiBcIiksXG4gICAgXVxuXG4gICAgLy8gaGFzaCBvdXIgcGFyYW1ldGVycyBzbyB3ZSBrbm93IHdoZW4gd2UgbmVlZCB0byByZWJ1aWxkXG4gICAgY29uc3QgYnVuZGxlQ29tbWFuZEhhc2ggPSBjcnlwdG8uY3JlYXRlSGFzaChcInNoYTI1NlwiKVxuICAgIGJ1bmRsZUNvbW1hbmRIYXNoLnVwZGF0ZShKU09OLnN0cmluZ2lmeShjcmVhdGVCdW5kbGVDb21tYW5kKSlcblxuICAgIC8vIGJ1bmRsZVxuICAgIGNvbnN0IGNvZGUgPSBjZGsuYXdzX2xhbWJkYS5Db2RlLmZyb21Bc3NldChcIi5cIiwge1xuICAgICAgLy8gZG9uJ3Qgc2VuZCBhbGwgb3VyIGZpbGVzIHRvIGRvY2tlciAoc2xvdylcbiAgICAgIGlnbm9yZU1vZGU6IGNkay5JZ25vcmVNb2RlLkdMT0IsXG4gICAgICBleGNsdWRlOiBbXCIqXCJdLFxuXG4gICAgICAvLyBpZiBvdXIgYnVuZGxlIGNvbW1hbmRzIChiYXNpY2FsbHkgb3VyIFwiZG9ja2VyZmlsZVwiKSBjaGFuZ2VzIHRoZW4gcmVidWlsZCB0aGUgaW1hZ2VcbiAgICAgIGFzc2V0SGFzaFR5cGU6IGNkay5Bc3NldEhhc2hUeXBlLkNVU1RPTSxcbiAgICAgIGFzc2V0SGFzaDogYnVuZGxlQ29tbWFuZEhhc2guZGlnZXN0KFwiaGV4XCIpLFxuXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBpbWFnZTogY2RrLmF3c19sYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWC5idW5kbGluZ0ltYWdlLFxuICAgICAgICBjb21tYW5kOiBjcmVhdGVCdW5kbGVDb21tYW5kLFxuICAgICAgfSxcbiAgICB9KVxuXG4gICAgc3VwZXIoc2NvcGUsIGlkLCB7IC4uLnByb3BzLCBjb2RlIH0pXG5cbiAgICAvLyBoaW50IGZvciBwcmlzbWEgdG8gZmluZCB0aGUgZW5naW5lXG4gICAgdGhpcy5lbnZpcm9ubWVudCA9IHtcbiAgICAgIC8vIFBSSVNNQV9RVUVSWV9FTkdJTkVfTElCUkFSWTogXCIvb3B0L25vZGVqcy9ub2RlX21vZHVsZXMvcHJpc21hL2xpYnF1ZXJ5X2VuZ2luZS1yaGVsLW9wZW5zc2wtMS4wLnguc28ubm9kZVwiLFxuICAgICAgUFJJU01BX1FVRVJZX0VOR0lORV9MSUJSQVJZOlxuICAgICAgICBcIi9vcHQvbm9kZWpzL25vZGVfbW9kdWxlcy9AcHJpc21hL2VuZ2luZXMvbGlicXVlcnlfZW5naW5lLXJoZWwtb3BlbnNzbC0xLjAueC5zby5ub2RlXCIsXG4gICAgfVxuICAgIC8vIG1vZHVsZXMgcHJvdmlkZWQgYnkgbGF5ZXJcbiAgICB0aGlzLmV4dGVybmFsTW9kdWxlcyA9IFtcbiAgICAgIFwiYXdzLXNka1wiLFxuICAgICAgXCJAcHJpc21hL21pZ3JhdGVcIixcbiAgICAgIFwiQHByaXNtYS9zZGtcIixcbiAgICAgIFwiQHByaXNtYS9lbmdpbmVzXCIsXG4gICAgICBcIkBwcmlzbWEvZW5naW5lcy12ZXJzaW9uXCIsXG4gICAgICAuLi5ub2RlTW9kdWxlcyxcbiAgICBdXG4gIH1cbn0iXX0=