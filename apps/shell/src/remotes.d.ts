// Module Federation remote module declarations
declare module 'marketOverview/MarketOverview' {
  import { MpMarketOverview } from './market-overview';
  export default MpMarketOverview;
}

declare module 'watchlist/WatchlistPanel' {
  import { MpWatchlistPanel } from './watchlist-panel';
  export default MpWatchlistPanel;
}

declare module 'assetDetails/AssetDetails' {
  import { MpAssetDetails } from './asset-details';
  export default MpAssetDetails;
}

declare module 'tradeStream/TradeStream' {
  import { MpTradeStream } from './trade-stream';
  export default MpTradeStream;
}

declare module 'alerts/AlertsPanel' {
  import { MpAlertsPanel } from './alerts-panel';
  export default MpAlertsPanel;
}
