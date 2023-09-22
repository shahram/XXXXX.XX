const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe Staging Tests", async () => {
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther("0.1")
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })

          /* describe("FundMe", async function () {
    let fundMe
    let deployer
    const sendValue = ethers.utils.parseEther("1")

    beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        fundMe = await ethers.getContract("FundMe", deployer)
    }) */

          it("Allows people to fund and withdraw", async () => {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)

              assert.equal(endingFundMeBalance.toString(), "0")
          })
      })
