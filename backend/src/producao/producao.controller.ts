import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { ProducaoService } from './producao.service';
import { CreateProducaoDto } from './dto/create-producao.dto';
import { UpdateProducaoDto } from './dto/update-producao.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard) // Para proteger GET, POST, DELETE, PATCH
@Controller('producao')
export class ProducaoController {
  constructor(private readonly producaoService: ProducaoService) {}

  @Post()
  create(@Body() createProducaoDto: CreateProducaoDto, @Request() req) {
    if(req.user.cargo !== 'GERENTE' && !req.user.permissoes.registrar){
      throw new UnauthorizedException('Você não tem permissão para lançar produções.');
    }
    
    // Contém ID od usuário
    const usuarioId = req.user.sub;
    // Passa o ID para registrar no LOG
    return this.producaoService.create(createProducaoDto, usuarioId);
  }

  @Post('importar')
  @UseInterceptors(FileInterceptor('file'))
  async importar(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('Arquivo não enviado');
    return this.producaoService.importarDados(file.buffer);
  }

  @Get('filtrar')
  async filtrar(@Query() query: any) {
    return this.producaoService.filtrar(query);
  }

  @Get('exportar')
  async exportar(@Res() res: Response) {
    const csv = await this.producaoService.exportarDados();

    res.header('Content-Type', 'text/csv');
    res.header(
      'Content-Disposition',
      'attachment; filename=producao_royal_export.csv',
    );
    res.send(csv);
  }

  // Precisa vir antes do @Get('id') senão ele acha que 'pendentes é um ID'
  @Get('pendentes')
  findPendentes() {
    return this.producaoService.findPendentes();
  }

  // Rota para a sugestão
  @Get('sugestao')
  async obterSugestao(
    @Query('farinha') farinha: string,
    @Query('temp') temp?: string,
    @Query('tempFim') tempFim?: string,
    @Query('minutos') minutos?: string,
  ) {
    if (!farinha) return {};
    return this.producaoService.calcularSugestao(
      Number(farinha),
      temp ? Number(temp) : undefined,
      tempFim ? Number(tempFim) : undefined,
      minutos ? Number(minutos) : undefined,
    );
  }

  @Get('clima-previsao')
  async getClima(@Query('inicio') inicio: string, @Query('fim') fim: string) {
    if (!inicio || !fim) return null;
    return this.producaoService.getPrevisaoPorHorario(inicio, fim);
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
  update(
    @Param('id') id: string,
    @Body() updateProducaoDto: UpdateProducaoDto,
    @Request() req,
  ) {
    if(req.user.cargo !== 'GERENTE' && !req.user.permissoes.editar){
      throw new UnauthorizedException('Você não tem permissão para editar produções.');
    }

    return this.producaoService.update(+id, updateProducaoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    if(req.user.cargo !== 'GERENTE' && !req.user.permissoes.excluir){
      throw new UnauthorizedException('Você não tem permissão para excluir produções.');
    }

    return this.producaoService.remove(+id);
  }
}
