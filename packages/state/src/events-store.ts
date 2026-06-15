import { Signal } from 'signal-polyfill';
import type { TradeExecutedEvent, AlertTriggeredEvent } from '@market-pulse/contracts';

const MAX_TRADE_EVENTS = 500;
const MAX_ALERTS = 200;

/**
 * Prepend a batch of newest-first events onto a capped buffer in a single
 * allocation. `incoming` is in chronological (oldest→newest) order, so it is
 * reversed onto the front. Doing this once per frame — instead of once per
 * event — turns O(n) array copies per tick into O(n) per animation frame.
 */
function prepend<T>(incoming: readonly T[], current: readonly T[], max: number): T[] {
  const next: T[] = [];
  for (let i = incoming.length - 1; i >= 0 && next.length < max; i--) next.push(incoming[i]);
  for (let i = 0; i < current.length && next.length < max; i++) next.push(current[i]);
  return next;
}

/** Live trade event stream (capped buffer, newest first). */
export const tradeEvents = new Signal.State<readonly TradeExecutedEvent[]>([]);

export function addTradeEvents(events: readonly TradeExecutedEvent[]): void {
  if (events.length === 0) return;
  tradeEvents.set(prepend(events, tradeEvents.get(), MAX_TRADE_EVENTS));
}

export function addTradeEvent(event: TradeExecutedEvent): void {
  addTradeEvents([event]);
}

export function clearTradeEvents(): void {
  tradeEvents.set([]);
}

/** Alerts buffer (capped, newest first). */
export const alerts = new Signal.State<readonly AlertTriggeredEvent[]>([]);

/** Unread alert counter. Tracked separately because the alert buffer is capped
 *  and can be cleared independently of the unread badge. */
export const unreadAlertCount = new Signal.State(0);

export function addAlerts(incoming: readonly AlertTriggeredEvent[]): void {
  if (incoming.length === 0) return;
  alerts.set(prepend(incoming, alerts.get(), MAX_ALERTS));
  unreadAlertCount.set(unreadAlertCount.get() + incoming.length);
}

export function addAlert(alert: AlertTriggeredEvent): void {
  addAlerts([alert]);
}

export function clearAlerts(): void {
  alerts.set([]);
  unreadAlertCount.set(0);
}

export function markAlertsRead(): void {
  unreadAlertCount.set(0);
}
