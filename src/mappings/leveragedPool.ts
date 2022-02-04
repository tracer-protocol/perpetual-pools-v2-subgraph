import {
	PoolInitialized, PoolRebalance
} from "../../generated/templates/LeveragedPool/LeveragedPool"
import { initPool } from "../utils/helper"
import { PoolRebalance as PoolRebalanceEntity } from "../../generated/schema"

// PoolInitialized(address indexed longToken, address indexed shortToken, address quoteToken, string poolName);
export function poolInitialized(event: PoolInitialized): void {
  let pool = initPool(
    event.address,
    event.block.timestamp,
    event.block.number,
    event.transaction.hash.toHexString(),
    event.params.longToken,
    event.params.shortToken
  )

  pool.save()
}

// PoolInitialized(address indexed longToken, address indexed shortToken, address quoteToken, string poolName);
export function poolRebalance(event: PoolRebalance): void {

  const poolRebalanceId = event.address.toHexString()+'-'+event.block.number.toString();
  let poolRebalance = new PoolRebalanceEntity(poolRebalanceId);

  poolRebalance.pool = event.address.toHexString()
  poolRebalance.blockNumber = event.block.number;
  poolRebalance.timestamp = event.block.timestamp;
  poolRebalance.shortBalanceChange = event.params.shortBalanceChange;
  poolRebalance.longBalanceChange = event.params.longBalanceChange;
  poolRebalance.longFeeAmount = event.params.longFeeAmount;
  poolRebalance.shortFeeAmount = event.params.shortFeeAmount;

  poolRebalance.save()
}
