import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';
import * as fs from 'fs';

@Injectable()
export class OpenAIIntegrationService {
    private readonly logger = new Logger(OpenAIIntegrationService.name);

    // Instruções padrão de workflow e agendamento
    private readonly WORKFLOW_INSTRUCTIONS = `
REGRAS OBRIGATÓRIAS DE COMUNICAÇÃO (ARQUITETURA TOOL-FIRST):
1. **NUNCA responda com texto livre.** Toda e qualquer resposta ao usuário deve ser enviada via ferramenta 'send_response'.
2. **PROTOCOLO DE RESPOSTA**:
   - Analise a mensagem do usuário.
   - Execute as ferramentas necessárias (pesquisa, banco, pedidos).
   - Após obter TODOS os resultados, formule a resposta humana e chame 'send_response'.
3. **REGRA SUPREMA (Pesquisa de Conhecimento)**:
   - Para QUALQUER pergunta que não seja sobre stock de produtos físicos, você DEVE começar consultando a sua base de conhecimento (gaveta/file_search).
   - Se a informação estiver lá, use-a. Se não estiver, use 'catalog_search' ou 'schedule_follow_up'.
4. **PROIBIÇÕES GLOBAIS (NUNCA diga estas frases)**:
   - "não encontrei", "não sei", "não tenho acesso", "vou verificar agora", "um momento", "estou pesquisando".
   - Em vez disso: Se não souber, use 'schedule_follow_up' para que um humano responda depois, ou ofereça uma alternativa útil.
5. **HUMANIZAÇÃO**:
   - Seja natural, prestativo e evite listas robóticas.
   - Aceite qualquer formato de endereço. NUNCA peça código postal.
`;

    private readonly SCHEDULING_INSTRUCTIONS = `
CAPACIDADE DE AGENDAMENTO:
1. NUNCA use o formato [SCHEDULE] em texto.
2. Use EXCLUSIVAMENTE a ferramenta 'create_schedule' para marcar reuniões ou visitas.
3. Só agende se o usuário pedir ou concordar explicitamente.
`;

    constructor(private prisma: PrismaService) { }

    /**
     * Obtém o cliente OpenAI configurado para o sistema
     */
    private async getClient(): Promise<OpenAI> {
        const provider = await this.prisma.lLMProvider.findFirst({
            where: {
                isActive: true,
                name: { contains: 'OpenAI' }
            }
        });

        if (!provider) {
            this.logger.error('Provedor OpenAI não encontrado ou inativo');
            throw new Error('OpenAI provider not found or inactive');
        }

        return new OpenAI({ apiKey: provider.apiKey });
    }

    /**
     * Garante que um Contacto tem uma Conversation (Thread) na OpenAI
     */
    async getOrCreateConversation(contactId: string): Promise<string> {
        const contact = await this.prisma.contact.findUnique({
            where: { id: contactId },
            select: { id: true, openaiConversationId: true }
        });

        if (!contact) throw new Error('Contact not found');

        if (contact.openaiConversationId) {
            return contact.openaiConversationId;
        }

        const openai = await this.getClient();
        this.logger.log(`Criando nova Conversation (Thread) para o contacto ${contactId}`);

        // Na nova API, as threads são gerenciadas via beta.threads (Assistants API)
        // ou automaticamente via Responses API se passarmos store: true.
        // Para manter o estado clássico de "gaveta", usaremos Threads.
        const thread = await openai.beta.threads.create();

        await this.prisma.contact.update({
            where: { id: contactId },
            data: { openaiConversationId: thread.id }
        });

        return thread.id;
    }

    /**
     * Garante que um Agente tem um Assistant correspondente na OpenAI
     */
    async syncAssistant(agentId: string): Promise<string> {
        const agent = await this.prisma.agent.findUnique({
            where: { id: agentId },
            include: { organization: true }
        });

        if (!agent) throw new Error('Agent not found');

        const provider = await this.prisma.lLMProvider.findFirst({
            where: { isActive: true, name: { contains: 'OpenAI' } }
        });

        const openai = await this.getClient();

        const fullInstructions = `
${this.WORKFLOW_INSTRUCTIONS}
${this.SCHEDULING_INSTRUCTIONS}

PERSONA E INFORMAÇÕES DO AGENTE:
${agent.prompt}

INSTRUÇÃO DE BUSCA E CONFIANÇA:
- Você tem acesso direto a documentos da empresa via "file_search". Use-os!
- Sempre que houver uma pergunta sobre serviços, pacotes, preços de serviços ou informações institucionais, "navegue" pelos seus documentos internos para encontrar a resposta.
- NÃO diga "não sei" ou "não tenho detalhes" sem antes validar exaustivamente a sua base de conhecimento.
- Se a informação estiver nos documentos, responda com autoridade e detalhe.
`;

        const assistantData: any = {
            name: agent.name,
            instructions: fullInstructions,
            model: provider?.defaultModel || 'gpt-4o-mini',
            tools: [{ type: 'file_search' }] // Habilita busca em arquivos por padrão
        };

        // Adicionar definições de funções (opcional, HybridAgentService já passa no Run, 
        // mas é bom ter no Assistant para o Playground da OpenAI)

        // Vincular o Vector Store da Organização se existir
        if (agent.organization.openaiVectorStoreId) {
            assistantData.tool_resources = {
                file_search: {
                    vector_store_ids: [agent.organization.openaiVectorStoreId]
                }
            };
        }

        if (agent.openaiAssistantId) {
            this.logger.log(`Atualizando Assistant ${agent.openaiAssistantId} para o agente ${agent.name}`);
            await openai.beta.assistants.update(agent.openaiAssistantId, assistantData);
            return agent.openaiAssistantId;
        } else {
            this.logger.log(`Criando novo Assistant para o agente ${agent.name}`);
            const assistant = await openai.beta.assistants.create(assistantData);

            await this.prisma.agent.update({
                where: { id: agentId },
                data: { openaiAssistantId: assistant.id }
            });

            return assistant.id;
        }
    }

    /**
     * Adiciona uma mensagem à conversa e gera uma resposta usando o Assistant
     */
    async generateResponse(
        contactId: string,
        agentId: string,
        message: string,
        tools: any[] = []
    ): Promise<any> {
        const openai = await this.getClient();
        const threadId = await this.getOrCreateConversation(contactId);

        // Limpar Runs ativos antes de processar a nova mensagem para evitar erro 400
        await this.cleanupActiveRuns(threadId);

        const agent = await this.prisma.agent.findUnique({
            where: { id: agentId },
            include: { organization: true }
        });

        if (!agent) throw new Error('Agent not found');
        const assistantId = await this.syncAssistant(agentId);

        // 1. Adicionar mensagem do usuário à Thread
        await openai.beta.threads.messages.create(threadId, {
            role: 'user',
            content: message
        });

        // 2. Criar um Run (Resposta)
        // Nota: SEMPRE incluímos o file_search para garantir acesso à base de conhecimento
        // mesmo quando passamos ferramentas de função customizadas.
        const allTools = [...tools];
        if (!allTools.find(t => t.type === 'file_search')) {
            allTools.push({ type: 'file_search' });
        }

        const runData: any = {
            assistant_id: assistantId,
            tools: allTools as any
        };

        // Adicionar tool_resources se o Vector Store existir
        if (agent.organization?.openaiVectorStoreId) {
            this.logger.log(`[OpenAI] Vinculando Vector Store ${agent.organization.openaiVectorStoreId} ao Run na Thread ${threadId}`);
            runData.tool_resources = {
                file_search: {
                    vector_store_ids: [agent.organization.openaiVectorStoreId]
                }
            };
        } else {
            this.logger.warn(`[OpenAI] Nenhum Vector Store encontrado para a organização ${agent.organizationId}`);
        }

        const run = await openai.beta.threads.runs.createAndPoll(threadId, runData);

        return { run, threadId };
    }

    /**
     * Garante que uma Organização tem um Vector Store na OpenAI
     */
    async getOrCreateVectorStore(organizationId: string): Promise<string> {
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { id: true, name: true, openaiVectorStoreId: true }
        });

        if (!org) throw new Error('Organization not found');

        if (org.openaiVectorStoreId) {
            return org.openaiVectorStoreId;
        }

        const openai = await this.getClient();
        this.logger.log(`Criando novo Vector Store para a organização ${org.name}`);

        const vectorStore = await (openai as any).vectorStores.create({
            name: `Knowledge Base - ${org.name}`
        });

        await this.prisma.organization.update({
            where: { id: organizationId },
            data: { openaiVectorStoreId: vectorStore.id }
        });

        return vectorStore.id;
    }

    /**
     * Faz upload de um ficheiro e associa-o ao Vector Store da organização
     */
    async uploadFileToVectorStore(organizationId: string, filePath: string): Promise<void> {
        const openai = await this.getClient();
        const vectorStoreId = await this.getOrCreateVectorStore(organizationId);

        this.logger.log(`Fazendo upload de ficheiro para o Vector Store ${vectorStoreId}`);

        const fileStream = fs.createReadStream(filePath);

        // 1. Upload do ficheiro
        const file = await openai.files.create({
            file: fileStream,
            purpose: 'assistants'
        });

        // 2. Adicionar ao Vector Store
        await (openai as any).vectorStores.files.create(vectorStoreId, {
            file_id: file.id
        });

        this.logger.log(`Ficheiro ${file.id} adicionado com sucesso ao Vector Store ${vectorStoreId}`);
    }

    /**
     * Vincula um Assistant a um Vector Store para busca de ficheiros
     */
    async linkAssistantToVectorStore(agentId: string, vectorStoreId: string): Promise<void> {
        const agent = await this.prisma.agent.findUnique({
            where: { id: agentId }
        });

        if (!agent || !agent.openaiAssistantId) return;

        const openai = await this.getClient();

        await openai.beta.assistants.update(agent.openaiAssistantId, {
            tool_resources: {
                file_search: {
                    vector_store_ids: [vectorStoreId]
                }
            }
        });

        this.logger.log(`Assistant ${agent.openaiAssistantId} vinculado ao Vector Store ${vectorStoreId}`);
    }

    /**
     * Cancela qualquer Run ativo na Thread para evitar o erro 400 da OpenAI
     */
    private async cleanupActiveRuns(threadId: string): Promise<void> {
        const openai = await this.getClient();
        try {
            const runs = await openai.beta.threads.runs.list(threadId);
            const activeRuns = runs.data.filter(run =>
                ['in_progress', 'queued', 'requires_action'].includes(run.status)
            );

            for (const run of activeRuns) {
                this.logger.warn(`[OpenAI] Cancelando Run ativo ${run.id} na Thread ${threadId} para permitir nova mensagem.`);
                try {
                    await openai.beta.threads.runs.cancel(threadId, run.id);

                    // Pequeno polling para garantir que o status mudou para 'cancelled' antes de prosseguir
                    let retries = 5;
                    while (retries > 0) {
                        const updatedRun = await openai.beta.threads.runs.retrieve(threadId, run.id);
                        if (['cancelled', 'expired', 'failed', 'completed'].includes(updatedRun.status)) break;
                        await new Promise(resolve => setTimeout(resolve, 500));
                        retries--;
                    }
                } catch (cancelError) {
                    this.logger.error(`[OpenAI] Erro ao cancelar Run ${run.id}: ${cancelError.message}`);
                }
            }
        } catch (error) {
            this.logger.error(`[OpenAI] Erro ao listar Runs para cleanup: ${error.message}`);
        }
    }

    /**
     * Recupera o resultado de um Run após a execução
     */
    async getRunResult(threadId: string, runId: string): Promise<string> {
        const openai = await this.getClient();
        const messages = await openai.beta.threads.messages.list(threadId, {
            run_id: runId
        });

        const lastMessage = messages.data[0];
        if (lastMessage && lastMessage.content[0].type === 'text') {
            // Remove as anotações de fonte da OpenAI (ex: 【56:1†source】)
            return lastMessage.content[0].text.value.replace(/【.*?】/g, '').trim();
        }

        return 'Não consegui processar a resposta.';
    }

    /**
     * Sincroniza todos os agentes da base de dados com a OpenAI (Bulk Migration)
     */
    async syncAllAgents(): Promise<{ success: number; failed: number }> {
        const agents = await this.prisma.agent.findMany({
            select: { id: true, name: true }
        });

        this.logger.log(`Iniciando sincronização em massa de ${agents.length} agentes...`);

        let success = 0;
        let failed = 0;

        for (const agent of agents) {
            try {
                await this.syncAssistant(agent.id);
                success++;
            } catch (error) {
                this.logger.error(`Falha ao sincronizar agente ${agent.name} (${agent.id}): ${error.message}`);
                failed++;
            }
        }

        this.logger.log(`Sincronização em massa concluída: ${success} sucessos, ${failed} falhas.`);
        return { success, failed };
    }
}
