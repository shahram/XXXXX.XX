// const { networkConfig } = require("../helper-hardhat-config")
const helperConfig = require("../helper-hardhat-config")
const networkConfig = helperConfig.networkConfig
// const { network } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = await network.config.chainId

    log(`!!!!!!!!!!!!!!: ${chainId}`)
    try {
        const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    } catch (error) {
        console.error(error)
    }
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [address],
        log: true,
    })
}
