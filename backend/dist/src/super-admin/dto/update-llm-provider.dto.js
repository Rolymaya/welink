"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLLMProviderDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_llm_provider_dto_1 = require("./create-llm-provider.dto");
class UpdateLLMProviderDto extends (0, swagger_1.PartialType)(create_llm_provider_dto_1.CreateLLMProviderDto) {
}
exports.UpdateLLMProviderDto = UpdateLLMProviderDto;
//# sourceMappingURL=update-llm-provider.dto.js.map