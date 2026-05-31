import * as AWS from 'aws-sdk';
import { logger } from './logger';
import * as crypto from 'crypto';

let secretsManager: AWS.SecretsManager | null = null;

function getSecretsManager(): AWS.SecretsManager {
  if (!secretsManager) {
    secretsManager = new AWS.SecretsManager({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }
  return secretsManager;
}

interface SecretConfig {
  name: string;
  rotationDays: number;
  rotationFunction?: () => Promise<string>;
}

/**
 * Configuração de secrets que precisam ser rotacionados
 * Cada secret tem um intervalo de rotação específico
 */
const SECRETS_TO_ROTATE: SecretConfig[] = [
  {
    name: 'evolumix/api-keys/groq',
    rotationDays: 30,
    rotationFunction: async () => {
      // Gerar nova chave Groq
      return `groq_key_${crypto.randomBytes(16).toString('hex')}`;
    },
  },
  {
    name: 'evolumix/database/password',
    rotationDays: 30,
    rotationFunction: async () => {
      // Gerar nova senha de banco de dados
      return generateSecurePassword();
    },
  },
  {
    name: 'evolumix/jwt-secret',
    rotationDays: 30,
    rotationFunction: async () => {
      // Gerar novo JWT secret
      return generateJWTSecret();
    },
  },
  {
    name: 'evolumix/s3-access-key',
    rotationDays: 30,
    rotationFunction: async () => {
      // Gerar nova chave S3 via IAM
      return await generateS3AccessKey();
    },
  },
];

/**
 * Gerar senha segura com 32 caracteres
 * Mix de maiúsculas, minúsculas, números e caracteres especiais
 */
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  
  // Garantir que tem pelo menos um de cada tipo
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*()'[Math.floor(Math.random() * 10)];
  
  // Preencher o resto aleatoriamente
  for (let i = password.length; i < 32; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Embaralhar
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Gerar JWT secret com 64 caracteres hexadecimais
 */
function generateJWTSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Gerar nova chave S3 via IAM
 * Deleta chaves antigas e cria uma nova
 */
async function generateS3AccessKey(): Promise<string> {
  const iam = new AWS.IAM();
  const user: string = process.env.AWS_IAM_USER || 'evolumix-s3-user';
  
  try {
    // Listar chaves de acesso existentes
    const keys = await (iam.listAccessKeys({ UserName: user }) as any).promise();
    
    // Deletar chaves ativas (manter apenas a mais recente)
    const activeKeys = (keys.AccessKeyMetadata || []).filter((k: any) => k.Status === 'Active');
    if (activeKeys.length > 0) {
      // Manter a mais recente, deletar as outras
      const sortedKeys = activeKeys.sort((a: any, b: any) => 
        (b.CreateDate?.getTime() || 0) - (a.CreateDate?.getTime() || 0)
      );
      
      for (let i = 1; i < sortedKeys.length; i++) {
        await iam.deleteAccessKey({
          UserName: user,
          AccessKeyId: sortedKeys[i].AccessKeyId,
        }).promise();
      }
    }
    
    // Criar nova chave
    const newKey = await iam.createAccessKey({ UserName: user }).promise();
    return newKey.AccessKey?.AccessKeyId || '';
  } catch (error) {
    logger.error('Error generating S3 access key', { error, user });
    throw error;
  }
}

/**
 * Verificar se um secret precisa ser rotacionado
 * Compara data da última rotação com intervalo configurado
 */
async function shouldRotateSecret(secretName: string): Promise<boolean> {
  try {
    const sm = getSecretsManager();
    const metadata = await (sm.describeSecret({ SecretId: secretName }) as any).promise();
    
    // Se nunca foi rotacionado, precisa rotacionar
    if (!metadata.LastRotatedDate) {
      logger.warn('Secret never rotated', { secretName });
      return true;
    }
    
    // Calcular dias desde última rotação
    const daysSinceRotation = Math.floor(
      (Date.now() - metadata.LastRotatedDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Obter intervalo de rotação configurado
    const config = SECRETS_TO_ROTATE.find(s => s.name === secretName);
    const rotationDays = config?.rotationDays || 30;
    
    return daysSinceRotation >= rotationDays;
  } catch (error) {
    logger.error('Error checking secret rotation status', { secretName, error });
    return false;
  }
}

/**
 * Rotacionar um secret específico
 * Gera novo valor, atualiza no Secrets Manager e em variáveis de ambiente
 */
async function rotateSecret(secretConfig: SecretConfig): Promise<void> {
  try {
    logger.info('Starting secret rotation', { secretName: secretConfig.name });
    
    // Gerar novo valor
    const newValue = secretConfig.rotationFunction
      ? await secretConfig.rotationFunction()
      : generateSecurePassword();
    
    // Atualizar no AWS Secrets Manager
    const sm = getSecretsManager();
    await (sm.putSecretValue({
      SecretId: secretConfig.name,
      SecretString: newValue,
      VersionStages: ['AWSCURRENT'],
    }) as any).promise();
    
    // Atualizar variável de ambiente local
    const envKey = secretConfig.name.replace(/\//g, '_').toUpperCase();
    process.env[envKey] = newValue;
    
    logger.info('Secret rotated successfully', {
      secretName: secretConfig.name,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error rotating secret', { secretName: secretConfig.name, error });
    throw error;
  }
}

/**
 * Executar rotação de todos os secrets que precisam
 * Chamado diariamente via cron job
 */
export async function rotateAllSecrets(): Promise<void> {
  logger.info('Starting secrets rotation cycle');
  
  const results = {
    rotated: [] as string[],
    skipped: [] as string[],
    failed: [] as string[],
  };
  
  for (const secretConfig of SECRETS_TO_ROTATE) {
    try {
      const shouldRotate = await shouldRotateSecret(secretConfig.name);
      
      if (shouldRotate) {
        await rotateSecret(secretConfig);
        results.rotated.push(secretConfig.name);
      } else {
        results.skipped.push(secretConfig.name);
      }
    } catch (error) {
      results.failed.push(secretConfig.name);
      logger.error('Failed to rotate secret', { secretName: secretConfig.name, error });
    }
  }
  
  logger.info('Secrets rotation cycle completed', results);
  
  // Enviar notificação se houver falhas
  if (results.failed.length > 0) {
    await notifySecurityTeam({
      event: 'SECRETS_ROTATION_FAILED',
      failedSecrets: results.failed,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Agendar rotação automática para executar diariamente
 * Usa node-cron para agendamento
 */
export function scheduleSecretsRotation(): void {
  try {
    const cron = require('node-cron');
    
    // Executar todos os dias às 3 AM UTC
    cron.schedule('0 3 * * *', async () => {
      try {
        await rotateAllSecrets();
      } catch (error) {
        logger.error('Scheduled secrets rotation failed', { error });
      }
    });
    
    logger.info('Secrets rotation scheduled for 03:00 UTC daily');
  } catch (error) {
    logger.error('Error scheduling secrets rotation', { error });
  }
}

/**
 * Notificar security team sobre falhas de rotação
 * Integra com Slack, PagerDuty, ou outro sistema de alertas
 */
async function notifySecurityTeam(event: any): Promise<void> {
  try {
    // TODO: Implementar integração com Slack/PagerDuty
    logger.warn('Security event - secrets rotation failed', event);
  } catch (error) {
    logger.error('Error notifying security team', { error });
  }
}

/**
 * Obter status de rotação de um secret
 * Útil para monitoramento e debugging
 */
export async function getSecretRotationStatus(secretName: string): Promise<any> {
  try {
    const sm = getSecretsManager();
    const metadata = await (sm.describeSecret({ SecretId: secretName }) as any).promise();
    const config = SECRETS_TO_ROTATE.find(s => s.name === secretName);
    
    const daysSinceRotation = metadata.LastRotatedDate
      ? Math.floor((Date.now() - metadata.LastRotatedDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    return {
      secretName,
      lastRotated: metadata.LastRotatedDate?.toISOString() || 'Never',
      daysSinceRotation,
      rotationIntervalDays: config?.rotationDays || 30,
      needsRotation: daysSinceRotation ? daysSinceRotation >= (config?.rotationDays || 30) : true,
    };
  } catch (error) {
    logger.error('Error getting secret rotation status', { secretName, error });
    throw error;
  }
}
