import { AgentService } from './agent.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
export declare class AgentController {
    private readonly agentService;
    constructor(agentService: AgentService);
    create(req: any, createAgentDto: CreateAgentDto): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        prompt: string;
    }>;
    findAll(req: any): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        prompt: string;
    }[]>;
    findOne(id: string, req: any): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        prompt: string;
    }>;
    update(id: string, updateAgentDto: UpdateAgentDto, req: any): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        prompt: string;
    }>;
    remove(id: string, req: any): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        prompt: string;
    }>;
    chat(id: string, message: string, req: any): Promise<{
        response: string;
    }>;
}
