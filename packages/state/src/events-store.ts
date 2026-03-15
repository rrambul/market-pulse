import { Signal } from 'signal-polyfill';
import type { TradeExecutedEvent, AlertTriggeredEvent } from '@market-pulse/contracts';

const MAX_TRADE_EVENTS = 500;
const MAX_ALERTS = 200;

/** Live trade event stream (capped buffer) */
export const tradeEvents = new Signal.State<TradeExecutedEvent[]>([]);

export function addTradeEvent(event: TradeExecutedEvent): void {
  const current = tradeEvents.get();
  const next = [event, ...current];
  if (next.length > MAX_TRADE_EVENTS) next.length = MAX_TRADE_EVENTS;
  tradeEvents.set(next);
}

export function clearTradeEvents(): void {
  tradeEvents.set([]);
}

/** Alerts buffer */
export const alerts = new Signal.State<AlertTriggeredEvent[]>([]);
const _unreadCount = new Signal.State(0);

export function addAlert(alert: AlertTriggeredEvent): void {
  const current = alerts.get();
  const next = [alert, ...current];
  if (next.length > MAX_ALERTS) next.length = MAX_ALERTS;
  alerts.set(next);
  _unreadCount.set(_unreadCount.get() + 1);
}

export function clearAlerts(): void {
  alerts.set([]);
  _unreadCount.set(0);
}

export const unreadAlertCount = new Signal.Computed(() => _unreadCount.get());

export function markAlertsRead(): void {
  _unreadCount.set(0);
}
