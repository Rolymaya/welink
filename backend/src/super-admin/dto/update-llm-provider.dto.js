"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLLMProviderDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var create_llm_provider_dto_1 = require("./create-llm-provider.dto");
var UpdateLLMProviderDto = /** @class */ (function (_super) {
    __extends(UpdateLLMProviderDto, _super);
    function UpdateLLMProviderDto() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UpdateLLMProviderDto;
}((0, swagger_1.PartialType)(create_llm_provider_dto_1.CreateLLMProviderDto)));
exports.UpdateLLMProviderDto = UpdateLLMProviderDto;
