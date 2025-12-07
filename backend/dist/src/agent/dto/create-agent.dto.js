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
exports.CreateAgentDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateAgentDto {
}
exports.CreateAgentDto = CreateAgentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Assistente de Vendas' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2, { message: 'O nome deve ter pelo menos 2 caracteres' }),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Você é um assistente de vendas amigável e profissional. Ajude os clientes a encontrar produtos e responda suas dúvidas.',
        description: 'Prompt do sistema que define a personalidade e comportamento do agente'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10, { message: 'O prompt deve ter pelo menos 10 caracteres' }),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "prompt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, required: false }),
    __metadata("design:type", Boolean)
], CreateAgentDto.prototype, "isActive", void 0);
//# sourceMappingURL=create-agent.dto.js.map