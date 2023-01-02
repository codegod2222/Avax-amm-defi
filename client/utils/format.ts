import { BigNumber } from "ethers";

export const formatWithPrecision = (
  share: string,
  precision: BigNumber
): BigNumber => {
  return BigNumber.from(share).mul(precision);
};

export const formatWithoutPrecision = (
  share: BigNumber,
  precision: BigNumber
): string => {
  return share.div(precision).toString();
};
