# Implementation Kit - Gaps 11-12: Conformidade e Security

**Gaps Cobertos:**
- Gap 11: Compliance Scanner (OWASP ZAP, Trivy, SonarQube)
- Gap 12: WAF (Web Application Firewall) com regras OWASP

**Status:** Pronto para Implementação  
**Tempo Estimado:** 20 horas  
**Dificuldade:** Média-Alta  
**Dependências:** Docker, Cloud Armor / WAFv2

---

## 📋 Checklist

- [ ] Configurar OWASP ZAP
- [ ] Configurar Trivy para scanning de vulnerabilidades
- [ ] Configurar SonarQube para code quality
- [ ] Implementar WAF rules
- [ ] Configurar Cloud Armor (GCP) ou WAFv2 (AWS)
- [ ] Criar CI/CD pipeline com scanning
- [ ] Testes de segurança

---

## 📝 Gap 11: Compliance Scanner

**Arquivo:** `.github/workflows/security-scan.yml`

```yaml
name: Security Scanning

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  trivy-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  sonarqube-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: SonarQube Scan
        uses: SonarSource/sonarqube-scan-action@master
        env:
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  zap-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and start application
        run: |
          docker-compose up -d
          sleep 10
      
      - name: Run OWASP ZAP scan
        uses: zaproxy/action-baseline@v0.4.0
        with:
          target: 'http://localhost:3000'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'

  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run dependency-check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'Evolumix-360-Copilot'
          path: '.'
          format: 'JSON'
          args: >
            --enableExperimental
            --enableRetired
```

**Arquivo:** `docker-compose.security.yml`

```yaml
version: '3.8'

services:
  sonarqube:
    image: sonarqube:latest
    ports:
      - "9000:9000"
    environment:
      SONAR_JDBC_URL: jdbc:postgresql://postgres:5432/sonarqube
      SONAR_JDBC_USERNAME: sonar
      SONAR_JDBC_PASSWORD: sonar
    volumes:
      - sonarqube-data:/opt/sonarqube/data
      - sonarqube-logs:/opt/sonarqube/logs

  postgres:
    image: postgres:13
    environment:
      POSTGRES_USER: sonar
      POSTGRES_PASSWORD: sonar
      POSTGRES_DB: sonarqube
    volumes:
      - postgres-data:/var/lib/postgresql/data

  trivy:
    image: aquasec/trivy:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - trivy-cache:/root/.cache/trivy

volumes:
  sonarqube-data:
  sonarqube-logs:
  postgres-data:
  trivy-cache:
```

---

## 📝 Gap 12: WAF com Regras OWASP

### AWS WAFv2

**Arquivo:** `terraform/waf.tf`

```hcl
resource "aws_wafv2_web_acl" "evolumix_waf" {
  name  = "evolumix-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 0

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 1

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitRule"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRuleMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "IPReputationListRule"
    priority = 3

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "IPReputationListRuleMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "evolumix-waf-metrics"
    sampled_requests_enabled   = true
  }
}
```

### GCP Cloud Armor

**Arquivo:** `terraform/cloud-armor.tf`

```hcl
resource "google_compute_security_policy" "evolumix_policy" {
  name = "evolumix-security-policy"

  # Default rule - allow all
  rules {
    action   = "allow"
    priority = "65535"
    match {
      versioned_expr = "EXPR_V1"
      expr {
        expression = "true"
      }
    }
    description = "Default rule"
  }

  # Block SQL Injection
  rules {
    action   = "deny-403"
    priority = "1000"
    match {
      versioned_expr = "EXPR_V1"
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable')"
      }
    }
    description = "SQL Injection protection"
  }

  # Block XSS
  rules {
    action   = "deny-403"
    priority = "1001"
    match {
      versioned_expr = "EXPR_V1"
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
    description = "XSS protection"
  }

  # Rate limiting
  rules {
    action   = "rate-based-ban"
    priority = "1002"
    match {
      versioned_expr = "EXPR_V1"
      expr {
        expression = "true"
      }
    }
    rate_limit_options {
      conform_action   = "allow"
      exceed_action    = "deny-429"
      rate_limit_threshold_count = 100
      rate_limit_threshold_interval_sec = 60
      ban_duration_sec = 600
    }
    description = "Rate limiting"
  }

  # Geo-blocking (optional)
  rules {
    action   = "deny-403"
    priority = "1003"
    match {
      versioned_expr = "EXPR_V1"
      expr {
        expression = "origin.region_code == 'CN' || origin.region_code == 'RU'"
      }
    }
    description = "Block high-risk countries"
  }
}
```

---

## 📝 Configuração Local

**Arquivo:** `server/_core/securityHeaders.ts`

```typescript
import { Express } from 'express';

export function setupSecurityHeaders(app: Express) {
  app.use((req, res, next) => {
    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
    );
    
    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');
    
    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer-Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions-Policy
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()'
    );
    
    // HSTS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    next();
  });
}
```

---

## ✅ Validação

- [ ] Trivy scan sem vulnerabilidades críticas
- [ ] SonarQube score > 80
- [ ] OWASP ZAP sem issues críticas
- [ ] WAF regras ativas
- [ ] Rate limiting funcionando
- [ ] Security headers presentes
- [ ] CI/CD pipeline rodando

