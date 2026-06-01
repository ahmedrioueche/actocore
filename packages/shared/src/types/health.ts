export type HealthStatus = 'ok' | 'degraded';

export type DependencyStatus = 'connected' | 'disconnected' | 'disabled';

export interface HealthCheckData {
  status: HealthStatus;
  environment: string;
  mongo: DependencyStatus;
  redis: DependencyStatus;
  database: string;
}
