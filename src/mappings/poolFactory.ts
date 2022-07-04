import { BigInt } from '@graphprotocol/graph-ts';
import { DeployPool } from '../../generated/PoolFactory/PoolFactory';
import { PoolFactory } from '../../generated/schema';
import { LeveragedPool } from '../../generated/templates';

export function handleDeployPool(event: DeployPool): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  LeveragedPool.create(event.params.pool);

  let factory = PoolFactory.load(event.params.pool.toHex());

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (factory == null) {
    factory = new PoolFactory(event.params.pool.toHex());

    // Entity fields can be set using simple assignments
    factory.poolsCount = BigInt.fromI32(0);
  }

  factory.poolsCount = factory.poolsCount.plus(BigInt.fromI32(1));

  // Entities can be written to the store with `.save()`
  factory.save();

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.deployPool(...)
  // - contract.fee(...)
  // - contract.feeReceiver(...)
  // - contract.getOwner(...)
  // - contract.isValidPool(...)
  // - contract.maxLeverage(...)
  // - contract.numPools(...)
  // - contract.owner(...)
  // - contract.pairTokenBase(...)
  // - contract.pairTokenBaseAddress(...)
  // - contract.poolBase(...)
  // - contract.poolBaseAddress(...)
  // - contract.poolCommitterDeployer(...)
  // - contract.poolKeeper(...)
  // - contract.pools(...)
}
