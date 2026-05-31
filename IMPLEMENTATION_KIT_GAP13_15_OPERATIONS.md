# Implementation Kit - Gaps 13-15: Operações Enterprise

**Gaps Cobertos:**
- Gap 13: SLA Monitoring (Uptime, Latência, Error Rate)
- Gap 14: Chaos Engineering (Resilience Testing)
- Gap 15: Cost Optimization

**Status:** Pronto para Implementação  
**Tempo Estimado:** 20 horas  
**Dificuldade:** Média  
**Dependências:** Prometheus, Chaos Mesh, AWS Cost Explorer

---

## 📋 Checklist

- [ ] Implementar SLA tracking
- [ ] Criar dashboards SLA
- [ ] Instalar Chaos Mesh
- [ ] Criar chaos experiments
- [ ] Configurar AWS Cost Explorer
- [ ] Implementar cost alerts
- [ ] Testes

---

## 📝 Gap 13: SLA Monitoring

**Arquivo:** `server/_core/slaMonitoring.ts`

```typescript
import { logger } from './logger';

interface SLAMetrics {
  uptime: number;
  p95Latency: number;
  errorRate: number;
  availability: number;
}

interface SLATarget {
  uptime: number; // 99.99%
  p95Latency: number; // 500ms
  errorRate: number; // 0.1%
  availability: number; // 99.95%
}

const SLA_TARGETS: SLATarget = {
  uptime: 99.99,
  p95Latency: 500,
  errorRate: 0.1,
  availability: 99.95,
};

let metrics = {
  totalRequests: 0,
  failedRequests: 0,
  totalLatency: 0,
  downtime: 0,
  startTime: Date.now(),
};

/**
 * Registrar request
 */
export function recordRequest(latency: number, success: boolean) {
  metrics.totalRequests++;
  metrics.totalLatency += latency;
  
  if (!success) {
    metrics.failedRequests++;
  }
}

/**
 * Registrar downtime
 */
export function recordDowntime(duration: number) {
  metrics.downtime += duration;
}

/**
 * Calcular SLA metrics
 */
export function calculateSLAMetrics(): SLAMetrics {
  const uptime = 100 - (metrics.downtime / (Date.now() - metrics.startTime)) * 100;
  const errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;
  const avgLatency = metrics.totalLatency / metrics.totalRequests;
  const p95Latency = avgLatency * 1.5; // Aproximação
  const availability = uptime;
  
  return {
    uptime,
    p95Latency,
    errorRate,
    availability,
  };
}

/**
 * Verificar conformidade com SLA
 */
export function checkSLACompliance(): {
  compliant: boolean;
  violations: string[];
} {
  const metrics = calculateSLAMetrics();
  const violations: string[] = [];
  
  if (metrics.uptime < SLA_TARGETS.uptime) {
    violations.push(`Uptime ${metrics.uptime.toFixed(2)}% < ${SLA_TARGETS.uptime}%`);
  }
  
  if (metrics.p95Latency > SLA_TARGETS.p95Latency) {
    violations.push(`P95 Latency ${metrics.p95Latency.toFixed(0)}ms > ${SLA_TARGETS.p95Latency}ms`);
  }
  
  if (metrics.errorRate > SLA_TARGETS.errorRate) {
    violations.push(`Error Rate ${metrics.errorRate.toFixed(2)}% > ${SLA_TARGETS.errorRate}%`);
  }
  
  if (metrics.availability < SLA_TARGETS.availability) {
    violations.push(`Availability ${metrics.availability.toFixed(2)}% < ${SLA_TARGETS.availability}%`);
  }
  
  return {
    compliant: violations.length === 0,
    violations,
  };
}

/**
 * Gerar SLA report
 */
export function generateSLAReport() {
  const metrics = calculateSLAMetrics();
  const compliance = checkSLACompliance();
  
  const report = {
    timestamp: new Date().toISOString(),
    period: {
      start: new Date(metrics.startTime).toISOString(),
      end: new Date().toISOString(),
    },
    metrics: {
      uptime: `${metrics.uptime.toFixed(2)}%`,
      p95Latency: `${metrics.p95Latency.toFixed(0)}ms`,
      errorRate: `${metrics.errorRate.toFixed(2)}%`,
      availability: `${metrics.availability.toFixed(2)}%`,
    },
    targets: {
      uptime: `${SLA_TARGETS.uptime}%`,
      p95Latency: `${SLA_TARGETS.p95Latency}ms`,
      errorRate: `${SLA_TARGETS.errorRate}%`,
      availability: `${SLA_TARGETS.availability}%`,
    },
    compliance: {
      compliant: compliance.compliant,
      violations: compliance.violations,
    },
  };
  
  logger.info('SLA Report Generated', report);
  return report;
}
```

**Integrar em Router:**

```typescript
export const systemRouter = router({
  slaMetrics: publicProcedure.query(async () => {
    return calculateSLAMetrics();
  }),
  
  slaReport: publicProcedure.query(async () => {
    return generateSLAReport();
  }),
  
  slaCompliance: publicProcedure.query(async () => {
    return checkSLACompliance();
  }),
});
```

---

## 📝 Gap 14: Chaos Engineering

**Arquivo:** `chaos/network-delay.yaml`

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: evolumix-network-delay
  namespace: chaos-testing
spec:
  action: delay
  mode: all
  selector:
    namespaces:
      - production
    labelSelectors:
      app: evolumix-copilot
  delay:
    latency: "100ms"
    jitter: "10ms"
  duration: "5m"
  scheduler:
    cron: "@daily"
```

**Arquivo:** `chaos/pod-failure.yaml`

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: evolumix-pod-failure
  namespace: chaos-testing
spec:
  action: pod-failure
  mode: fixed
  value: "1"
  selector:
    namespaces:
      - production
    labelSelectors:
      app: evolumix-copilot
  duration: "2m"
  scheduler:
    cron: "@weekly"
```

**Arquivo:** `chaos/cpu-stress.yaml`

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: StressChaos
metadata:
  name: evolumix-cpu-stress
  namespace: chaos-testing
spec:
  action: stress
  mode: fixed
  value: "1"
  selector:
    namespaces:
      - production
    labelSelectors:
      app: evolumix-copilot
  stressors:
    cpu:
      workers: 2
      load: 50
  duration: "3m"
  scheduler:
    cron: "@daily"
```

**Instalar Chaos Mesh:**

```bash
helm repo add chaos-mesh https://charts.chaos-mesh.org
helm install chaos-mesh chaos-mesh/chaos-mesh \
  -n chaos-testing \
  --create-namespace \
  --set chaosDaemon.privileged=true
```

---

## 📝 Gap 15: Cost Optimization

**Arquivo:** `terraform/cost-monitoring.tf`

```hcl
# CloudWatch Alarms para custos
resource "aws_cloudwatch_metric_alarm" "high_daily_cost" {
  alarm_name          = "evolumix-high-daily-cost"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "EstimatedCharges"
  namespace           = "AWS/Billing"
  period              = "86400"
  statistic           = "Maximum"
  threshold           = "100"
  alarm_description   = "Alert when daily cost exceeds $100"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    Currency = "USD"
  }
}

# Budget alert
resource "aws_budgets_budget" "evolumix_budget" {
  name              = "evolumix-monthly-budget"
  budget_type       = "MONTHLY"
  limit_unit        = "USD"
  limit_amount      = "1000"
  time_period_start = "2026-06-01_00:00:00"
  time_period_end   = "2087-12-31_23:59:59"

  cost_filters = {
    Service = ["Amazon Elastic Compute Cloud - Compute"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    notification_type          = "FORECASTED"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_channel_type  = "SNS"
    notification_channel_arn   = aws_sns_topic.alerts.arn
  }
}
```

**Arquivo:** `server/_core/costOptimization.ts`

```typescript
import * as AWS from 'aws-sdk';
import { logger } from './logger';

const ce = new AWS.CostExplorer();

/**
 * Obter custos por serviço
 */
export async function getCostByService(
  startDate: string,
  endDate: string
): Promise<any> {
  try {
    const response = await ce.getCostAndUsage({
      TimePeriod: {
        Start: startDate,
        End: endDate,
      },
      Granularity: 'DAILY',
      Metrics: ['UnblendedCost'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE',
        },
      ],
    }).promise();
    
    return response.ResultsByTime?.map(result => ({
      date: result.TimePeriod?.Start,
      costs: result.Groups?.map(group => ({
        service: group.Keys?.[0],
        cost: parseFloat(group.Metrics?.UnblendedCost?.Amount || '0'),
      })),
    }));
  } catch (error) {
    logger.error('Error getting cost by service', { error });
    throw error;
  }
}

/**
 * Obter recomendações de economia
 */
export async function getCostOptimizationRecommendations(): Promise<any> {
  try {
    const response = await ce.getReservationPurchaseRecommendation({
      Service: 'EC2',
      LookbackPeriod: 'THIRTY_DAYS',
      PaymentOption: 'ALL_UPFRONT',
    }).promise();
    
    return response.Recommendations?.map(rec => ({
      instanceType: rec.RecommendationDetails?.[0]?.InstanceDetails?.EC2InstanceDetails?.InstanceType,
      currentOnDemandCost: rec.CurrentOnDemandCost,
      estimatedReservationCost: rec.RecommendationDetails?.[0]?.EstimatedBreakdownCosts?.ReservationCost,
      estimatedSavings: rec.RecommendationDetails?.[0]?.EstimatedBreakdownCosts?.OnDemandCost,
    }));
  } catch (error) {
    logger.error('Error getting cost recommendations', { error });
    throw error;
  }
}

/**
 * Identificar recursos não utilizados
 */
export async function findUnusedResources(): Promise<any> {
  const recommendations: any[] = [];
  
  // EC2 instances
  const ec2 = new AWS.EC2();
  const instances = await ec2.describeInstances().promise();
  
  instances.Reservations?.forEach(reservation => {
    reservation.Instances?.forEach(instance => {
      if (instance.State?.Name === 'stopped') {
        recommendations.push({
          type: 'EC2',
          id: instance.InstanceId,
          recommendation: 'Terminate stopped instance',
          estimatedMonthlySavings: 50, // Aproximação
        });
      }
    });
  });
  
  return recommendations;
}
```

---

## 📊 Dashboards

### Grafana SLA Dashboard

```json
{
  "dashboard": {
    "title": "SLA Monitoring",
    "panels": [
      {
        "title": "Uptime %",
        "targets": [
          {
            "expr": "uptime_percentage"
          }
        ]
      },
      {
        "title": "P95 Latency",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds)"
          }
        ]
      },
      {
        "title": "Error Rate %",
        "targets": [
          {
            "expr": "error_rate_percentage"
          }
        ]
      }
    ]
  }
}
```

---

## ✅ Validação

- [ ] SLA metrics calculados corretamente
- [ ] Chaos experiments rodando
- [ ] Resiliência validada
- [ ] Cost monitoring ativo
- [ ] Recomendações de economia geradas
- [ ] Dashboards criados

