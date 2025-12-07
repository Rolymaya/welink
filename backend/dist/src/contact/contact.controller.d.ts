import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
export declare class ContactController {
    private readonly contactService;
    constructor(contactService: ContactService);
    create(req: any, createContactDto: CreateContactDto): Promise<{
        id: string;
        name: string | null;
        phone: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string;
    }>;
    findAll(req: any): Promise<({
        _count: {
            messages: number;
        };
    } & {
        id: string;
        name: string | null;
        phone: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string;
    })[]>;
}
