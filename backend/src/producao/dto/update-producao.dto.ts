import { PartialType } from '@nestjs/mapped-types';
import { CreateProducaoDto } from './create-producao.dto';

export class UpdateProducaoDto extends PartialType(CreateProducaoDto) {}
