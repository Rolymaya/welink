"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBankAccountDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_bank_account_dto_1 = require("./create-bank-account.dto");
class UpdateBankAccountDto extends (0, swagger_1.PartialType)(create_bank_account_dto_1.CreateBankAccountDto) {
}
exports.UpdateBankAccountDto = UpdateBankAccountDto;
//# sourceMappingURL=update-bank-account.dto.js.map