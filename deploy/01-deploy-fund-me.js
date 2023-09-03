const { networkConfig, developmentChains } = require("../helper-hardhat-config")
// const helperConfig = require("../helper-hardhat-config")
// const networkConfig = helperConfig.networkConfig
// const { network } = require("hardhat")
const { verify } = require("../utils/verify")
require("dotenv").config()

// try {
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = await network.config.chainId
    // } catch (error) {console.log(error)}
    log(`!!!!!!!!!!!!!!: ${chainId}`)

    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    log("-------------------------------------------")
    log("Deploying FundMe and waiting for confirmation")
    // const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, [ethUsdPriceFeedAddress]) //verify
    }
    log("---------------------------------------------------------------")
}

module.exports.tags = ["all", "fundme"]
