import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { UpdateAvaliacaoDto } from './dto/update-avaliacao.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AvaliacaoService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateAvaliacaoDto) {
    // Verifica se a produção existe
    const producao = await this.prisma.producao.findUnique({
      where: { id: data.producaoId },
    });

    // Se não existir dá erro
    if (!producao) {
      throw new BadRequestException('Produção não encontrada.');
    }

    // Verifica se ela já foi avaliada
    const jaAvaliada = await this.prisma.avaliacao.findUnique({
      where: { producaoId: data.producaoId },
    });

    // Se já foi dá erro
    if (jaAvaliada) {
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

  async update(id: number, data: UpdateAvaliacaoDto, usuario: any) {
    const avaliacao = await this.prisma.avaliacao.findUnique({
      where: { id },
      include: { producao: true } // Data da produção
    });

    if(!avaliacao) {
      throw new NotFoundException('Avaliação não encontrada.');
    }

    // Regra dos 3 dias
    if(usuario.cargo !== 'GERENTE'){
      const dataProducao = new Date(avaliacao.producao.horaInicio);
      const hoje = new Date();

      const diferencaMs = hoje.getTime() - dataProducao.getTime();
      const diferencaDias = diferencaMs / (1000 * 60 * 60 * 24);

      if(diferencaDias > 3){
        throw new UnauthorizedException('O prazo expirou. Só é possível editar avaliações de até 3 dias atrás.')
      }
    }

    return await this.prisma.avaliacao.update({
      where: { id },
      data: data,
    });
  }

  remove(id: number) {
    return `This action removes a #${id} avaliacao`;
  }

  async getDashboardStats() {
    // Total de avaliações
    const totalGeral = await this.prisma.avaliacao.count();

    if (totalGeral === 0) {
      return {
        media: 0,
        total: 0,
        distribuicao: [],
      };
    }

    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    fimMes.setHours(23, 59, 59, 999);

    // Histórico mensal (último 6 meses)
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5); // 5 Atrás + atual
    seisMesesAtras.setDate(1);

    const filtroPorMes = {
      producao: {
        dataProducao: {
          gte: inicioMes,
          lte: fimMes
        }
      }
    };

    const [aggGeral, gruposGeral, totalMes, aggMes, gruposMes, avaliacoesRecentes] = 
      await Promise.all([
        this.prisma.avaliacao.aggregate({ _avg: { nota: true } }),
        this.prisma.avaliacao.groupBy({ by: ['nota'], _count: { nota: true } }),
        this.prisma.avaliacao.count({ where: filtroPorMes }),
        this.prisma.avaliacao.aggregate({ where: filtroPorMes, _avg: { nota: true } }),
        this.prisma.avaliacao.groupBy({ by: ['nota'], where: filtroPorMes, _count: { nota: true } }),
        this.prisma.avaliacao.findMany({
          where: { producao: { dataProducao: { gte: seisMesesAtras } } },
          select: { nota: true, producao: { select: { dataProducao: true } } },
          orderBy: { producao: { dataProducao: 'asc' } },
        }),
    ]);

    const mediaGeral = aggGeral._avg.nota ? Number(aggGeral._avg.nota).toFixed(1) : '0.0';
    const mediaMes = aggMes._avg.nota ? Number(aggMes._avg.nota).toFixed(1) : '0.0';

    // Mapeia para formato amigável pro gráfico
    // Cores: Verde (5), Azul (4), Amarelo (3), Laranja (2), Vermelho (1)
    const configCores = {
      5: { name: 'Excelente', color: '#22c55e' }, // green-500
      4: { name: 'Bom', color: '#3b82f6' }, // blue-500
      3: { name: 'Regular', color: '#eab308' }, // yellow-500
      2: { name: 'Ruim', color: '#f97316' }, // orange-500
      1: { name: 'Péssimo', color: '#ef4444' }, // red-500
    };

    const mapDist = (grupos: any[]) => {
      const dist = [1, 2, 3, 4, 5].map(nota => {
        const found = grupos.find(g => g.nota === nota);
        return {
          nota: nota,
          name: configCores[nota]?.name || 'Outro',
          value: found ? found._count.nota : 0,
          fill: configCores[nota]?.color || '#9ca3af', // cor para o gráfico
        };
    });
      return dist.sort((a, b) => b.nota - a.nota);
    }

    const mapaMensal = new Map<string, { soma: number; count: number, sortKey: number }>();
    avaliacoesRecentes.forEach(av => {
      const d = new Date(av.producao.dataProducao);
      // Jan, Fev...
      const mesNome = d
        .toLocaleDateString('pt-BR', {
          month: 'short',
        });
      const key = mesNome.charAt(0).toUpperCase() + mesNome.slice(1);
      const sortKey = d.getFullYear() * 100 + d.getMonth(); // para ordenar

      if (!mapaMensal.has(key)) {
        mapaMensal.set(key, { soma: 0, count: 0, sortKey });
      }
      const atual = mapaMensal.get(key)!;
      atual.soma += av.nota;
      atual.count++;
    });

    const historico = Array.from(mapaMensal.entries()).map(([name, dados]) => ({
      name,
      media: Number((dados.soma / dados.count).toFixed(1)),
      sortKey: dados.sortKey
    })).sort((a, b) => a.sortKey - b.sortKey);

    // Ordena do melhor para o pior visualmente
    const distribuicaoGeral = mapDist(gruposGeral);
    const distribuicaoMes = mapDist(gruposMes);

    return {
      geral: {
        media: mediaGeral,
        total: totalGeral,
        distribuicao: distribuicaoGeral
      },
      mes: {
        media: mediaMes,
        total: totalMes,
        distribuicao: distribuicaoMes
      },
      historico,
    };
  }
}
