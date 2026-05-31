# 🚀 Roadmap de Implementação - Fase 1 (Core Functionality)

**Objetivo:** Fazer o Evolumix 360 funcionar de verdade (não apenas UI)  
**Timeline:** 40 horas (1 semana com 1 dev full-time)  
**Prioridade:** Crítica

---

## 📋 Fase 1.1: Upload de Documentos (8h)

### Objetivo
Permitir que usuários façam upload real de documentos (FISPQ, PDF) que sejam salvos em S3 e persistidos no banco.

### Tarefas

#### 1.1.1 Criar Schema de Documentos (1h)
**Arquivo:** `drizzle/schema.ts`

```typescript
// Adicionar ao schema.ts
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  filename: text('filename').notNull(),
  fileKey: text('file_key').notNull(), // S3 key
  fileUrl: text('file_url').notNull(), // S3 URL
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  status: text('status').default('pending'), // pending, processing, ready, error
  uploadedAt: integer('uploaded_at').notNull(),
  processedAt: integer('processed_at'),
  errorMessage: text('error_message'),
});

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, { fields: [documents.userId], references: [users.id] }),
}));
```

**Testes:**
```typescript
// drizzle/schema.test.ts
test('documents table has correct schema', () => {
  expect(documents.id).toBeDefined();
  expect(documents.fileKey).toBeDefined();
  expect(documents.status).toBeDefined();
});
```

#### 1.1.2 Gerar Migration (0.5h)
```bash
pnpm drizzle-kit generate
# Executar SQL via webdev_execute_sql
```

#### 1.1.3 Implementar Backend Endpoint (3h)
**Arquivo:** `server/routers.ts` (ou novo arquivo `server/routers/documents.ts`)

```typescript
// server/routers.ts
export const appRouter = router({
  // ... existing routes
  
  documents: router({
    upload: protectedProcedure
      .input(z.object({
        filename: z.string(),
        fileData: z.string(), // base64
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 1. Validar arquivo
        if (!['application/pdf', 'text/plain'].includes(input.mimeType)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid file type' });
        }

        // 2. Upload para S3
        const buffer = Buffer.from(input.fileData, 'base64');
        const fileKey = `documents/${ctx.user.id}/${Date.now()}-${input.filename}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // 3. Salvar no banco
        const docId = generateId();
        await db.insert(documents).values({
          id: docId,
          userId: ctx.user.id,
          filename: input.filename,
          fileKey,
          fileUrl: url,
          mimeType: input.mimeType,
          fileSize: buffer.length,
          status: 'ready',
          uploadedAt: Date.now(),
        });

        return { id: docId, url, filename: input.filename };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.query.documents.findMany({
        where: eq(documents.userId, ctx.user.id),
        orderBy: desc(documents.uploadedAt),
      });
    }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const doc = await db.query.documents.findFirst({
          where: and(
            eq(documents.id, input.id),
            eq(documents.userId, ctx.user.id)
          ),
        });

        if (!doc) throw new TRPCError({ code: 'NOT_FOUND' });

        await db.delete(documents).where(eq(documents.id, input.id));
        return { success: true };
      }),
  }),
});
```

**Testes:**
```typescript
// server/routers/documents.test.ts
describe('documents.upload', () => {
  test('upload valid PDF', async () => {
    const result = await trpc.documents.upload.mutate({
      filename: 'test.pdf',
      fileData: Buffer.from('PDF content').toString('base64'),
      mimeType: 'application/pdf',
    });
    expect(result.id).toBeDefined();
    expect(result.url).toContain('/manus-storage/');
  });

  test('reject invalid file type', async () => {
    await expect(
      trpc.documents.upload.mutate({
        filename: 'test.exe',
        fileData: Buffer.from('EXE content').toString('base64'),
        mimeType: 'application/x-msdownload',
      })
    ).rejects.toThrow('Invalid file type');
  });

  test('list documents for user', async () => {
    const result = await trpc.documents.list.query();
    expect(Array.isArray(result)).toBe(true);
  });

  test('delete document', async () => {
    const uploaded = await trpc.documents.upload.mutate({...});
    const deleted = await trpc.documents.delete.mutate({ id: uploaded.id });
    expect(deleted.success).toBe(true);
  });
});
```

#### 1.1.4 Implementar Frontend (3h)
**Arquivo:** `client/src/pages/V2Documents.tsx`

```typescript
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function V2Documents() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast({ title: 'Documento enviado com sucesso!' });
      utils.documents.list.invalidate();
    },
    onError: (error) => {
      toast({ title: 'Erro ao enviar documento', description: error.message });
    },
  });

  const listQuery = trpc.documents.list.useQuery();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      await uploadMutation.mutateAsync({
        filename: file.name,
        fileData: base64,
        mimeType: file.type,
      });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div>
        <input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          accept=".pdf,.txt"
        />
        {uploading && <p>Enviando...</p>}
      </div>

      <div className="space-y-2">
        {listQuery.data?.map((doc) => (
          <div key={doc.id} className="p-4 border rounded">
            <p>{doc.filename}</p>
            <p className="text-sm text-gray-500">{doc.fileSize} bytes</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Testes:**
```typescript
// client/src/pages/V2Documents.test.tsx
describe('V2Documents', () => {
  test('renders upload input', () => {
    render(<V2Documents />);
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
  });

  test('uploads file successfully', async () => {
    render(<V2Documents />);
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByRole('button', { name: /upload/i });
    // ... test logic
  });
});
```

#### 1.1.5 Validação (0.5h)
- [ ] Testar upload de PDF real
- [ ] Verificar arquivo em S3
- [ ] Verificar registro no banco
- [ ] Testar delete
- [ ] Testar lista

---

## 📋 Fase 1.2: Histórico de Chat (10h)

### Objetivo
Permitir que mensagens de chat sejam salvas no banco e carregadas ao abrir o chat novamente.

### Tarefas

#### 1.2.1 Criar Schema de Chat (1h)
**Arquivo:** `drizzle/schema.ts`

```typescript
export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const chatRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, { fields: [chatMessages.userId], references: [users.id] }),
}));
```

#### 1.2.2 Gerar Migration (0.5h)

#### 1.2.3 Implementar Backend (4h)

```typescript
// server/routers.ts
chat: router({
  saveMessage: protectedProcedure
    .input(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const messageId = generateId();
      await db.insert(chatMessages).values({
        id: messageId,
        userId: ctx.user.id,
        role: input.role,
        content: input.content,
        createdAt: Date.now(),
      });
      return { id: messageId };
    }),

  getHistory: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      return await db.query.chatMessages.findMany({
        where: eq(chatMessages.userId, ctx.user.id),
        orderBy: desc(chatMessages.createdAt),
        limit: input.limit,
        offset: input.offset,
      });
    }),

  clearHistory: protectedProcedure
    .mutation(async ({ ctx }) => {
      await db.delete(chatMessages).where(
        eq(chatMessages.userId, ctx.user.id)
      );
      return { success: true };
    }),
}),
```

#### 1.2.4 Implementar Frontend (4h)

```typescript
// client/src/pages/V2Copilot.tsx
export default function V2Copilot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const utils = trpc.useUtils();

  // Carregar histórico ao montar
  const historyQuery = trpc.chat.getHistory.useQuery();
  useEffect(() => {
    if (historyQuery.data) {
      setMessages(historyQuery.data.reverse());
    }
  }, [historyQuery.data]);

  const saveMutation = trpc.chat.saveMessage.useMutation();

  const handleSendMessage = async (content: string) => {
    // 1. Salvar mensagem do usuário
    await saveMutation.mutateAsync({
      role: 'user',
      content,
    });

    // 2. Chamar LLM
    const response = await invokeLLM({
      messages: [...messages, { role: 'user', content }],
    });

    // 3. Salvar resposta do assistente
    await saveMutation.mutateAsync({
      role: 'assistant',
      content: response.choices[0].message.content,
    });

    // 4. Recarregar histórico
    utils.chat.getHistory.invalidate();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={msg.role === 'user' ? 'text-right' : ''}>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      {/* Input */}
      <input
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSendMessage(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />
    </div>
  );
}
```

#### 1.2.5 Testes (0.5h)

```typescript
describe('chat.saveMessage', () => {
  test('saves user message', async () => {
    const result = await trpc.chat.saveMessage.mutate({
      role: 'user',
      content: 'Hello',
    });
    expect(result.id).toBeDefined();
  });

  test('retrieves message history', async () => {
    await trpc.chat.saveMessage.mutate({ role: 'user', content: 'Test' });
    const history = await trpc.chat.getHistory.query();
    expect(history.length).toBeGreaterThan(0);
  });
});
```

---

## 📋 Fase 1.3: RAG Básico (20h)

### Objetivo
Implementar retrieval-augmented generation para que o chat tenha contexto dos documentos.

### Tarefas

#### 1.3.1 Integrar Pinecone (5h)
**Arquivo:** `server/_core/vectorDb.ts`

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const vectorDb = pc.Index(process.env.PINECONE_INDEX);

export async function upsertEmbeddings(
  docId: string,
  chunks: Array<{ text: string; chunkId: string }>
) {
  const embeddings = await generateEmbeddings(chunks.map(c => c.text));
  
  await vectorDb.upsert(
    chunks.map((chunk, i) => ({
      id: `${docId}-${chunk.chunkId}`,
      values: embeddings[i],
      metadata: { docId, chunkId: chunk.chunkId, text: chunk.text },
    }))
  );
}

export async function searchSimilar(query: string, topK = 5) {
  const embedding = await generateEmbedding(query);
  const results = await vectorDb.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });
  return results.matches;
}
```

#### 1.3.2 Implementar Document Chunking (5h)

```typescript
// server/_core/documentChunking.ts
export function chunkDocument(text: string, chunkSize = 512): string[] {
  const sentences = text.split(/[.!?]+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += sentence + '. ';
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}
```

#### 1.3.3 Implementar Embedding Generation (5h)

```typescript
// server/_core/embeddings.ts
import { invokeLLM } from './llm';

export async function generateEmbedding(text: string): Promise<number[]> {
  // Usar embedding model (ex: text-embedding-3-small)
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map(generateEmbedding));
}
```

#### 1.3.4 Implementar RAG Pipeline (5h)

```typescript
// server/routers.ts
chat: router({
  sendMessage: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Buscar documentos relevantes
      const relevantDocs = await searchSimilar(input.content);

      // 2. Construir contexto
      const context = relevantDocs
        .map(doc => doc.metadata.text)
        .join('\n\n');

      // 3. Construir prompt com contexto
      const systemPrompt = `You are a helpful assistant for professional hygiene consultants.
Use the following documents as context:

${context}

If you don't find relevant information in the documents, say so.`;

      // 4. Chamar LLM
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input.content },
        ],
      });

      // 5. Salvar mensagens
      await saveMutation.mutateAsync({
        role: 'user',
        content: input.content,
      });

      await saveMutation.mutateAsync({
        role: 'assistant',
        content: response.choices[0].message.content,
        citations: relevantDocs.map(d => ({ docId: d.metadata.docId, text: d.metadata.text })),
      });

      return { response: response.choices[0].message.content };
    }),
}),
```

#### 1.3.5 Testes (0h - inclusos acima)

---

## ✅ Checklist de Conclusão

### Fase 1.1: Upload
- [ ] Schema criado
- [ ] Migration executada
- [ ] Backend endpoint implementado
- [ ] Frontend implementado
- [ ] 4 testes passando
- [ ] Validação manual OK

### Fase 1.2: Histórico
- [ ] Schema criado
- [ ] Migration executada
- [ ] Backend endpoints implementados
- [ ] Frontend implementado
- [ ] 3 testes passando
- [ ] Validação manual OK

### Fase 1.3: RAG
- [ ] Pinecone integrado
- [ ] Chunking implementado
- [ ] Embeddings implementados
- [ ] RAG pipeline implementado
- [ ] 5 testes passando
- [ ] Validação manual OK

### Geral
- [ ] Todos os 12 testes passando
- [ ] Sem erros de TypeScript
- [ ] Sem warnings de ESLint
- [ ] Documentação atualizada
- [ ] Checkpoint criado
- [ ] Deploy em staging
- [ ] Teste end-to-end
- [ ] Deploy em produção

---

## 📞 Próximos Passos

1. Começar pela **Fase 1.1** (Upload)
2. Testar completamente
3. Fazer PR com testes
4. Mover para **Fase 1.2** (Histórico)
5. Mover para **Fase 1.3** (RAG)
6. Deploy em produção

**Tempo total:** 40 horas (1 semana)  
**Resultado:** Evolumix 360 funcional de verdade

