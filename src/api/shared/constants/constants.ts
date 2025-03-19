import 'dotenv/config';
export const PAGINATION_TAKEN = 10;
export const MAX_PAGINATION_TAKEN = 200;
export const MIN_PAGINATION_TAKEN = 1;
export const NUM_FAN_ETH_TO_HOT = 10;
export const TIMING_BLOCK = 1;
export const ONE_DAY = 1000 * 60 * 60 * 24;
export const IS_PRODUCTION = process.env.APP_ENV == 'production';
export const IS_MAINNET = process.env.APP_ENV == 'production';
export const IS_DEV_NET_ON_PRODUCTION = Boolean(
  Number(process.env.IS_DEV_NET_ON_PRODUCTION || 0),
);
export const TIME_UNIT_MILLISECONDS = {
  FIVE_MINUTES: 300000, // five minutes in milliseconds
};
