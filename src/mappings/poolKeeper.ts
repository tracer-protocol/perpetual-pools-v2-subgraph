import { UpkeepSuccess, KeeperPayment, Upkeep } from '../../generated/schema';
import { UpkeepSuccessful, KeeperPaid } from '../../generated/templates/PoolKeeper/PoolKeeper';

// event UpkeepSuccessful(address indexed pool, bytes data, int256 indexed startPrice, int256 indexed endPrice);
export function upkeepSuccessful(event: UpkeepSuccessful): void {
	let upkeepSuccessId = event.params.pool.toHexString()+"-"+event.block.number.toString();

  let upkeepSuccess = new UpkeepSuccess(upkeepSuccessId);
  let upkeep = Upkeep.load(upkeepSuccessId);

  if(upkeep) {
    upkeep.startPrice = event.params.startPrice;
    upkeep.endPrice = event.params.endPrice;

    upkeep.save();
  }

  upkeepSuccess.startPrice = event.params.startPrice;
  upkeepSuccess.endPrice = event.params.endPrice;
  upkeepSuccess.data = event.params.data;
  upkeepSuccess.blockNumber = event.block.number;
  upkeepSuccess.timestamp = event.block.timestamp;

  upkeepSuccess.save();
}


// event KeeperPaid(address indexed _pool, address indexed keeper, uint256 reward);
export function keeperPaid(event: KeeperPaid): void {
	let keeperPayment = new KeeperPayment(event.transaction.hash.toHexString())

  keeperPayment.pool = event.params._pool.toHexString();
  keeperPayment.keeper = event.params.keeper;
  keeperPayment.timestamp = event.block.timestamp;
  keeperPayment.blockNumber = event.block.number;
  keeperPayment.reward = event.params.reward;

	keeperPayment.save();
}