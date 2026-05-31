import { describe, it, expect, beforeEach } from 'vitest';
import { initializeFailover, getActiveRegion, triggerFailover, getRegionStatuses, getFailoverHistory, resetFailover } from '../_core/resilience/multiRegionFailover';

describe('Multi-Region Failover Router', () => {
  beforeEach(() => {
    resetFailover();
  });

  it('should initialize failover with regions', () => {
    const config = {
      regions: [
        {
          name: 'us-east-1',
          endpoint: 'https://us-east-1.example.com',
          healthy: true,
          lastHealthCheck: new Date(),
          responseTime: 50,
          failureCount: 0,
          successCount: 10,
        },
        {
          name: 'us-west-1',
          endpoint: 'https://us-west-1.example.com',
          healthy: true,
          lastHealthCheck: new Date(),
          responseTime: 60,
          failureCount: 0,
          successCount: 10,
        },
      ],
      primaryRegion: 'us-east-1',
      healthCheckInterval: 5000,
      failureThreshold: 3,
      recoveryTimeout: 30000,
    };

    initializeFailover(config);
    expect(getActiveRegion()).toBe('us-east-1');
  });

  it('should get active region', () => {
    const config = {
      regions: [
        {
          name: 'region-1',
          endpoint: 'https://region-1.example.com',
          healthy: true,
          lastHealthCheck: new Date(),
          responseTime: 50,
          failureCount: 0,
          successCount: 10,
        },
      ],
      primaryRegion: 'region-1',
      healthCheckInterval: 5000,
      failureThreshold: 3,
      recoveryTimeout: 30000,
    };

    initializeFailover(config);
    const activeRegion = getActiveRegion();
    expect(activeRegion).toBe('region-1');
  });

  it('should trigger failover to healthy region', () => {
    const config = {
      regions: [
        {
          name: 'primary',
          endpoint: 'https://primary.example.com',
          healthy: true,
          lastHealthCheck: new Date(),
          responseTime: 50,
          failureCount: 0,
          successCount: 10,
        },
        {
          name: 'secondary',
          endpoint: 'https://secondary.example.com',
          healthy: true,
          lastHealthCheck: new Date(),
          responseTime: 60,
          failureCount: 0,
          successCount: 10,
        },
      ],
      primaryRegion: 'primary',
      healthCheckInterval: 5000,
      failureThreshold: 3,
      recoveryTimeout: 30000,
    };

    initializeFailover(config);
    triggerFailover('primary');

    const activeRegion = getActiveRegion();
    expect(activeRegion).toBe('secondary');
  });

  it('should get region statuses', () => {
    const config = {
      regions: [
        {
          name: 'region-1',
          endpoint: 'https://region-1.example.com',
          healthy: true,
          lastHealthCheck: new Date(),
          responseTime: 50,
          failureCount: 0,
          successCount: 10,
        },
        {
          name: 'region-2',
          endpoint: 'https://region-2.example.com',
          healthy: false,
          lastHealthCheck: new Date(),
          responseTime: 1000,
          failureCount: 5,
          successCount: 0,
        },
      ],
      primaryRegion: 'region-1',
      healthCheckInterval: 5000,
      failureThreshold: 3,
      recoveryTimeout: 30000,
    };

    initializeFailover(config);
    const statuses = getRegionStatuses();

    expect(statuses).toHaveLength(2);
    expect(statuses[0].healthy).toBe(true);
    expect(statuses[1].healthy).toBe(false);
  });

  it('should track failover history', () => {
    const config = {
      regions: [
        {
          name: 'primary',
          endpoint: 'https://primary.example.com',
          healthy: true,
          lastHealthCheck: new Date(),
          responseTime: 50,
          failureCount: 0,
          successCount: 10,
        },
        {
          name: 'secondary',
          endpoint: 'https://secondary.example.com',
          healthy: true,
          lastHealthCheck: new Date(),
          responseTime: 60,
          failureCount: 0,
          successCount: 10,
        },
      ],
      primaryRegion: 'primary',
      healthCheckInterval: 5000,
      failureThreshold: 3,
      recoveryTimeout: 30000,
    };

    initializeFailover(config);
    triggerFailover('primary');

    const history = getFailoverHistory();
    expect(history).toHaveLength(1);
    expect(history[0].fromRegion).toBe('primary');
    expect(history[0].toRegion).toBe('secondary');
  });


});
