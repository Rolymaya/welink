"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LimitGuard = exports.CheckLimit = exports.LIMIT_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const subscriptions_service_1 = require("../../subscriptions/subscriptions.service");
exports.LIMIT_KEY = 'limit';
const CheckLimit = (resource) => (0, common_1.SetMetadata)(exports.LIMIT_KEY, resource);
exports.CheckLimit = CheckLimit;
let LimitGuard = class LimitGuard {
    constructor(reflector, subscriptionsService) {
        this.reflector = reflector;
        this.subscriptionsService = subscriptionsService;
    }
    async canActivate(context) {
        var _a, _b, _c, _d, _e, _f;
        const resource = this.reflector.getAllAndOverride(exports.LIMIT_KEY, [
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
        const subscription = await this.subscriptionsService.getActiveSubscription(user.orgId);
        if (!subscription) {
            throw new common_1.ForbiddenException('No active subscription found.');
        }
        const usage = await this.subscriptionsService.getUsage(user.orgId);
        const limits = {
            maxAgents: (_b = (_a = subscription.organization) === null || _a === void 0 ? void 0 : _a.maxAgents) !== null && _b !== void 0 ? _b : subscription.package.maxAgents,
            maxSessions: (_d = (_c = subscription.organization) === null || _c === void 0 ? void 0 : _c.maxSessions) !== null && _d !== void 0 ? _d : subscription.package.maxSessions,
            maxContacts: (_f = (_e = subscription.organization) === null || _e === void 0 ? void 0 : _e.maxContacts) !== null && _f !== void 0 ? _f : subscription.package.maxContacts,
        };
        if (resource === 'agents' && usage.agents >= limits.maxAgents) {
            throw new common_1.ForbiddenException(`Agent limit reached (${usage.agents}/${limits.maxAgents}). Upgrade your plan.`);
        }
        if (resource === 'sessions' && usage.sessions >= limits.maxSessions) {
            throw new common_1.ForbiddenException(`Session limit reached (${usage.sessions}/${limits.maxSessions}). Upgrade your plan.`);
        }
        if (resource === 'contacts' && usage.contacts >= limits.maxContacts) {
            throw new common_1.ForbiddenException(`Contact limit reached (${usage.contacts}/${limits.maxContacts}). Upgrade your plan.`);
        }
        return true;
    }
};
exports.LimitGuard = LimitGuard;
exports.LimitGuard = LimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        subscriptions_service_1.SubscriptionsService])
], LimitGuard);
//# sourceMappingURL=limit.guard.js.map