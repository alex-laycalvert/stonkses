export type Holding = { amount: number } & (
    | {
          type: "stock" | "option";
          symbol: string;
          quantity: number;
          averageBuyPrice: number;
      }
    | {
          type: "account";
          accountType: "individual" | "ira_roth";
          nickname: string;
      }
);

export type Account = {
    brokerageAccountType: "individual" | "ira_roth";
    accountNumber: string;
    nickname: string;
    cash: number;
};

export type FullPosition = {
    url: string;
    instrument: string;
    instrumentId: string;
    symbol: string;
    account: string;
    accountNumber: string;
    brokerageAccountType: "individual";
    averageBuyPrice: number;
    pendingAverageBuyPrice: number;
    quantity: number;
    intradayAverageBuyPrice: number;
    intradayQuantity: number;
    sharesAvailableForExercise: number;
    sharesAvailableForSells: number;
    sharesHeldForBuys: number;
    sharesHeldForSells: number;
    sharesHeldForStockGrants: number;
    sharesHeldForOptionsCollateral: number;
    sharesHeldForOptionsEvents: number;
    sharesHeldForAssetTransfer: number;
    sharesPendingFromOptionsEvents: number;
    sharesAvailableForClosingShortPosition: number;
    ipoAllocatedQuantity: number;
    ipoDSPAllocatedQuantity: number;
    avgCostAffected: boolean;
    avgCostAffectedReason: string | null;
    isPrimaryAccount: boolean;
    updatedAt: string;
    createdAt: string;
    instrumentIsHalted: boolean;
    clearingCostBasis: number;
    clearingAverageCost: number | null;
    clearingRunningQuantity: number;
    clearingIntradayCostBasis: number | null;
    clearingIntradayRealizedGainLoss: number | null;
    clearingInterdayNetProceeds: number | null;
    clearingInterdayCloseQuantity: number | null;
    clearingIntradayRunningQuantity: number | null;
    clearingDirection: "debit" | "credit";
    customTaxLotSelectionEligible: boolean;
    hasSelectableLots: boolean;
    fetchTaxLotRelatedInfo: boolean;
    isPNLAccurate: boolean;
    validatedShortQuantity: number;
    type: string;
    fracsLiquidationPlacedAt: string | null;

    // Custom fields
    equity: number;
};

export type Quote = {
    askPrice: number;
    askSize: number;
    venueAskTime: string;
    askMic: string;
    askSource: string;
    bidPrice: number;
    bidSize: number;
    venueBidTime: string;
    bidMic: string;
    bidSource: string;
    lastTradePrice: number;
    venueLastTradeTime: string;
    lastExtendedHoursTradePrice: number;
    lastNonRegTradePrice: number;
    venueLastNonRegTradeTime: string;
    previousClose: number;
    adjustedPreviousClose: number;
    previousClosestring: string;
    symbol: string;
    tradingHalted: boolean;
    hasTraded: boolean;
    lastTradePriceSource: string;
    lastNonRegTradePriceSource: string;
    updatedAt: string;
    instrument: string;
    instrumentId: string;
    state: string;
};

export function holdingName(holding: Holding): string {
    if (holding.type === "account") {
        return holding.nickname || holding.accountType;
    } else {
        return holding.symbol;
    }
}
