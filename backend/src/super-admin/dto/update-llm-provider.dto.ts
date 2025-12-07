import { PartialType } from '@nestjs/swagger';
import { CreateLLMProviderDto } from './create-llm-provider.dto';

export class UpdateLLMProviderDto extends PartialType(CreateLLMProviderDto) { }
