import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateProducaoDto } from './dto/create-producao.dto';
import { UpdateProducaoDto } from './dto/update-producao.dto';
import { PrismaService } from 'src/prisma/prisma.service';  // Importa o Prisma Service
import { freemem } from 'os';

@Injectable()
export class ProducaoService {
  // Fazemos a injeção
  constructor(private prisma: PrismaService){}

  // Para adicionar nova produção
  async create(data: CreateProducaoDto) {
    // Define a data baseado nas informações recebidas da requisição
    const inicio = new Date(data.horaInicio);
    const fim = new Date(data.horaFim);

    // Valida lógica: o fim não pode ser antes do ínicio
    if(fim <= inicio){
      throw new BadRequestException('A hora final deve ser depois da hora inicial.');
    }

    // Calcula a diferença em minutos
    const diffMs = fim.getTime() - inicio.getTime();
    const minutos = Math.floor(diffMs/60000);

    // Futuramente chamaremos a API de clima aqui
    // Por enquanto valor enviado vai ser nulo

    return await this.prisma.producao.create({
      data: {
        horaInicio: inicio,
        horaFim: fim,
        tempoFermentacaoMinutos: minutos,
        farinhaKg: data.farinhaKg,
        emulsificanteMl: data.emulsificanteMl,
        fermentoGrama: data.fermentoGrama,
        tempAmbienteInicial: data.tempAmbienteInicial,
        tempAmbienteFinal: data.tempAmbienteFinal,
        observacoes: data.observacoes,
      }
    })

  }

  async findAll() {
    return await this.prisma.producao.findMany({
      include: {
        avaliacao: true,  // Para trazer a avaliação junto
      },
      orderBy: {
        id: 'desc',     // Mostra do mais recente ao mais antigo
      }
    });
  }

  // Para encontrar uma produção específica
  async findOne(id: number) {
    const producao = await this.prisma.producao.findUnique({
      where: {id},
    });

    if(!producao) {
      throw new Error(`Produção com ID ${id} não encontrado.`);
    }

    return producao;
  }

  // Para buscar um que não tem nenhuma avaliação
  async findPendentes() {
    return await this.prisma.producao.findMany({
      where: {
        avaliacao: null,  // Filtra aqueles sem avaliação
      },
      orderBy: {
        id: 'desc',     // Ordena pelos meais recentes
      }
    })
  }


  update(id: number, updateProducaoDto: UpdateProducaoDto) {
    return `This action updates a #${id} producao`;
  }

  async remove(id: number) {
    // Verifica se existe
    const existe = await this.prisma.producao.findUnique({where: {id}});
    if(!existe){
      throw new Error('Produção não encontrada');
    }

    // Apaga de vez
    return await this.prisma.producao.delete({
      where: {id},
    });
  }

  async calcularSugestao(farinhaInput: number){
    // Pegamos os últimos 20 para uma amostra recente
    const sucessos = await this.prisma.producao.findMany({
      where: {
        avaliacao: {
          status: { in: ['EXCELENTE', 'BOM'] }
        }
      },
      orderBy: { id: 'desc' },
      take: 20,
    });

    // Se não houver histórico
    if(sucessos.length === 0){
      return { fermento: 0, emulsificante: 0, base: 0 };
    }

    // Para calcular as gramas por quilo de farinha
    let totalFermentoPorKg = 0;
    let totalEmulsificantePorKg = 0;

    for(const prod of sucessos){
      const farinha = Number(prod.farinhaKg);
      const fermento = Number(prod.fermentoGrama);
      const emulsificante = Number(prod.emulsificanteMl);

      if(farinha > 0){
        totalFermentoPorKg += (fermento / farinha);
        totalEmulsificantePorKg += (emulsificante / farinha);
      }
    }

    // Calcula a média
    const mediaFermento = totalFermentoPorKg / sucessos.length;
    const mediaEmulsificante = totalEmulsificantePorKg / sucessos.length;

    return {
      fermento: Math.round(mediaFermento * farinhaInput),   // Arredonda para inteiro
      emulsificante: Math.round(mediaEmulsificante * farinhaInput), 
      base: sucessos.length // Retorna quantos registros usou para calcular (mostra ao usuário)
    }
  }
}
