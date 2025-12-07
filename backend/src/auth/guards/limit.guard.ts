import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

export const LIMIT_KEY = 'limit';
export const CheckLimit = (resource: 'agents' | 'sessions' | 'contacts') => SetMetadata(LIMIT_KEY, resource);

@Injectable()
export class LimitGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private subscriptionsService: SubscriptionsService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const resource = this.reflector.getAllAndOverride<'agents' | 'sessions' | 'contacts'>(LIMIT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!resource) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.orgId) {
            return true;
        }

        // Get active subscription - same logic as billing page
        const subscription = await this.subscriptionsService.getActiveSubscription(user.orgId);
        if (!subscription) {
            throw new ForbiddenException('No active subscription found.');
        }

        // Get current usage
        const usage = await this.subscriptionsService.getUsage(user.orgId);

        // Use organization limits (snapshot) from active subscription
        // Fallback to package limits if organization limits are missing (safety check)
        const limits = {
            maxAgents: subscription.organization?.maxAgents ?? subscription.package.maxAgents,
            maxSessions: subscription.organization?.maxSessions ?? subscription.package.maxSessions,
            maxContacts: subscription.organization?.maxContacts ?? subscription.package.maxContacts,
        };

        if (resource === 'agents' && usage.agents >= limits.maxAgents) {
            throw new ForbiddenException(`Agent limit reached (${usage.agents}/${limits.maxAgents}). Upgrade your plan.`);
        }

        if (resource === 'sessions' && usage.sessions >= limits.maxSessions) {
            throw new ForbiddenException(`Session limit reached (${usage.sessions}/${limits.maxSessions}). Upgrade your plan.`);
        }

        if (resource === 'contacts' && usage.contacts >= limits.maxContacts) {
            throw new ForbiddenException(`Contact limit reached (${usage.contacts}/${limits.maxContacts}). Upgrade your plan.`);
        }

        return true;
    }
}
