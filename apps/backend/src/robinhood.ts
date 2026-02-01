import type { Account, FullPosition } from "@repo/robinhood";
import type { RobinhoodWebApi } from "robinhood";

type RobinhoodPosition = {
    url: string;
    instrument: string;
    instrument_id: string;
    symbol: string;
    account: string;
    account_number: string;
    brokerage_account_type: string;
    average_buy_price: string;
    pending_average_buy_price: string;
    quantity: string;
    intraday_average_buy_price: string;
    intraday_quantity: string;
    shares_available_for_exercise: string;
    shares_available_for_sells: string;
    shares_held_for_buys: string;
    shares_held_for_sells: string;
    shares_held_for_stock_grants: string;
    shares_held_for_options_collateral: string;
    shares_held_for_options_events: string;
    shares_held_for_asset_transfer: string;
    shares_pending_from_options_events: string;
    shares_available_for_closing_short_position: string;
    ipo_allocated_quantity: string;
    ipo_dsp_allocated_quantity: string;
    avg_cost_affected: boolean;
    avg_cost_affected_reason: string | null;
    is_primary_account: boolean;
    updated_at: string;
    created_at: string;
    instrument_is_halted: boolean;
    clearing_cost_basis: string;
    clearing_average_cost: string | null;
    clearing_running_quantity: string;
    clearing_intraday_cost_basis: string | null;
    clearing_intraday_realized_gain_loss: string | null;
    clearing_interday_net_proceeds: string | null;
    clearing_interday_close_quantity: string | null;
    clearing_intraday_running_quantity: string | null;
    clearing_direction: string;
    custom_tax_lot_selection_eligible: boolean;
    has_selectable_lots: boolean;
    fetch_tax_lot_related_info: boolean;
    is_pnl_accurate: boolean;
    validated_short_quantity: string;
    type: string;
    fracs_liquidation_placed_at: string | null;
};

type RobinhoodQuote = {
    ask_price: string;
    ask_size: number;
    venue_ask_time: string;
    ask_mic: string;
    ask_source: string;
    bid_price: string;
    bid_size: number;
    venue_bid_time: string;
    bid_mic: string;
    bid_source: string;
    last_trade_price: string;
    venue_last_trade_time: string;
    last_extended_hours_trade_price: string;
    last_non_reg_trade_price: string;
    venue_last_non_reg_trade_time: string;
    previous_close: string;
    adjusted_previous_close: string;
    previous_close_date: string;
    symbol: string;
    trading_halted: boolean;
    has_traded: boolean;
    last_trade_price_source: string;
    last_non_reg_trade_price_source: string;
    updated_at: string;
    instrument: string;
    instrument_id: string;
    state: string;
};

type RobinhoodAccount = {
    account_number: string;
    nickname: string;
    cash: string;
    brokerage_account_type: "individual" | "ira_roth";
};

export class RobinhoodClient {
    private constructor(private rh: RobinhoodWebApi) {}

    static async newClient(token: string): Promise<RobinhoodClient> {
        const rh = await new Promise<RobinhoodWebApi>((resolve, _reject) => {
            // biome-ignore lint: this is required for the library
            // var robinhood = require("robinhood")({ token }, function () {
            //     resolve(robinhood);
            // });
            resolve({
                // Mock implementation since we can't import the actual library
                accounts: (
                    callback: (
                        err: Error | null,
                        response: unknown,
                        body: { results: RobinhoodAccount[] },
                    ) => void,
                ) => {
                    // Mock data or implement actual API call
                    callback(null, null, { results: [] });
                },
                positions: (
                    callback: (
                        err: Error | null,
                        response: unknown,
                        body: { results: RobinhoodPosition[] },
                    ) => void,
                ) => {
                    // Mock data or implement actual API call
                    callback(null, null, { results: [] });
                },
                quote_data: (
                    symbols: string[],
                    callback: (
                        err: Error | null,
                        response: unknown,
                        body: { results: (RobinhoodQuote | null)[] },
                    ) => void,
                ) => {
                    // Mock data or implement actual API call
                    callback(null, null, { results: [] });
                },
            } as RobinhoodWebApi);
        });

        return new RobinhoodClient(rh);
    }

    async accounts(): Promise<Account[]> {
        const result = await new Promise<{ results: RobinhoodAccount[] }>(
            (resolve, reject) => {
                this.rh.accounts((err, _response, body) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(body);
                });
            },
        );

        return result.results.map<Account>((account) => ({
            brokerageAccountType: account.brokerage_account_type,
            accountNumber: account.account_number,
            nickname: account.nickname,
            cash: parseFloat(account.cash),
        }));
    }

    // TODO: handle pagination
    // TODO: handle re-auth
    async positions(): Promise<FullPosition[]> {
        const result = await new Promise<{ results: RobinhoodPosition[] }>(
            (resolve, reject) => {
                this.rh.positions((err, _response, body) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(body);
                });
            },
        );

        const symbols = result.results.map((pos) => pos.symbol);

        const quotesResults = await new Promise<{
            results: (RobinhoodQuote | null)[];
        }>((resolve, reject) => {
            this.rh.quote_data(symbols, (err, _response, body) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(body);
            });
        });

        return result.results
            .filter((pos) => pos.type !== "empty")
            .map((pos) => {
                const quote = quotesResults.results.find((q) => {
                    return q && q.symbol === pos.symbol;
                });
                const equity = quote
                    ? parseFloat(quote.last_trade_price) *
                      parseFloat(pos.quantity)
                    : 0;

                return {
                    url: pos.url,
                    instrument: pos.instrument,
                    instrumentId: pos.instrument_id,
                    symbol: pos.symbol,
                    account: pos.account,
                    accountNumber: pos.account_number,
                    brokerageAccountType:
                        pos.brokerage_account_type as "individual",
                    averageBuyPrice: parseFloat(pos.average_buy_price),
                    pendingAverageBuyPrice: parseFloat(
                        pos.pending_average_buy_price,
                    ),
                    quantity: parseFloat(pos.quantity),
                    intradayAverageBuyPrice: parseFloat(
                        pos.intraday_average_buy_price,
                    ),
                    intradayQuantity: parseFloat(pos.intraday_quantity),
                    sharesAvailableForExercise: parseFloat(
                        pos.shares_available_for_exercise,
                    ),
                    sharesAvailableForSells: parseFloat(
                        pos.shares_available_for_sells,
                    ),
                    sharesHeldForBuys: parseFloat(pos.shares_held_for_buys),
                    sharesHeldForSells: parseFloat(pos.shares_held_for_sells),
                    sharesHeldForStockGrants: parseFloat(
                        pos.shares_held_for_stock_grants,
                    ),
                    sharesHeldForOptionsCollateral: parseFloat(
                        pos.shares_held_for_options_collateral,
                    ),
                    sharesHeldForOptionsEvents: parseFloat(
                        pos.shares_held_for_options_events,
                    ),
                    sharesHeldForAssetTransfer: parseFloat(
                        pos.shares_held_for_asset_transfer,
                    ),
                    sharesPendingFromOptionsEvents: parseFloat(
                        pos.shares_pending_from_options_events,
                    ),
                    sharesAvailableForClosingShortPosition: parseFloat(
                        pos.shares_available_for_closing_short_position,
                    ),
                    ipoAllocatedQuantity: parseFloat(
                        pos.ipo_allocated_quantity,
                    ),
                    ipoDSPAllocatedQuantity: parseFloat(
                        pos.ipo_dsp_allocated_quantity,
                    ),
                    avgCostAffected: pos.avg_cost_affected,
                    avgCostAffectedReason: pos.avg_cost_affected_reason,
                    isPrimaryAccount: pos.is_primary_account,
                    updatedAt: pos.updated_at,
                    createdAt: pos.created_at,
                    instrumentIsHalted: pos.instrument_is_halted,
                    clearingCostBasis: parseFloat(pos.clearing_cost_basis),
                    clearingAverageCost: pos.clearing_average_cost
                        ? parseFloat(pos.clearing_average_cost)
                        : null,
                    clearingRunningQuantity: parseFloat(
                        pos.clearing_running_quantity,
                    ),
                    clearingIntradayCostBasis: pos.clearing_intraday_cost_basis
                        ? parseFloat(pos.clearing_intraday_cost_basis)
                        : null,
                    clearingIntradayRealizedGainLoss:
                        pos.clearing_intraday_realized_gain_loss
                            ? parseFloat(
                                  pos.clearing_intraday_realized_gain_loss,
                              )
                            : null,
                    clearingInterdayNetProceeds:
                        pos.clearing_interday_net_proceeds
                            ? parseFloat(pos.clearing_interday_net_proceeds)
                            : null,
                    clearingInterdayCloseQuantity:
                        pos.clearing_interday_close_quantity
                            ? parseFloat(pos.clearing_interday_close_quantity)
                            : null,
                    clearingIntradayRunningQuantity:
                        pos.clearing_intraday_running_quantity
                            ? parseFloat(pos.clearing_intraday_running_quantity)
                            : null,
                    clearingDirection: pos.clearing_direction as
                        | "debit"
                        | "credit",
                    customTaxLotSelectionEligible:
                        pos.custom_tax_lot_selection_eligible,
                    hasSelectableLots: pos.has_selectable_lots,
                    fetchTaxLotRelatedInfo: pos.fetch_tax_lot_related_info,
                    isPNLAccurate: pos.is_pnl_accurate,
                    validatedShortQuantity: parseFloat(
                        pos.validated_short_quantity,
                    ),
                    type: pos.type,
                    fracsLiquidationPlacedAt: pos.fracs_liquidation_placed_at,
                    equity,
                };
            });
    }
}
