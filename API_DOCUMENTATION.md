# Evolumix 360 Technical Copilot - API Documentation

## Overview

Evolumix 360 Technical Copilot é uma plataforma consultiva de IA com conformidade internacional (FIPS 140-2, ISO 27001, OWASP). Todas as operações são realizadas através de **tRPC** (Type-safe Remote Procedure Calls).

## Base URL

```
https://evolucopil-pk69zyag.manus.space/api/trpc
```

## Authentication

Todas as requisições requerem autenticação via **Manus OAuth**. O token é armazenado em cookie de sessão automaticamente após login.

## tRPC Routers

### 1. Auth Router (`auth.*`)

**Endpoints:**
- `auth.me` - Obter usuário atual
- `auth.logout` - Fazer logout

**Exemplo:**
```typescript
const user = await trpc.auth.me.useQuery();
await trpc.auth.logout.useMutation();
```

### 2. Documents Router (`documents.*`)

**Endpoints:**
- `documents.list` - Listar documentos
- `documents.upload` - Fazer upload de documento
- `documents.get` - Obter documento específico
- `documents.delete` - Deletar documento
- `documents.getVersions` - Obter versões de um documento

**Exemplo:**
```typescript
const docs = await trpc.documents.list.useQuery();
await trpc.documents.upload.useMutation({
  file: formData,
  title: "Technical Spec",
  version: "1.0"
});
```

### 3. Copilot Router (`copilot.*`)

**Endpoints:**
- `copilot.chat` - Enviar mensagem ao copiloto
- `copilot.getHistory` - Obter histórico de chat
- `copilot.clearHistory` - Limpar histórico

**Exemplo:**
```typescript
const response = await trpc.copilot.chat.useMutation({
  message: "Qual é a melhor prática para...",
  documentIds: ["doc1", "doc2"]
});
```

### 4. Diagnostics Router (`diagnostics.*`)

**Endpoints:**
- `diagnostics.create` - Criar novo diagnóstico
- `diagnostics.list` - Listar diagnósticos
- `diagnostics.get` - Obter diagnóstico específico
- `diagnostics.analyze` - Analisar diagnóstico

**Exemplo:**
```typescript
const diagnostic = await trpc.diagnostics.create.useMutation({
  area: "Production Floor",
  flowPeople: 150,
  currentProducts: ["Product A", "Product B"],
  currentConsumption: 500,
  currentCost: 5000
});
```

### 5. ROI Router (`roi.*`)

**Endpoints:**
- `roi.calculate` - Calcular ROI
- `roi.getHistory` - Obter histórico de cálculos
- `roi.export` - Exportar relatório de ROI

**Exemplo:**
```typescript
const roi = await trpc.roi.calculate.useMutation({
  costPerLiter: 10,
  yield: 95,
  currentConsumption: 500,
  currentCost: 5000
});
```

### 6. Compliance Router (`compliance.*`)

**Endpoints:**
- `compliance.scan` - Executar scan de conformidade
- `compliance.getStatus` - Obter status de conformidade
- `compliance.getReport` - Obter relatório de conformidade
- `compliance.getControls` - Obter controles de segurança
- `compliance.validateControl` - Validar controle específico

**Exemplo:**
```typescript
const scan = await trpc.compliance.scan.useMutation();
const report = await trpc.compliance.getReport.useQuery();
```

### 7. Encryption Router (`encryption.*`)

**Endpoints:**
- `encryption.encrypt` - Criptografar dados
- `encryption.decrypt` - Descriptografar dados
- `encryption.generateHash` - Gerar hash SHA-256
- `encryption.validateHMAC` - Validar HMAC
- `encryption.getStatus` - Status de criptografia

**Exemplo:**
```typescript
const encrypted = await trpc.encryption.encrypt.useMutation({
  data: "Sensitive data",
  algorithm: "AES-256-GCM"
});
```

### 8. Rate Limiter Router (`rateLimiter.*`)

**Endpoints:**
- `rateLimiter.checkLimit` - Verificar limite de taxa
- `rateLimiter.getRemaining` - Tokens restantes
- `rateLimiter.getResetAt` - Tempo de reset
- `rateLimiter.getStatistics` - Estatísticas
- `rateLimiter.getAllowRate` - Taxa de permissão
- `rateLimiter.reset` - Resetar (admin-only)

**Exemplo:**
```typescript
const status = await trpc.rateLimiter.checkLimit.useQuery({
  identifier: "user-123"
});
```

### 9. Dependency Scanner Router (`dependencyScanner.*`)

**Endpoints:**
- `dependencyScanner.generateSBOM` - Gerar Software Bill of Materials
- `dependencyScanner.getCriticalVulnerabilities` - Vulnerabilidades críticas
- `dependencyScanner.getLicenseCompliance` - Conformidade de licenças
- `dependencyScanner.getStatistics` - Estatísticas
- `dependencyScanner.exportSBOM` - Exportar SBOM

**Exemplo:**
```typescript
const sbom = await trpc.dependencyScanner.generateSBOM.useMutation();
const vulns = await trpc.dependencyScanner.getCriticalVulnerabilities.useQuery();
```

### 10. Multi-Region Failover Router (`failover.*`)

**Endpoints:**
- `failover.initialize` - Inicializar regiões
- `failover.getActiveRegion` - Região ativa
- `failover.triggerFailover` - Triggar failover
- `failover.getRegionStatus` - Status das regiões
- `failover.getFailoverHistory` - Histórico de failovers
- `failover.getStatistics` - Estatísticas

**Exemplo:**
```typescript
const region = await trpc.failover.getActiveRegion.useQuery();
await trpc.failover.triggerFailover.useMutation({
  targetRegion: "us-west-2"
});
```

### 11. Incident Response Router (`incidents.*`)

**Endpoints:**
- `incidents.create` - Criar incidente
- `incidents.list` - Listar incidentes
- `incidents.get` - Obter incidente
- `incidents.update` - Atualizar incidente
- `incidents.addAction` - Adicionar ação
- `incidents.getPlaybook` - Obter playbook de resposta

**Exemplo:**
```typescript
const incident = await trpc.incidents.create.useMutation({
  title: "Database Outage",
  severity: "critical",
  description: "Database is down"
});
```

### 12. Cost Optimization Router (`costOptimization.*`)

**Endpoints:**
- `costOptimization.analyze` - Analisar custos
- `costOptimization.getRecommendations` - Obter recomendações
- `costOptimization.getMetrics` - Obter métricas
- `costOptimization.getTrends` - Obter tendências
- `costOptimization.getProjections` - Obter projeções
- `costOptimization.exportReport` - Exportar relatório
- `costOptimization.getStatistics` - Estatísticas

**Exemplo:**
```typescript
const analysis = await trpc.costOptimization.analyze.useMutation({
  period: "monthly"
});
const recommendations = await trpc.costOptimization.getRecommendations.useQuery();
```

## Error Handling

Todos os erros tRPC seguem o padrão:

```typescript
{
  code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR",
  message: "Error description",
  cause?: any
}
```

## Rate Limiting

- **Limite padrão:** 1000 requisições por minuto por IP
- **Limite para endpoints críticos:** 100 requisições por minuto
- **Bypass para admins:** Sem limite

## Segurança

- ✅ FIPS 140-2 Level 2 Compliance
- ✅ ISO 27001 Controls
- ✅ OWASP Top 10 Protections
- ✅ Zero-Trust Architecture
- ✅ Criptografia AES-256-GCM
- ✅ Audit Trail Imutável

## Exemplo de Uso Completo

```typescript
import { trpc } from "@/lib/trpc";

// 1. Fazer login (automático via OAuth)
const user = await trpc.auth.me.useQuery();

// 2. Upload de documentos
const uploadResult = await trpc.documents.upload.useMutation({
  file: formData,
  title: "Technical Specification",
  version: "1.0"
});

// 3. Fazer consulta ao copiloto
const response = await trpc.copilot.chat.useMutation({
  message: "Qual é a melhor prática para otimizar custos?",
  documentIds: [uploadResult.id]
});

// 4. Criar diagnóstico
const diagnostic = await trpc.diagnostics.create.useMutation({
  area: "Production",
  flowPeople: 150,
  currentProducts: ["Product A"],
  currentConsumption: 500,
  currentCost: 5000
});

// 5. Calcular ROI
const roi = await trpc.roi.calculate.useMutation({
  costPerLiter: 10,
  yield: 95,
  currentConsumption: 500,
  currentCost: 5000
});

// 6. Verificar conformidade
const complianceReport = await trpc.compliance.getReport.useQuery();

// 7. Fazer logout
await trpc.auth.logout.useMutation();
```

## Suporte

Para dúvidas ou problemas, entre em contato com o suporte técnico.

---

**Versão:** 1.0  
**Última atualização:** 2026-06-01  
**Status:** Production Ready
