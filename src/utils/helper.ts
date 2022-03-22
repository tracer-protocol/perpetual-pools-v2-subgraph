import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { LeveragedPool,  } from "../../generated/templates/LeveragedPool/LeveragedPool";
import { ERC20 } from "../../generated/templates/LeveragedPool/ERC20";
import { PoolSwapLibrary } from "../../generated/templates/PoolCommitter/PoolSwapLibrary";
import {
	LeveragedPool as LeveragedPoolEntity,
	LeveragedPoolByPoolCommitter,
	UserAggregateBalance,
	CachedConvertedBytesToUint
} from "../../generated/schema"

import { PoolCommitter, PoolKeeper } from "../../generated/templates"

// TODO make this more dynamic
// this is not stored on chain anywhere so must be manually hardcoded per network

// arb rinkeby
const _poolSwapLibraryAddress = '0x390Fa25d12852111F8F5f9527Dad613C66103635'

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
	pool.settlementToken = contract.settlementToken()
	pool.oracle = contract.oracleWrapper()
	pool.feeReceiver = contract.feeAddress()
	pool.frontRunningInterval = contract.frontRunningInterval()
	pool.tradingFee = contract.fee()
	pool.updateInterval = contract.updateInterval()
	pool.lastPriceTimestamp = contract.lastPriceTimestamp()
	pool.timestamp = timestamp
	pool.blockNumber = blockNumber
	pool.txnHash = txnHash
	pool.leverage = floatingPointBytesToInt(contract.leverageAmount(), new BigInt(0))
	pool.paused = contract.paused()

	if(longToken) {
		pool.longToken = longToken as Address
	}
	if(shortToken) {
		pool.shortToken = shortToken as Address
	}

	let settlementToken = ERC20.bind(contract.settlementToken())
	pool.settlementTokenDecimals = BigInt.fromI32(settlementToken.decimals())

	let leveragedPoolByPoolCommitter = new LeveragedPoolByPoolCommitter(pool.committer.toHexString());
	leveragedPoolByPoolCommitter.pool = address;

	leveragedPoolByPoolCommitter.save();

	PoolKeeper.create(contract.keeper())
	PoolCommitter.create(contract.poolCommitter())

	return pool;
}

export function initUserAggregateBalance(
	pool: string,
	user: Bytes
): UserAggregateBalance {
	const aggregateBalanceId = pool + "-" + user.toHexString();
	const aggregateBalance = new UserAggregateBalance(aggregateBalanceId);
	aggregateBalance.pool = pool;
	aggregateBalance.trader = user;
	aggregateBalance.longTokenHolding = BigInt.fromI32(0);
	aggregateBalance.shortTokenHolding = BigInt.fromI32(0);
	aggregateBalance.settlementTokenHolding = BigInt.fromI32(0);
	aggregateBalance.longTokenAvgBuyIn = BigInt.fromI32(0);
	aggregateBalance.shortTokenAvgBuyIn = BigInt.fromI32(0);

	return aggregateBalance;
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


export function calcWeightedAverage(tokens: BigInt[], prices: BigInt[]): BigInt{

	let numerator = BigInt.fromI32(0);
	let denominator = BigInt.fromI32(0);
	for (let i = 0; i < tokens.length; i++) {
		numerator = numerator.plus(tokens[i].times(prices[i]))
		denominator = denominator.plus(tokens[i]);
	}

	if (denominator.equals(BigInt.fromI32(0))) {
		return BigInt.fromI32(0);
	}
	return numerator.div(denominator)
}

export function floatingPointBytesToInt(bytes: Bytes, decimals: BigInt): BigInt {
	const cacheId = bytes.toHexString()+'-'+decimals.toString();
	const cachedResult = CachedConvertedBytesToUint.load(cacheId);

	if(cachedResult) {
		return cachedResult.value;
	}

	const poolSwapLibrary = PoolSwapLibrary.bind(poolSwapLibraryAddress);

	const normalizer = BigInt.fromI32(10).pow(u8(decimals.toI32()))
	const normalizedBytes = poolSwapLibrary.multiplyDecimalByUInt(bytes, normalizer);
	const convertedBytes = poolSwapLibrary.convertDecimalToUInt(normalizedBytes);

	const newCacheEntry = new CachedConvertedBytesToUint(cacheId);
	newCacheEntry.value = convertedBytes;
	newCacheEntry.save();

	return convertedBytes
}
