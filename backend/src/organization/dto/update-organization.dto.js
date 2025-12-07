"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateOrganizationDto = void 0;
var class_validator_1 = require("class-validator");
var swagger_1 = require("@nestjs/swagger");
var UpdateOrganizationDto = function () {
    var _a;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _logo_decorators;
    var _logo_initializers = [];
    var _logo_extraInitializers = [];
    var _sector_decorators;
    var _sector_initializers = [];
    var _sector_extraInitializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _description_extraInitializers = [];
    var _businessHours_decorators;
    var _businessHours_initializers = [];
    var _businessHours_extraInitializers = [];
    var _privacyPolicy_decorators;
    var _privacyPolicy_initializers = [];
    var _privacyPolicy_extraInitializers = [];
    var _termsOfService_decorators;
    var _termsOfService_initializers = [];
    var _termsOfService_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpdateOrganizationDto() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.logo = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _logo_initializers, void 0));
                this.sector = (__runInitializers(this, _logo_extraInitializers), __runInitializers(this, _sector_initializers, void 0));
                this.description = (__runInitializers(this, _sector_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.businessHours = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _businessHours_initializers, void 0));
                this.privacyPolicy = (__runInitializers(this, _businessHours_extraInitializers), __runInitializers(this, _privacyPolicy_initializers, void 0));
                this.termsOfService = (__runInitializers(this, _privacyPolicy_extraInitializers), __runInitializers(this, _termsOfService_initializers, void 0));
                __runInitializers(this, _termsOfService_extraInitializers);
            }
            return UpdateOrganizationDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Minha Empresa Ltda' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _logo_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'data:image/png;base64,...' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _sector_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Retail' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _description_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Updated description' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _businessHours_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: { monday: { open: '09:00', close: '18:00' } } }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsObject)()];
            _privacyPolicy_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _termsOfService_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _logo_decorators, { kind: "field", name: "logo", static: false, private: false, access: { has: function (obj) { return "logo" in obj; }, get: function (obj) { return obj.logo; }, set: function (obj, value) { obj.logo = value; } }, metadata: _metadata }, _logo_initializers, _logo_extraInitializers);
            __esDecorate(null, null, _sector_decorators, { kind: "field", name: "sector", static: false, private: false, access: { has: function (obj) { return "sector" in obj; }, get: function (obj) { return obj.sector; }, set: function (obj, value) { obj.sector = value; } }, metadata: _metadata }, _sector_initializers, _sector_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _businessHours_decorators, { kind: "field", name: "businessHours", static: false, private: false, access: { has: function (obj) { return "businessHours" in obj; }, get: function (obj) { return obj.businessHours; }, set: function (obj, value) { obj.businessHours = value; } }, metadata: _metadata }, _businessHours_initializers, _businessHours_extraInitializers);
            __esDecorate(null, null, _privacyPolicy_decorators, { kind: "field", name: "privacyPolicy", static: false, private: false, access: { has: function (obj) { return "privacyPolicy" in obj; }, get: function (obj) { return obj.privacyPolicy; }, set: function (obj, value) { obj.privacyPolicy = value; } }, metadata: _metadata }, _privacyPolicy_initializers, _privacyPolicy_extraInitializers);
            __esDecorate(null, null, _termsOfService_decorators, { kind: "field", name: "termsOfService", static: false, private: false, access: { has: function (obj) { return "termsOfService" in obj; }, get: function (obj) { return obj.termsOfService; }, set: function (obj, value) { obj.termsOfService = value; } }, metadata: _metadata }, _termsOfService_initializers, _termsOfService_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateOrganizationDto = UpdateOrganizationDto;
