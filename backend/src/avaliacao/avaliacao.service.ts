import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { UpdateAvaliacaoDto } from './dto/update-avaliacao.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AvaliacaoService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateAvaliacaoDto) {
    // Verifica se a produção existe
    const producao = await this.prisma.producao.findUnique({
      where: {id: data.producaoId}
    });

    // Se não existir dá erro
    if(!producao){
      throw new BadRequestException('Produção não encontrada.');
    }

    // Verifica se ela já foi avaliada
    const jaAvaliada = await this.prisma.avaliacao.findUnique({
      where: { producaoId: data.producaoId},
    });

    // Se já foi dá erro
    if(jaAvaliada){
      throw new BadRequestException('Esta produção já foi avaliada');
    }

    // Salva a avaliação
    return await this.prisma.avaliacao.create({
      data: data,
    });
  }

  findAll() {
    return `This action returns all avaliacao`;
  }

  findOne(id: number) {
    return `This action returns a #${id} avaliacao`;
  }

  async update(id: number, data: UpdateAvaliacaoDto) {
    return await this.prisma.avaliacao.update({
      where: {id},
      data: {
        nota: data.nota,
        tempAmbienteFinalReal: data.tempAmbienteFinalReal,
        comentario: data.comentario
      }
    })
  }

  remove(id: number) {
    return `This action removes a #${id} avaliacao`;
  }

  async getDashboardStats() {
    // Total de avaliações
    const total = await this.prisma.avaliacao.count();

    if (total === 0) {
        return {
            media: 0,
            total: 0,
            distribuicao: []
        };
    }

    // Média Geral
    const agregacao = await this.prisma.avaliacao.aggregate({
      _avg: { nota: true }
    });
    
    // Arredonda para 1 casa decimal
    const media = agregacao._avg.nota ? Number(agregacao._avg.nota).toFixed(1) : '0.0';

    // Distribuição (Quantos Excelentes, Quantos Bons...)
    const grupos = await this.prisma.avaliacao.groupBy({
      by: ['nota'],
      _count: { nota: true }
    });

    // Mapeia para formato amigável pro gráfico
    // Cores: Verde (5), Azul (4), Amarelo (3), Laranja (2), Vermelho (1)
    const config = {
        5: { name: 'Excelente', color: '#22c55e' }, // green-500
        4: { name: 'Bom', color: '#3b82f6' },      // blue-500
        3: { name: 'Regular', color: '#eab308' },  // yellow-500
        2: { name: 'Ruim', color: '#f97316' },     // orange-500
        1: { name: 'Péssimo', color: '#ef4444' }   // red-500
    };

    const distribuicao = grupos.map(g => ({
        nota: g.nota,
        name: config[g.nota]?.name || 'Outro',
        value: g._count.nota,
        fill: config[g.nota]?.color || '#9ca3af' // cor para o gráfico
    }));

    // Ordena do melhor para o pior visualmente
    distribuicao.sort((a, b) => b.nota - a.nota);

    return {
      media,
      total,
      distribuicao
    };
  }
}
