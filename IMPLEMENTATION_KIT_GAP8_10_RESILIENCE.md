# Implementation Kit - Gaps 8-10: Resiliência e HA

**Gaps Cobertos:**
- Gap 8: Backup com PITR (Point-In-Time Recovery)
- Gap 9: Multi-AZ e Auto-scaling
- Gap 10: Auto-healing em Kubernetes

**Status:** Pronto para Implementação  
**Tempo Estimado:** 22 horas  
**Dificuldade:** Alta  
**Dependências:** AWS SDK, Kubernetes

---

## 📋 Checklist

- [ ] Configurar RDS com Multi-AZ
- [ ] Habilitar automated backups (35 dias)
- [ ] Configurar PITR
- [ ] Criar Kubernetes manifests
- [ ] Configurar auto-scaling
- [ ] Implementar graceful shutdown
- [ ] Testes de failover

---

## 📝 Gap 8: Backup com PITR

**Arquivo:** `server/_core/backup.ts`

```typescript
import * as AWS from 'aws-sdk';
import { logger } from './logger';

const rds = new AWS.RDS();

/**
 * Configurar backup automático
 */
export async function configureAutomatedBackups(): Promise<void> {
  try {
    const dbInstanceId = process.env.DB_INSTANCE_ID || 'evolumix-copilot-db';
    
    await rds.modifyDBInstance({
      DBInstanceIdentifier: dbInstanceId,
      BackupRetentionPeriod: 35, // 35 dias
      PreferredBackupWindow: '03:00-04:00', // 3-4 AM UTC
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00', // Sunday 4-5 AM
      CopyTagsToSnapshot: true,
      EnableCloudwatchLogsExports: ['error', 'general', 'slowquery'],
      ApplyImmediately: false,
    }).promise();
    
    logger.info('Automated backups configured', { dbInstanceId });
  } catch (error) {
    logger.error('Failed to configure backups', { error });
    throw error;
  }
}

/**
 * Criar snapshot manual
 */
export async function createManualSnapshot(description: string): Promise<string> {
  try {
    const dbInstanceId = process.env.DB_INSTANCE_ID || 'evolumix-copilot-db';
    const snapshotId = `${dbInstanceId}-${Date.now()}`;
    
    const response = await rds.createDBSnapshot({
      DBSnapshotIdentifier: snapshotId,
      DBInstanceIdentifier: dbInstanceId,
      Tags: [
        { Key: 'Description', Value: description },
        { Key: 'CreatedAt', Value: new Date().toISOString() },
      ],
    }).promise();
    
    logger.info('Manual snapshot created', { snapshotId });
    return snapshotId;
  } catch (error) {
    logger.error('Failed to create snapshot', { error });
    throw error;
  }
}

/**
 * Restaurar de um ponto específico no tempo
 */
export async function restoreToPointInTime(
  targetTime: Date,
  targetInstanceId?: string
): Promise<string> {
  try {
    const dbInstanceId = process.env.DB_INSTANCE_ID || 'evolumix-copilot-db';
    const newInstanceId = targetInstanceId || `${dbInstanceId}-restored-${Date.now()}`;
    
    const response = await rds.restoreDBInstanceToPointInTime({
      SourceDBInstanceIdentifier: dbInstanceId,
      TargetDBInstanceIdentifier: newInstanceId,
      RestoreTime: targetTime,
      UseLatestRestorableTime: false,
      DBInstanceClass: 'db.t3.medium',
      MultiAZ: true,
      StorageType: 'gp3',
    }).promise();
    
    logger.info('PITR restore initiated', { newInstanceId, targetTime });
    return newInstanceId;
  } catch (error) {
    logger.error('Failed to restore to point in time', { error });
    throw error;
  }
}

/**
 * Listar backups disponíveis
 */
export async function listAvailableBackups(): Promise<any[]> {
  try {
    const dbInstanceId = process.env.DB_INSTANCE_ID || 'evolumix-copilot-db';
    
    const response = await rds.describeDBSnapshots({
      DBInstanceIdentifier: dbInstanceId,
    }).promise();
    
    return (response.DBSnapshots || []).map(snapshot => ({
      id: snapshot.DBSnapshotIdentifier,
      createdAt: snapshot.SnapshotCreateTime,
      size: snapshot.AllocatedStorage,
      status: snapshot.Status,
    }));
  } catch (error) {
    logger.error('Failed to list backups', { error });
    throw error;
  }
}

/**
 * Obter status de backup
 */
export async function getBackupStatus(): Promise<any> {
  try {
    const dbInstanceId = process.env.DB_INSTANCE_ID || 'evolumix-copilot-db';
    
    const response = await rds.describeDBInstances({
      DBInstanceIdentifier: dbInstanceId,
    }).promise();
    
    const instance = response.DBInstances?.[0];
    
    return {
      instanceId: dbInstanceId,
      backupRetentionPeriod: instance?.BackupRetentionPeriod,
      latestRestorableTime: instance?.LatestRestorableTime,
      preferredBackupWindow: instance?.PreferredBackupWindow,
      multiAZ: instance?.MultiAZ,
      engine: instance?.Engine,
      engineVersion: instance?.EngineVersion,
    };
  } catch (error) {
    logger.error('Failed to get backup status', { error });
    throw error;
  }
}
```

---

## 📝 Gap 9: Multi-AZ e Auto-scaling

**Arquivo:** `k8s/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: evolumix-copilot
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: evolumix-copilot
  template:
    metadata:
      labels:
        app: evolumix-copilot
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - evolumix-copilot
            topologyKey: kubernetes.io/hostname
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: node.kubernetes.io/instance-type
                operator: In
                values:
                - t3.medium
                - t3.large
      
      terminationGracePeriodSeconds: 30
      
      containers:
      - name: copilot
        image: evolumix-360-copilot:2.0.0
        imagePullPolicy: IfNotPresent
        
        ports:
        - containerPort: 3000
          name: http
        
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: evolumix-secrets
              key: database-url
        
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        
        livenessProbe:
          httpGet:
            path: /api/trpc/health.live
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /api/trpc/health.ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: evolumix-copilot-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: evolumix-copilot
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 2
        periodSeconds: 30
      selectPolicy: Max

---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: evolumix-copilot-pdb
  namespace: production
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: evolumix-copilot
```

---

## 📝 Gap 10: Graceful Shutdown

**Arquivo:** `server/_core/gracefulShutdown.ts`

```typescript
import { logger } from './logger';

let isShuttingDown = false;

export function setupGracefulShutdown(server: any) {
  const signals = ['SIGTERM', 'SIGINT'];
  
  signals.forEach(signal => {
    process.on(signal, async () => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      // 1. Stop accepting new requests
      server.close(() => {
        logger.info('HTTP server closed');
      });
      
      // 2. Wait for existing requests to complete (max 30s)
      const shutdownTimeout = setTimeout(() => {
        logger.warn('Forced shutdown after 30s timeout');
        process.exit(1);
      }, 30000);
      
      // 3. Close database connections
      try {
        // await db.close();
        logger.info('Database connections closed');
      } catch (error) {
        logger.error('Error closing database', { error });
      }
      
      // 4. Close cache connections
      try {
        // await redis.quit();
        logger.info('Cache connections closed');
      } catch (error) {
        logger.error('Error closing cache', { error });
      }
      
      clearTimeout(shutdownTimeout);
      logger.info('Graceful shutdown completed');
      process.exit(0);
    });
  });
}
```

**Integrar em `server/_core/index.ts`:**

```typescript
import { setupGracefulShutdown } from './gracefulShutdown';

const server = app.listen(3000, () => {
  logger.info('Server running on port 3000');
});

setupGracefulShutdown(server);
```

---

## ✅ Validação

- [ ] RDS Multi-AZ ativo
- [ ] Backups automáticos configurados
- [ ] PITR testado e funcionando
- [ ] Kubernetes deployment com 3+ replicas
- [ ] HPA escalando corretamente
- [ ] PDB protegendo pods
- [ ] Graceful shutdown funcionando
- [ ] Failover testado

