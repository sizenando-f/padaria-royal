import { PartialType } from '@nestjs/mapped-types';
import { CreateFornadaDto } from './create-fornada.dto';

export class UpdateFornadaDto extends PartialType(CreateFornadaDto) {}
