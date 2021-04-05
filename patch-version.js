/* eslint-disable @typescript-eslint/no-var-requires */

const nbgv = require("nerdbank-gitversioning");

async function setPackageVersion() {
    const versionText = await nbgv.getVersion().catch(e => console.log(e));
    const npmPackageVersion = versionText.npmPackageVersion;
    console.log(`Setting package version to ${npmPackageVersion}`);
    await nbgv.setPackageVersion("./dist").catch(e => console.log(e));
}

setPackageVersion();
