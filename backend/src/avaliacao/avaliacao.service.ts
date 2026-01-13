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
    // Pega o total de produções registradas
    const totalProducoes = await this.prisma.producao.count();

    // A média geral das notas
    const mediaNotas = await this.prisma.avaliacao.aggregate({
      _avg: {
        nota: true,
      },
    });

    // Contagem por status, quantos BOM, quantos RUIM e etc
    const distribuicao = await this.prisma.avaliacao.groupBy({
      by: ['nota'],
      _count: {
        nota: true,
      }
    });

    const labels = {
      1: 'PÉSSIMO',
      2: 'RUIM',
      3: 'REGULAR',
      4: 'BOM',
      5: 'EXCELENTE'
    };

    // Formata para ficar fácil o frontend ler
    return {
      totalProducoes,
      mediaNota: mediaNotas._avg.nota ? Number(mediaNotas._avg.nota).toFixed(1) : '0.0',
      distribuicao: distribuicao.map(item => ({
        name: labels[item.nota],
        value: item._count.nota,
      })),
    };

  }
}
