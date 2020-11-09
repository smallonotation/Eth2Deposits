import { BigInt, BigDecimal } from "@graphprotocol/graph-ts"
import { Contract, DepositEvent } from "../generated/Contract/Contract"
import { Deposit, Depositor, DepositDayData, Status } from "../generated/schema"

export function handleDepositEvent(event: DepositEvent): void {
  // Declare Deposit
  let deposit = Deposit.load(event.transaction.hash.toHex())
  // Declare DepositDayData
  let timestamp = event.block.timestamp.toI32() // Timestamp
  let dayID = timestamp / 86400 // Timestamp as Day
  let dayStartTimestamp = dayID * 86400 // Timestamp as beginning of day
  let depositDayData = DepositDayData.load(dayID.toString())
  // Declare Status
  let status = Status.load(event.transaction.from.toHex())
  // Declare Depositor
  let depositor = Depositor.load(event.transaction.from.toHex())

  // Define Status
  status = Status.load("1")
  if (status == null) {
    status = new Status("1")
    status.genesisTime = BigInt.fromI32(1606824000)
    status.genesisTimeValid = false
    status.totalDeposits = BigInt.fromI32(0)
    status.totalAmountDeposited = BigInt.fromI32(0)
    status.totalDepositors = BigInt.fromI32(0)
  }
  status.totalDeposits = status.totalDeposits.plus(BigInt.fromI32(1))

  // Define Depositor
  if (depositor == null) {
    depositor = new Depositor(event.transaction.from.toHex())
    depositor.depositCount = BigInt.fromI32(0)
    depositor.totalAmountDeposited = BigInt.fromI32(0)
    // Adds a new depositor
    status.totalDepositors = status.totalDepositors.plus(BigInt.fromI32(1))
  }
  depositor.depositCount = depositor.depositCount.plus(BigInt.fromI32(1))

  // Define Deposit
  deposit = new Deposit(event.transaction.hash.toHex())
  deposit.public_Key = event.params.pubkey
  deposit.amount = BigInt.fromUnsignedBytes(event.params.amount)
  deposit.timestamp = event.block.timestamp
  deposit.depositor = event.transaction.from.toHex()

  // Total amount addition
  depositor.totalAmountDeposited = depositor.totalAmountDeposited.plus(deposit.amount)
  status.totalAmountDeposited = status.totalAmountDeposited.plus(deposit.amount)

  // Define DepositDayData
  if (depositDayData == null) {
    depositDayData = new DepositDayData(dayID.toString())
    depositDayData.date = BigInt.fromI32(dayStartTimestamp)
    depositDayData.dailyDeposits = BigInt.fromI32(0)
  }
  depositDayData.dailyDeposits = depositDayData.dailyDeposits.plus(BigInt.fromI32(1))

  if (status.totalDeposits == BigInt.fromI32(16384)) {
    if (status.genesisTime.minus(BigInt.fromI32(604800)) < deposit.timestamp) {
      status.genesisTime = deposit.timestamp.plus(BigInt.fromI32(604800))
    }
    status.genesisTimeValid = true
  }

  // Save
  depositor.save()
  deposit.save()
  depositDayData.save()
  status.save()
}
