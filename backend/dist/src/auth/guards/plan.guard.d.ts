import { CanActivate, ExecutionContext } from '@nestjs/common';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
export declare class PlanGuard implements CanActivate {
    private subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
