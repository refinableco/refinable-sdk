export interface Price {
    currency: REFINABLE_CURRENCY;
    amount: number;
};
  
export enum REFINABLE_CURRENCY {
    BNB = 'BNB',
    USDT = 'USDT',
}
