import { Injectable } from '@nestjs/common';
import { AgentToolsService } from '../../agent/agent-tools.service';
import { LLMService } from '../../llm/llm.service';

@Injectable()
export class ScheduleHandler {
    constructor(
        private agentTools: AgentToolsService,
        private llmService: LLMService
    ) { }

    async handle(
        userInput: string,
        contactId: string,
        organizationId: string,
        agentPersonality: string,
        provider: any,
        recentHistory: string[]
    ): Promise<string> {

        console.log('[ScheduleHandler] Processing schedule request');
        console.log('[ScheduleHandler] User input:', userInput);
        console.log('[ScheduleHandler] Recent history:', recentHistory);

        // Extract schedule info using LLM with full context
        const extractionPrompt = `
Extraia informações de agendamento considerando TODO o contexto da conversa.

HISTÓRICO RECENTE:
${recentHistory.join('\n')}

MENSAGEM ATUAL: "${userInput}"

INSTRUÇÕES:
- Se mencionar "amanhã", calcule a data (hoje + 1 dia)
- Se mencionar "12h" ou "12:00", use esse horário
- Assunto pode estar em mensagens anteriores

Data atual: ${new Date().toISOString().split('T')[0]}

Responda APENAS com JSON:
{
  "hasAllInfo": true/false,
  "date": "YYYY-MM-DD",
  "time": "HH:mm",
  "subject": "assunto completo",
  "summary": "resumo"
}
`;

        const extraction = await this.llmService.generateResponse(provider, extractionPrompt, userInput);

        console.log('[ScheduleHandler] Extraction result:', extraction);

        try {
            const cleanedExtraction = extraction.replace(/```json\n?|\n?```/g, '').trim();
            const scheduleInfo = JSON.parse(cleanedExtraction);

            if (scheduleInfo.hasAllInfo && scheduleInfo.date && scheduleInfo.time && scheduleInfo.subject) {
                const dateTime = `${scheduleInfo.date} ${scheduleInfo.time}`;

                console.log('[ScheduleHandler] Creating schedule:', {
                    dateTime,
                    subject: scheduleInfo.subject
                });

                // Create schedule
                await this.agentTools.scheduleFollowUp(
                    organizationId,
                    contactId,
                    scheduleInfo.subject
                );

                return `Agendamento criado para ${dateTime}! Assunto: ${scheduleInfo.subject}`;
            }

            // Missing info
            const missing = [];
            if (!scheduleInfo.date || !scheduleInfo.time) missing.push('data/hora');
            if (!scheduleInfo.subject) missing.push('assunto');

            return `Para agendar, ainda preciso de: ${missing.join(' e ')}. Podes fornecer?`;

        } catch (error) {
            console.error('[ScheduleHandler] Failed to parse:', extraction, error);
            return "Não consegui processar o agendamento. Podes repetir com data, hora e assunto?";
        }
    }
}
