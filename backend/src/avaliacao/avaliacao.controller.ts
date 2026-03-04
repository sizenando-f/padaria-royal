import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AvaliacaoService } from './avaliacao.service';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { UpdateAvaliacaoDto } from './dto/update-avaliacao.dto';
import { BackupService } from 'src/backup/backup.service';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('avaliacao')
export class AvaliacaoController {
  constructor(
    private readonly avaliacaoService: AvaliacaoService,
    private readonly backupService: BackupService
  ) {}

  @Post()
  create(@Body() createAvaliacaoDto: CreateAvaliacaoDto, @Request() req) {
    if(req.user.cargo !== 'GERENTE' && !req.user.permissoes.avaliar){
      throw new UnauthorizedException('Você não tem permissão para avaliar produções.')
    }

    return this.avaliacaoService.create(createAvaliacaoDto);
  }

  @Get()
  findAll() {
    return this.avaliacaoService.findAll();
  }

  @Get('dashboard')
  async dashboard(@Request() req) {
    // Se for gerente, verifica se precisa de backup
    if(req.user && req.user.cargo === 'GERENTE'){
      this.backupService.verificarEExecutarBackup().catch(err => console.error(err));
    }

    return this.avaliacaoService.getDashboardStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.avaliacaoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAvaliacaoDto: UpdateAvaliacaoDto) {
    return this.avaliacaoService.update(+id, updateAvaliacaoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.avaliacaoService.remove(+id);
  }
}
