const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

describe("FundMe", async function () {
    let deployer
    let fundMe
    let mockV3Aggregator
    const sendValue = ethers.utils.parseEther("1")
    beforeEach(async () => {
        // deploy fundMe contract using Hardhat-deploy
        // const accounts = await ethers.getSigners()
        // const accountZero = accounts[0]
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        // returns the most recent contract
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
    })

    describe("constructor", async function () {
        it("sets the aggregator addresses correctly", async () => {
            const response = await fundMe.getPriceFeed()
            assert.equal(response, mockV3Aggregator.address)
        })
    })

    describe("fund", async () => {
        it("Fails if you don't send enough ETH", async () => {
            await expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH!")
        })
        it("Updated the amount funded data structure", async () => {
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.getAddressToAmountFunded(deployer)
            assert.equal(response.toString(), sendValue.toString())
        })
        it("Adds funder to array of getFunders", async () => {
            await fundMe.fund({ value: sendValue })
            const funder = await fundMe.getFunders(0)
            assert.equal(funder, deployer)
        })
    })
    describe("withdraw", async () => {
        beforeEach(async () => {
            await fundMe.fund({ value: sendValue })
        })
        it("Withdraw ETH from a single funder", async () => {
            // Arrange
            // Can use eth.provider instead as well!
            const stratingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

            // Act
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait()
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            // gasUsed and effectiveGasPrice are BigNumbers and hence use "mul"!
            // const gasCost = gasUsed * effectiveGasPrice
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
            // Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                stratingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString(),
            )
        })

        it("Withdraw ETH from a single funder with cheaper Gas!", async () => {
            // Arrange
            // Can use eth.provider instead as well!
            const stratingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

            // Act
            const transactionResponse = await fundMe.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait()
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            // gasUsed and effectiveGasPrice are BigNumbers and hence use "mul"!
            // const gasCost = gasUsed * effectiveGasPrice
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
            // Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                stratingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString(),
            )
        })
        it("Allow us to withdraw with multiple getFunders", async () => {
            // Arrange
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6 /*getFunders.length*/; i++) {
                const fundMeConnectedContreact = await fundMe.connect(accounts[i])
                await fundMeConnectedContreact.fund({ value: sendValue })
            }
            const stratingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

            // Act
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

            // Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                stratingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString(),
            )

            // Make sure that the getFunders are reset properly
            await expect(fundMe.getFunders(0)).to.be.reverted
            for (i = 1; i < 6; i++) {
                assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0)
            }
        })

        it("Only allows the owner to withdraw", async () => {
            const accounts = ethers.getSigners()
            const attacker = accounts[1]
            const attackerConnectedContract = await fundMe.connect(attacker)
            await expect(attackerConnectedContract.withdraw()).to.be.reverted
        })

        it("cheaperWithdraw testing ...", async () => {
            // Arrange
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6 /*getFunders.length*/; i++) {
                const fundMeConnectedContreact = await fundMe.connect(accounts[i])
                await fundMeConnectedContreact.fund({ value: sendValue })
            }
            const stratingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

            // Act
            const transactionResponse = await fundMe.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

            // Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                stratingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString(),
            )

            // Make sure that the getFunders are reset properly
            await expect(fundMe.getFunders(0)).to.be.reverted
            for (i = 1; i < 6; i++) {
                assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0)
            }
        })
    })
})
