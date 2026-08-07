export interface GridpassLedgerEvent {
  eventId: string;
  userId: string;
  eventType:
    | 'CREDIT_GRANT'
    | 'SL_REGION_CHECKIN'
    | 'TRAIL_PASS_SCAN'
    | 'SIM_RIG_SESSION'
    | 'FOOD_TRUCK_SCAN'
    | 'VEHICLE_STAGE';
  amountDelta: number;
  metricDelta?: {
    timeOnGridSeconds?: number;
    simFps?: number;
    timeDilation?: number;
    distanceMiles?: number;
  };
  dedupKey: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export function computeLedgerSummary(events: GridpassLedgerEvent[]) {
  return events.reduce(
    (acc, event) => {
      acc.totalCredits += event.amountDelta || 0;
      if (event.metricDelta?.timeOnGridSeconds) {
        acc.totalGridTimeSeconds += event.metricDelta.timeOnGridSeconds;
      }
      acc.eventCount += 1;
      return acc;
    },
    { totalCredits: 0, totalGridTimeSeconds: 0, eventCount: 0 }
  );
}
