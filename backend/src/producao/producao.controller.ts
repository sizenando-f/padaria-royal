import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProducaoService } from './producao.service';
import { CreateProducaoDto } from './dto/create-producao.dto';
import { UpdateProducaoDto } from './dto/update-producao.dto';

@Controller('producao')
export class ProducaoController {
  constructor(private readonly producaoService: ProducaoService) {}

  @Post()
  create(@Body() createProducaoDto: CreateProducaoDto) {
    return this.producaoService.create(createProducaoDto);
  }

  // Precisa vir antes do @Get('id') senão ele acha que 'pendentes é um ID'
  @Get('pendentes')
  findPendentes(){
    return this.producaoService.findPendentes();
  }

  @Get()
  findAll() {
    return this.producaoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.producaoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProducaoDto: UpdateProducaoDto) {
    return this.producaoService.update(+id, updateProducaoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.producaoService.remove(+id);
  }
}
