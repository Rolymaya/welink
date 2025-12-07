export declare class CreatePackageDto {
    name: string;
    description: string;
    price: number;
    durationDays: number;
    maxAgents: number;
    maxSessions: number;
    maxContacts: number;
    allowAudioResponse?: boolean;
    allowScheduling?: boolean;
    isActive?: boolean;
}
