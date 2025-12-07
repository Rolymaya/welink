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
exports.CreateLLMProviderDto = void 0;
var class_validator_1 = require("class-validator");
var swagger_1 = require("@nestjs/swagger");
var CreateLLMProviderDto = function () {
    var _a;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _apiKey_decorators;
    var _apiKey_initializers = [];
    var _apiKey_extraInitializers = [];
    var _baseUrl_decorators;
    var _baseUrl_initializers = [];
    var _baseUrl_extraInitializers = [];
    var _models_decorators;
    var _models_initializers = [];
    var _models_extraInitializers = [];
    var _defaultModel_decorators;
    var _defaultModel_initializers = [];
    var _defaultModel_extraInitializers = [];
    var _isActive_decorators;
    var _isActive_initializers = [];
    var _isActive_extraInitializers = [];
    var _priority_decorators;
    var _priority_initializers = [];
    var _priority_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateLLMProviderDto() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.apiKey = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _apiKey_initializers, void 0));
                this.baseUrl = (__runInitializers(this, _apiKey_extraInitializers), __runInitializers(this, _baseUrl_initializers, void 0));
                this.models = (__runInitializers(this, _baseUrl_extraInitializers), __runInitializers(this, _models_initializers, void 0));
                this.defaultModel = (__runInitializers(this, _models_extraInitializers), __runInitializers(this, _defaultModel_initializers, void 0));
                this.isActive = (__runInitializers(this, _defaultModel_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
                this.priority = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _priority_initializers, void 0));
                __runInitializers(this, _priority_extraInitializers);
            }
            return CreateLLMProviderDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            _apiKey_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            _baseUrl_decorators = [(0, swagger_1.ApiProperty)({ required: false }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _models_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            _defaultModel_decorators = [(0, swagger_1.ApiProperty)({ required: false }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _isActive_decorators = [(0, swagger_1.ApiProperty)({ required: false }), (0, class_validator_1.IsBoolean)(), (0, class_validator_1.IsOptional)()];
            _priority_decorators = [(0, swagger_1.ApiProperty)({ required: false }), (0, class_validator_1.IsInt)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _apiKey_decorators, { kind: "field", name: "apiKey", static: false, private: false, access: { has: function (obj) { return "apiKey" in obj; }, get: function (obj) { return obj.apiKey; }, set: function (obj, value) { obj.apiKey = value; } }, metadata: _metadata }, _apiKey_initializers, _apiKey_extraInitializers);
            __esDecorate(null, null, _baseUrl_decorators, { kind: "field", name: "baseUrl", static: false, private: false, access: { has: function (obj) { return "baseUrl" in obj; }, get: function (obj) { return obj.baseUrl; }, set: function (obj, value) { obj.baseUrl = value; } }, metadata: _metadata }, _baseUrl_initializers, _baseUrl_extraInitializers);
            __esDecorate(null, null, _models_decorators, { kind: "field", name: "models", static: false, private: false, access: { has: function (obj) { return "models" in obj; }, get: function (obj) { return obj.models; }, set: function (obj, value) { obj.models = value; } }, metadata: _metadata }, _models_initializers, _models_extraInitializers);
            __esDecorate(null, null, _defaultModel_decorators, { kind: "field", name: "defaultModel", static: false, private: false, access: { has: function (obj) { return "defaultModel" in obj; }, get: function (obj) { return obj.defaultModel; }, set: function (obj, value) { obj.defaultModel = value; } }, metadata: _metadata }, _defaultModel_initializers, _defaultModel_extraInitializers);
            __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: function (obj) { return "isActive" in obj; }, get: function (obj) { return obj.isActive; }, set: function (obj, value) { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
            __esDecorate(null, null, _priority_decorators, { kind: "field", name: "priority", static: false, private: false, access: { has: function (obj) { return "priority" in obj; }, get: function (obj) { return obj.priority; }, set: function (obj, value) { obj.priority = value; } }, metadata: _metadata }, _priority_initializers, _priority_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateLLMProviderDto = CreateLLMProviderDto;
