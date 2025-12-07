import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
export declare const LIMIT_KEY = "limit";
export declare const CheckLimit: (resource: "agents" | "sessions" | "contacts") => import("@nestjs/common").CustomDecorator<string>;
export declare class LimitGuard implements CanActivate {
    private reflector;
    private subscriptionsService;
    constructor(reflector: Reflector, subscriptionsService: SubscriptionsService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
