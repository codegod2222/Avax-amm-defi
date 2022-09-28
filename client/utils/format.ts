import { BigNumber } from "ethers";

export const formatInContract = (
  share: string,
  precision: BigNumber
): BigNumber => {
  return BigNumber.from(share).mul(precision);
};

export const formatInClient = (
  share: BigNumber,
  precision: BigNumber
): string => {
  return share.div(precision).toString();
};
