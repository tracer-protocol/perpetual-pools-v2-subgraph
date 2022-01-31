import { Address, BigDecimal, BigInt, Bytes, log, TypedMap } from "@graphprotocol/graph-ts";
import { LeveragedPool,  } from "../../generated/templates/LeveragedPool/LeveragedPool";
import { ERC20 } from "../../generated/templates/LeveragedPool/ERC20";
import { PoolSwapLibrary } from "../../generated/templates/PoolCommitter/PoolSwapLibrary";
import { LeveragedPool as LeveragedPoolEntity, LeveragedPoolByPoolCommitter } from "../../generated/schema"

import { PoolCommitter, PoolKeeper } from "../../generated/templates"

// TODO make this more dynamic
// this is not stored on chain anywhere so must be manually hardcoded per network

// arb rinkeby
const _poolSwapLibraryAddress = '0xB4BdF72F339133c31CEEa875c99E0AeDFe696c31'

export const poolSwapLibraryAddress = Address.fromString(_poolSwapLibraryAddress);

export function initPool(
	address: Address,
	timestamp: BigInt,
	blockNumber: BigInt,
	txnHash: string,
	longToken: Address | null,
	shortToken: Address | null
): LeveragedPoolEntity {
	let pool = new LeveragedPoolEntity(address.toHex())
	let contract = LeveragedPool.bind(address)

	pool.name = contract.poolName()
	pool.keeper = contract.keeper()
	pool.committer = contract.poolCommitter()
	pool.quoteToken = contract.quoteToken()
	pool.oracle = contract.oracleWrapper()
	pool.feeReceiver = contract.feeAddress()
	pool.frontRunningInterval = contract.frontRunningInterval()
	pool.tradingFee = contract.fee()
	pool.updateInterval = contract.updateInterval()
	pool.lastPriceTimestamp = contract.lastPriceTimestamp()
	pool.timestamp = timestamp
	pool.blockNumber = blockNumber
	pool.txnHash = txnHash
	pool.paused = contract.paused()

	if(longToken) {
		pool.longToken = longToken as Address
	}
	if(shortToken) {
		pool.shortToken = shortToken as Address
	}

	let quoteToken = ERC20.bind(contract.quoteToken())
	pool.quoteTokenDecimals = BigInt.fromI32(quoteToken.decimals())

	let leveragedPoolByPoolCommitter = new LeveragedPoolByPoolCommitter(pool.committer.toHexString());
	leveragedPoolByPoolCommitter.pool = address;

	leveragedPoolByPoolCommitter.save();

	PoolKeeper.create(contract.keeper())
	PoolCommitter.create(contract.poolCommitter())

	return pool;
}

export function fromWad(wadValue: BigInt, decimals: BigInt): BigDecimal {
	let MAX_DECIMALS = BigInt.fromI32(18)
	let u8Decimals = u8(MAX_DECIMALS.minus(decimals).toI32());
	let scaler = BigInt.fromI32(10).pow(u8Decimals);
	return wadValue.toBigDecimal().div(scaler.toBigDecimal());
}

export function formatUnits(value: BigInt, decimals: BigInt): BigDecimal {
	let u8Decimals = u8(decimals.toI32());
	let scaler = BigInt.fromI32(10).pow(u8Decimals);
	return value.toBigDecimal().div(scaler.toBigDecimal());
}

export function formatDecimalUnits(value: BigDecimal, decimals: BigInt): BigDecimal {
	let u8Decimals = u8(decimals.toI32());
	let scaler = BigInt.fromI32(10).pow(u8Decimals);
	return value.div(scaler.toBigDecimal());
}

export function floatingPointBytesToInt(bytes: Bytes, decimals: BigInt): BigInt {
	const poolSwapLibrary = PoolSwapLibrary.bind(poolSwapLibraryAddress);

	// TODO: this still isn't quite right
	const normalizer = BigInt.fromI32(1).times(BigInt.fromI32(10).pow(u8(decimals.toI32())))
	const normalizedBytes = poolSwapLibrary.multiplyDecimalByUInt(bytes, normalizer);
	const convertedBytes = poolSwapLibrary.convertDecimalToUInt(normalizedBytes);

	return convertedBytes
}
