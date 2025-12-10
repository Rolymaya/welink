import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

@Injectable()
export class PlanGuard implements CanActivate {
    constructor(private subscriptionsService: SubscriptionsService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.organizationId) {
            return true; // Allow if no organization context (e.g. super admin)
        }

        // Check for active subscription
        const subscription = await this.subscriptionsService.getActiveSubscription(user.organizationId);

        // Attach subscription to request (can be null)
        request.subscription = subscription;

        // Always allow access - frontend will handle UI based on subscription status
        return true;
    }
}
