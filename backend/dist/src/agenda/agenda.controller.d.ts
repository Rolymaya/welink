import { AgendaService } from './agenda.service';
export declare class AgendaController {
    private readonly agendaService;
    constructor(agendaService: AgendaService);
    create(req: any, createAgendaDto: any): Promise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        date: Date;
        summary: string | null;
        contactId: string | null;
        client: string | null;
    }>;
    findAll(req: any): Promise<({
        contact: {
            id: string;
            name: string | null;
            phone: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            tags: string;
        };
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        date: Date;
        summary: string | null;
        contactId: string | null;
        client: string | null;
    })[]>;
    findOne(id: string): Promise<{
        contact: {
            id: string;
            name: string | null;
            phone: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            tags: string;
        };
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        date: Date;
        summary: string | null;
        contactId: string | null;
        client: string | null;
    }>;
    update(id: string, updateAgendaDto: any): Promise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        date: Date;
        summary: string | null;
        contactId: string | null;
        client: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        date: Date;
        summary: string | null;
        contactId: string | null;
        client: string | null;
    }>;
}
