import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FornadasService } from './fornadas.service';
import { CreateFornadaDto } from './dto/create-fornada.dto';
import { UpdateFornadaDto } from './dto/update-fornada.dto';

@Controller('fornadas')
export class FornadasController {
  constructor(private readonly fornadasService: FornadasService) {}

  @Post()
  create(@Body() createFornadaDto: CreateFornadaDto) {
    return this.fornadasService.create(createFornadaDto);
  }

  @Get()
  findAll() {
    return this.fornadasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fornadasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFornadaDto: UpdateFornadaDto) {
    return this.fornadasService.update(+id, updateFornadaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fornadasService.remove(+id);
  }
}
