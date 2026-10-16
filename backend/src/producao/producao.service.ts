import { Injectable, BadRequestException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateProducaoDto } from './dto/create-producao.dto';
import { UpdateProducaoDto } from './dto/update-producao.dto';
import { PrismaService } from 'src/prisma/prisma.service'; // Importa o Prisma Service
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Readable } from 'stream';
import { parse } from 'csv-parse';
import { Parser } from 'json2csv';

@Injectable()
export class ProducaoService {
  private readonly logger = new Logger(ProducaoService.name);
  private readonly timezonePadraoImportacao = 'America/Campo_Grande';

  // Fazemos a injeção
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  // Para adicionar nova produção
  async create(data: CreateProducaoDto, usuarioId?: number) {
    // Valida os campos
    if (Number(data.farinhaKg) <= 0) {
      throw new BadRequestException('A quantidade de farinha é obrigatória.');
    }
    if (Number(data.fermentoGrama) <= 0) {
      throw new BadRequestException(
        'Não é possível iniciar produção sem fermento.',
      );
    }
    if (Number(data.emulsificanteMl) <= 0) {
      throw new BadRequestException('Quantidade de emulsificante inválida.');
    }
    if (
      Number(data.tempAmbienteInicial) <= 0 ||
      Number(data.tempAmbienteFinal) <= 0
    ) {
      throw new BadRequestException('Temperatura inválida.');
    }

    // Define a data baseado nas informações recebidas da requisição
    const inicio = new Date(data.horaInicio);
    const fim = new Date(data.horaFim);

    // Valida lógica: o fim não pode ser antes do ínicio
    if (fim <= inicio) {
      throw new BadRequestException(
        'A hora final deve ser depois da hora inicial.',
      );
    }

    // Calcula a diferença em minutos
    const diffMs = fim.getTime() - inicio.getTime();
    const minutos = Math.floor(diffMs / 60000);

    return await this.prisma.producao.create({
      data: {
        dataProducao: new Date(data.horaInicio), // Usa data real do ínicio
        horaInicio: inicio,
        horaFim: fim,
        tempoFermentacaoMinutos: minutos,
        farinhaKg: data.farinhaKg,
        emulsificanteMl: data.emulsificanteMl,
        fermentoGrama: data.fermentoGrama,
        tempAmbienteInicial: data.tempAmbienteInicial,
        tempAmbienteFinal: data.tempAmbienteFinal,
        observacoes: data.observacoes,
        usouCamara: data.usouCamara ?? false,

        // Para saber quem fez
        criadoPorId: usuarioId || null,
      },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [dados, total] = await Promise.all([
      this.prisma.producao.findMany({
        include: { avaliacao: true },
        orderBy: { id: 'desc'},
        skip,
        take: limit,
      }),
      this.prisma.producao.count(),
    ]);

    return {
      dados,
      total, 
      pagina: page,
      totalPaginas: Math.ceil(total / limit),
    }
  }

  // Para encontrar uma produção específica
  async findOne(id: number) {
    const producao = await this.prisma.producao.findUnique({
      where: { id },
      include: { avaliacao: true },
    });

    if (!producao) {
      throw new Error(`Produção com ID ${id} não encontrado.`);
    }

    return producao;
  }

  // Para buscar um que não tem nenhuma avaliação
  async findPendentes() {
    return await this.prisma.producao.findMany({
      where: {
        avaliacao: null, // Filtra aqueles sem avaliação
      },
      orderBy: {
        id: 'desc', // Ordena pelos meais recentes
      },
    });
  }

  async update(id: number, data: UpdateProducaoDto, usuario: any) {
    const producao = await this.prisma.producao.findUnique({ where: { id }});

    if(!producao){
      throw new NotFoundException('Produção não encontrada.');
    }

    // Regra dos 3 dias para padeiros
    if(usuario.cargo !== 'GERENTE'){
      const dataProducao = new Date(producao.horaInicio);
      const hoje = new Date();

      const diferencaMs = hoje.getTime() - dataProducao.getTime();
      const diferencaDias = diferencaMs / (1000 * 60 * 60 * 24);

      if(diferencaDias > 3){
        throw new UnauthorizedException('O prazo de tolerância expirou. Padeiros só podem editar produções de até 3 dias atrás.');
      }
    }

    return await this.prisma.producao.update({
      where: { id },
      data: data,
    });
  }

  async remove(id: number, usuario: any) {
    // Verifica se existe
    const existe = await this.prisma.producao.findUnique({ where: { id } });
    if (!existe) {
      throw new Error('Produção não encontrada');
    }

    // Registra o log
    await this.prisma.logExclusao.create({
      data: {
        usuarioNome: usuario.nome,
        producaoId: id 
      }
    });

    // Apaga avaliações vinculadas
    await this.prisma.avaliacao.deleteMany({
      where: {
        producaoId: id
      }
    })

    // Apaga a produção
    return await this.prisma.producao.delete({
      where: { id },
    });
  }

  async filtrar(params: any){
    const where: any = {};

    if(params.dataInicio || params.dataFim) {
      where.dataProducao = {};
      if(params.dataInicio) where.dataProducao.gte = new Date(params.dataInicio);

      if(params.dataFim) {
        const fim = new Date(params.dataFim);
        fim.setHours(23, 59, 59, 999);
        where.dataProducao.lte = fim;
      }
    }

    const addRange = (campo: string, min?: string, max?: string) => {
      if(!min && !max) return;
      where[campo] = {};
      if (min) where[campo].gte = Number(min);
      if (max) where[campo].lte = Number(max);
    };

    addRange('farinhaKg', params.farinhaMin, params.farinhaMax);
    addRange('fermentoGrama', params.fermentoMin, params.fermentoMax);
    addRange('emulsificanteMl', params.emulsificanteMin, params.emulsificanteMax);
    addRange('tempoFermentacaoMinutos', params.tempoMin, params.tempoMax);
    addRange('tempAmbienteInicial', params.tempIniMin, params.tempIniMax);
    addRange('tempAmbienteFinal', params.tempFimPrevMin, params.tempFimPrevMax);
  
    if(params.nota || params.tempRealMin || params.tempRealMax) {
      where.avaliacao = {};

      if(params.nota) {
        where.avaliacao.nota = Number(params.nota);
      }

      if(params.tempRealMin || params.tempRealMax) {
        where.avaliacao.tempAmbienteFinalReal = {};
        if(params.tempRealMin) where.avaliacao.tempAmbienteFinalReal.gte = Number(params.tempRealMin);
        if(params.tempRealMax) where.avaliacao.tempAmbienteFinalReal.lte = Number(params.tempRealMax);
      }
    }

    if (params.usouCamara !== undefined && params.usouCamara !== '') {
      where.usouCamara = params.usouCamara === 'true' || params.usouCamara === true;
    }

    return await this.prisma.producao.findMany({
      where,
      include: { avaliacao: true },
      orderBy: { id: 'desc' }
    });
  }

  async getBiStats(periodo: 'todos' | 'mes' = 'todos') {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    fimMes.setHours(23, 59, 59, 999);

    const whereClause: any =
      periodo === 'mes'
        ? {
            dataProducao: {
              gte: inicioMes,
              lte: fimMes,
            },
          }
        : {};

    // Histórico mensal (últimos 6 meses) para o gráfico de consumo de farinha
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5);
    seisMesesAtras.setDate(1);
    seisMesesAtras.setHours(0, 0, 0, 0);

    const [agg, totalCount, producoesRecentes, producoesPeriodo, producoesNota5Global] =
      await Promise.all([
        this.prisma.producao.aggregate({
          where: whereClause,
          _sum: {
            farinhaKg: true,
            fermentoGrama: true,
            emulsificanteMl: true,
          },
          _avg: {
            farinhaKg: true,
            fermentoGrama: true,
            tempoFermentacaoMinutos: true,
          },
        }),
        this.prisma.producao.count({ where: whereClause }),
        this.prisma.producao.findMany({
          where: {
            dataProducao: { gte: seisMesesAtras },
          },
          select: {
            dataProducao: true,
            farinhaKg: true,
          },
          orderBy: {
            dataProducao: 'asc',
          },
        }),
        this.prisma.producao.findMany({
          where: whereClause,
          select: {
            id: true,
            farinhaKg: true,
            fermentoGrama: true,
            tempAmbienteInicial: true,
            tempAmbienteFinal: true,
            tempoFermentacaoMinutos: true,
            usouCamara: true,
            avaliacao: {
              select: {
                nota: true,
              },
            },
          },
        }),
        periodo === 'mes'
          ? this.prisma.producao.findMany({
              where: {
                avaliacao: {
                  nota: 5,
                },
                usouCamara: false,
              },
              select: {
                farinhaKg: true,
                fermentoGrama: true,
                tempAmbienteInicial: true,
                tempAmbienteFinal: true,
                tempoFermentacaoMinutos: true,
              },
            })
          : Promise.resolve(null),
      ]);

    const totalFarinhaKg = agg._sum.farinhaKg ? Number(agg._sum.farinhaKg) : 0;
    const totalFermentoGrama = agg._sum.fermentoGrama ? Number(agg._sum.fermentoGrama) : 0;
    const totalEmulsificanteMl = agg._sum.emulsificanteMl ? Number(agg._sum.emulsificanteMl) : 0;

    const tempoMedioMinutos = agg._avg.tempoFermentacaoMinutos
      ? Math.round(Number(agg._avg.tempoFermentacaoMinutos))
      : 0;

    const mediaFarinhaPorFornada =
      totalCount > 0 ? Number((totalFarinhaKg / totalCount).toFixed(2)) : 0;

    // Proporção média de fermento: g de fermento por kg de farinha
    const proporcaoFermentoGramaPorKg =
      totalFarinhaKg > 0 ? Number((totalFermentoGrama / totalFarinhaKg).toFixed(2)) : 0;

    // Helper: Categorização em 3 faixas climáticas naturais
    const getFaixaClima = (
      tIniVal: number | null,
      tFimVal: number | null,
    ): 'frio' | 'ameno' | 'quente' => {
      let tMed: number;
      if (tIniVal !== null && tFimVal !== null) {
        tMed = (tIniVal + tFimVal) / 2;
      } else if (tIniVal !== null) {
        tMed = tIniVal;
      } else if (tFimVal !== null) {
        tMed = tFimVal;
      } else {
        tMed = 23; // fallback ameno
      }

      if (tMed < 20) return 'frio';
      if (tMed <= 26) return 'ameno';
      return 'quente';
    };

    // --- EDGE CASE 1: Fallback Global da Zona de Ouro (Nota 5) ---
    // Apenas fornadas naturais (não câmara) participam da zona de ouro climática
    const globalNota5List: Array<{
      farinhaKg: any;
      fermentoGrama: any;
      tempAmbienteInicial: any;
      tempAmbienteFinal: any;
      tempoFermentacaoMinutos?: any;
    }> =
      periodo === 'mes' && producoesNota5Global
        ? producoesNota5Global
        : producoesPeriodo.filter((p) => p.avaliacao?.nota === 5 && !p.usouCamara);

    const globalFaixas: Record<'frio' | 'ameno' | 'quente', { somaDosagem: number; count: number }> =
      {
        frio: { somaDosagem: 0, count: 0 },
        ameno: { somaDosagem: 0, count: 0 },
        quente: { somaDosagem: 0, count: 0 },
      };

    globalNota5List.forEach((p) => {
      const far = Number(p.farinhaKg);
      const fer = Number(p.fermentoGrama);
      if (far > 0) {
        const dosagem = fer / far;
        const tIni = p.tempAmbienteInicial !== null ? Number(p.tempAmbienteInicial) : null;
        const tFim = p.tempAmbienteFinal !== null ? Number(p.tempAmbienteFinal) : null;
        const faixa = getFaixaClima(tIni, tFim);
        globalFaixas[faixa].somaDosagem += dosagem;
        globalFaixas[faixa].count += 1;
      }
    });

    const globalMediaOuro: Record<'frio' | 'ameno' | 'quente', number> = {
      frio:
        globalFaixas.frio.count > 0
          ? Number((globalFaixas.frio.somaDosagem / globalFaixas.frio.count).toFixed(2))
          : 8.54,
      ameno:
        globalFaixas.ameno.count > 0
          ? Number((globalFaixas.ameno.somaDosagem / globalFaixas.ameno.count).toFixed(2))
          : 8.54,
      quente:
        globalFaixas.quente.count > 0
          ? Number((globalFaixas.quente.somaDosagem / globalFaixas.quente.count).toFixed(2))
          : 8.54,
    };

    // --- LOOP 1: Agregação da Zona de Ouro do Período e Sensibilidade Térmica ---
    const periodoFaixas: Record<'frio' | 'ameno' | 'quente', { somaDosagem: number; count: number }> =
      {
        frio: { somaDosagem: 0, count: 0 },
        ameno: { somaDosagem: 0, count: 0 },
        quente: { somaDosagem: 0, count: 0 },
      };

    let totalNota5Periodo = 0;
    let somaTempoNota5 = 0;
    let somaTempNota5 = 0;
    let countTempNota5 = 0;
    let totalAvaliadosPeriodo = 0;

    let countTotalEstavel = 0;
    let somaNotaEstavel = 0;
    let countAvalEstavel = 0;

    let countTotalOscilacao = 0;
    let somaNotaOscilacao = 0;
    let countAvalOscilacao = 0;

    producoesPeriodo.forEach((p) => {
      // Fornadas de câmara possuem clima e receita controlados, não entram na auditoria climática nem no delta T
      if (p.usouCamara) {
        return;
      }

      const tIni = p.tempAmbienteInicial !== null ? Number(p.tempAmbienteInicial) : null;
      const tFim = p.tempAmbienteFinal !== null ? Number(p.tempAmbienteFinal) : null;
      const temAvaliacao = p.avaliacao && typeof p.avaliacao.nota === 'number';
      const nota = temAvaliacao ? p.avaliacao!.nota : null;

      if (temAvaliacao) {
        totalAvaliadosPeriodo += 1;
      }

      // Zona de Ouro (Fornadas com Nota 5)
      if (nota === 5) {
        totalNota5Periodo += 1;
        somaTempoNota5 += p.tempoFermentacaoMinutos || 0;
        if (tIni !== null || tFim !== null) {
          const tMed =
            tIni !== null && tFim !== null ? (tIni + tFim) / 2 : (tIni ?? tFim ?? 23);
          somaTempNota5 += tMed;
          countTempNota5 += 1;
        }

        const far = Number(p.farinhaKg);
        const fer = Number(p.fermentoGrama);
        if (far > 0) {
          const dosagem = fer / far;
          const faixa = getFaixaClima(tIni, tFim);
          periodoFaixas[faixa].somaDosagem += dosagem;
          periodoFaixas[faixa].count += 1;
        }
      }

      // Sensibilidade Térmica (Amplitude Delta T = |tFim - tIni|)
      // EDGE CASE 3: Ignorar fornadas sem avaliação no cálculo das notas médias
      if (tIni !== null && tFim !== null) {
        const deltaT = Math.abs(tFim - tIni);
        if (deltaT <= 4) {
          countTotalEstavel += 1;
          if (nota !== null) {
            somaNotaEstavel += nota;
            countAvalEstavel += 1;
          }
        } else {
          countTotalOscilacao += 1;
          if (nota !== null) {
            somaNotaOscilacao += nota;
            countAvalOscilacao += 1;
          }
        }
      }
    });

    // Consolidação das faixas de referência com fallback seguro
    const faixasReferencia = {
      frio: {
        faixa: '< 20°C' as const,
        dosagemMediaNota5:
          periodoFaixas.frio.count > 0
            ? Number((periodoFaixas.frio.somaDosagem / periodoFaixas.frio.count).toFixed(2))
            : globalMediaOuro.frio,
        fornadas:
          periodoFaixas.frio.count > 0 ? periodoFaixas.frio.count : globalFaixas.frio.count,
        usouFallback: periodoFaixas.frio.count === 0,
      },
      ameno: {
        faixa: '20°C - 26°C' as const,
        dosagemMediaNota5:
          periodoFaixas.ameno.count > 0
            ? Number((periodoFaixas.ameno.somaDosagem / periodoFaixas.ameno.count).toFixed(2))
            : globalMediaOuro.ameno,
        fornadas:
          periodoFaixas.ameno.count > 0 ? periodoFaixas.ameno.count : globalFaixas.ameno.count,
        usouFallback: periodoFaixas.ameno.count === 0,
      },
      quente: {
        faixa: '> 26°C' as const,
        dosagemMediaNota5:
          periodoFaixas.quente.count > 0
            ? Number((periodoFaixas.quente.somaDosagem / periodoFaixas.quente.count).toFixed(2))
            : globalMediaOuro.quente,
        fornadas:
          periodoFaixas.quente.count > 0 ? periodoFaixas.quente.count : globalFaixas.quente.count,
        usouFallback: periodoFaixas.quente.count === 0,
      },
    };

    // --- LOOP 2: Auditoria Climática (Opção B - Aderência a ±10% da Zona de Ouro) ---
    let countAderente = 0;
    let somaNotaAderente = 0;
    let countAvalAderente = 0;

    let countDescalibrado = 0;
    let somaNotaDescalibrado = 0;
    let countAvalDescalibrado = 0;

    producoesPeriodo.forEach((p) => {
      // Fornadas de câmara possuem clima e receita controlados, não entram na auditoria climática
      if (p.usouCamara) {
        return;
      }

      const far = Number(p.farinhaKg);
      const fer = Number(p.fermentoGrama);
      const dosagem = far > 0 ? fer / far : 0;
      const tIni = p.tempAmbienteInicial !== null ? Number(p.tempAmbienteInicial) : null;
      const tFim = p.tempAmbienteFinal !== null ? Number(p.tempAmbienteFinal) : null;
      const faixa = getFaixaClima(tIni, tFim);
      const metaOuro = faixasReferencia[faixa].dosagemMediaNota5;

      // Margem aceitável para o clima do dia: ±10%
      const isAderente = dosagem >= metaOuro * 0.9 && dosagem <= metaOuro * 1.1;
      const temAvaliacao = p.avaliacao && typeof p.avaliacao.nota === 'number';
      const nota = temAvaliacao ? p.avaliacao!.nota : null;

      if (isAderente) {
        countAderente += 1;
        // EDGE CASE 3: Ignora fornada sem avaliação na média de notas
        if (nota !== null) {
          somaNotaAderente += nota;
          countAvalAderente += 1;
        }
      } else {
        countDescalibrado += 1;
        if (nota !== null) {
          somaNotaDescalibrado += nota;
          countAvalDescalibrado += 1;
        }
      }
    });

    const totalAuditoria = countAderente + countDescalibrado;
    const taxaAderenciaIdeal =
      totalAuditoria > 0 ? Number(((countAderente / totalAuditoria) * 100).toFixed(1)) : 0;

    const notaMediaAderente =
      countAvalAderente > 0 ? Number((somaNotaAderente / countAvalAderente).toFixed(2)) : 0;

    const notaMediaDescalibrado =
      countAvalDescalibrado > 0
        ? Number((somaNotaDescalibrado / countAvalDescalibrado).toFixed(2))
        : 0;

    // --- MÓDULO 1: Balanço de Massa e Estimativa de Produção (3 Cenários) ---
    const paesEstimadosTotalFarinha = Math.round(totalFarinhaKg * 21.25);
    const paesEstimadosPorFornadaFarinha = Math.round(mediaFarinhaPorFornada * 21.25);

    const massaCruaTotalKg = Number((totalFarinhaKg * 1.505).toFixed(2));
    const massaCruaPorFornadaKg = Number((mediaFarinhaPorFornada * 1.505).toFixed(2));

    const paoAssadoTotalKg = Number((totalFarinhaKg * 1.16875).toFixed(2));
    const paoAssadoPorFornadaKg = Number((mediaFarinhaPorFornada * 1.16875).toFixed(2));

    const balancoMassa = {
      cenarioFarinha: {
        fatorConversao: 21.25,
        paesEstimadosTotal: paesEstimadosTotalFarinha,
        paesEstimadosPorFornada: paesEstimadosPorFornadaFarinha,
      },
      cenarioMassaCrua: {
        fatorMassa: 1.505,
        massaCruaTotalKg,
        massaCruaPorFornadaKg,
        rendimentoPorKgMassa: 14,
        paesEstimadosTotal: Math.round(massaCruaTotalKg * 14),
        paesEstimadosPorFornada: Math.round(massaCruaPorFornadaKg * 14),
      },
      cenarioPaoAssado: {
        fatorAssado: 1.16875,
        paoAssadoTotalKg,
        paoAssadoPorFornadaKg,
        rendimentoPorKgAssado: 18,
        taxaQuebraEvaporacao: 22.3,
        perdaAguaTotalKg: Number((totalFarinhaKg * (1.505 - 1.16875)).toFixed(2)),
        paesEstimadosTotal: Math.round(paoAssadoTotalKg * 18),
        paesEstimadosPorFornada: Math.round(paoAssadoPorFornadaKg * 18),
      },
    };

    // --- Agrupamento mensal com projeção linear (Run-Rate) ---
    const mesesMap = new Map<
      string,
      { nome: string; farinhaKg: number; fornadas: number; sortKey: number; isMesAtual: boolean }
    >();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesNome = d.toLocaleDateString('pt-BR', { month: 'short' });
      const key = (mesNome.charAt(0).toUpperCase() + mesNome.slice(1)).replace('.', '');
      const sortKey = d.getFullYear() * 100 + d.getMonth();
      const isMesAtual = i === 0;
      mesesMap.set(key, { nome: key, farinhaKg: 0, fornadas: 0, sortKey, isMesAtual });
    }

    producoesRecentes.forEach((p) => {
      const d = new Date(p.dataProducao);
      const mesNome = d.toLocaleDateString('pt-BR', { month: 'short' });
      const key = (mesNome.charAt(0).toUpperCase() + mesNome.slice(1)).replace('.', '');
      if (mesesMap.has(key)) {
        const item = mesesMap.get(key)!;
        item.farinhaKg += Number(p.farinhaKg);
        item.fornadas += 1;
      }
    });

    const diasNoMesAtual = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
    const diaHoje = Math.max(1, hoje.getDate());

    const evolucaoFarinha = Array.from(mesesMap.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .map((item) => {
        const farinhaRealizada = Number(item.farinhaKg.toFixed(1));
        if (item.isMesAtual) {
          const projecaoFechamento = Number(
            ((farinhaRealizada / diaHoje) * diasNoMesAtual).toFixed(1),
          );
          const projecaoRestante = Math.max(
            0,
            Number((projecaoFechamento - farinhaRealizada).toFixed(1)),
          );
          return {
            name: item.nome,
            farinhaKg: farinhaRealizada,
            fornadas: item.fornadas,
            isMesAtual: true,
            projecaoFechamentoKg: projecaoFechamento,
            projecaoRestanteKg: projecaoRestante,
          };
        }
        return {
          name: item.nome,
          farinhaKg: farinhaRealizada,
          fornadas: item.fornadas,
          isMesAtual: false,
          projecaoFechamentoKg: farinhaRealizada,
          projecaoRestanteKg: 0,
        };
      });

    const totalFornadasCamara = producoesPeriodo.filter((p) => p.usouCamara).length;

    return {
      periodo,
      totalFarinhaKg: Number(totalFarinhaKg.toFixed(2)),
      totalFermentoGrama: Number(totalFermentoGrama.toFixed(2)),
      totalEmulsificanteMl: Number(totalEmulsificanteMl.toFixed(2)),
      totalFornadas: totalCount,
      totalFornadasCamara,
      tempoMedioMinutos,
      mediaFarinhaPorFornada,
      proporcaoFermentoGramaPorKg,
      tendenciaFarinha: await (async () => {
        if (periodo !== 'mes') return null;
        const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59, 999);
        const aggAnt = await this.prisma.producao.aggregate({
          where: { dataProducao: { gte: inicioMesAnterior, lte: fimMesAnterior } },
          _sum: { farinhaKg: true },
        });
        const farinhaAnt = aggAnt._sum.farinhaKg ? Number(aggAnt._sum.farinhaKg) : 0;
        if (farinhaAnt <= 0) return null;
        return Number((((totalFarinhaKg - farinhaAnt) / farinhaAnt) * 100).toFixed(1));
      })(),
      evolucaoFarinha,
      balancoMassa,
      auditoriaClima: {
        taxaAderenciaIdeal,
        notaMediaAderente,
        notaMediaDescalibrado,
        totalAderente: countAderente,
        totalDescalibrado: countDescalibrado,
        faixasReferencia,
      },
      sensibilidadeTermica: {
        estavel: {
          total: countTotalEstavel,
          notaMedia:
            countAvalEstavel > 0 ? Number((somaNotaEstavel / countAvalEstavel).toFixed(2)) : 0,
        },
        oscilacao: {
          total: countTotalOscilacao,
          notaMedia:
            countAvalOscilacao > 0
              ? Number((somaNotaOscilacao / countAvalOscilacao).toFixed(2))
              : 0,
        },
      },
      zonaDeOuro: {
        totalNota5: totalNota5Periodo,
        percentualDoTotal:
          totalAvaliadosPeriodo > 0
            ? Number(((totalNota5Periodo / totalAvaliadosPeriodo) * 100).toFixed(1))
            : 0,
        tempoMedioMinutos:
          totalNota5Periodo > 0 ? Math.round(somaTempoNota5 / totalNota5Periodo) : 0,
        tempMediaAmbiente:
          countTempNota5 > 0 ? Number((somaTempNota5 / countTempNota5).toFixed(1)) : 0,
      },
    };
  }


  async getPrevisaoPorHorario(inicioIso: string, fimIso: string) {
    try {
      const inicioDate = new Date(inicioIso);
      const fimDate = new Date(fimIso);

      if (isNaN(inicioDate.getTime()) || isNaN(fimDate.getTime())) {
        return {
          tempInicial: null,
          tempFinal: null,
          aviso: 'Horários de início ou fim inválidos.',
        };
      }

      const lat = this.configService.get<string>('CIDADE_LAT') || '-21.78759548687768';
      const lon = this.configService.get<string>('CIDADE_LON') || '-54.5592407544818';

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&timezone=auto&past_days=2&forecast_days=3&timeformat=unixtime`;

      this.logger.log(`Buscando clima (Auto) em: ${url}`);

      const response = await axios.get(url, { timeout: 8000 });

      const times: number[] = response.data?.hourly?.time || [];
      const temps: number[] = response.data?.hourly?.temperature_2m || [];

      if (!times.length || !temps.length) {
        return {
          tempInicial: null,
          tempFinal: null,
          aviso: 'Dados meteorológicos indisponíveis no momento.',
        };
      }

      const targetInicioSeconds = Math.floor(inicioDate.getTime() / 1000);
      const targetFimSeconds = Math.floor(fimDate.getTime() / 1000);

      const findClosestTemp = (targetSec: number) => {
        let menorDiff = Infinity;
        let indexEncontrado = -1;

        for (let i = 0; i < times.length; i++) {
          const diff = Math.abs(times[i] - targetSec);
          if (diff < menorDiff) {
            menorDiff = diff;
            indexEncontrado = i;
          }
        }

        if (indexEncontrado === -1) return null;

        // Se a diferença for superior a 4 dias (345600 seg), desconsidera
        if (menorDiff > 345600) return null;

        // Proteção extra: Se a API devolver null, retornamos null explicitamente
        const temperatura = temps[indexEncontrado];
        if (temperatura === null || temperatura === undefined) return null;

        return {
          temp: temperatura,
          time: times[indexEncontrado],
        };
      };

      const dadoIni = findClosestTemp(targetInicioSeconds);
      const dadoFim = findClosestTemp(targetFimSeconds);

      // Verificação reforçada
      if (!dadoIni || !dadoFim) {
        return {
          tempInicial: null,
          tempFinal: null,
          aviso: 'Sem dados meteorológicos para este horário.',
        };
      }

      this.logger.log(
        `[Clima] Encontrado: ${dadoIni.temp}°C e ${dadoFim.temp}°C`,
      );

      return {
        tempInicial: Math.round(dadoIni.temp),
        tempFinal: Math.round(dadoFim.temp),
        fonte: 'Open-Meteo (Best Match)',
      };
    } catch (error) {
      this.logger.error(`Erro Open-Meteo: ${error.message}`);
      return {
        tempInicial: null,
        tempFinal: null,
        aviso: 'Instabilidade na consulta meteorológica. Insira as temperaturas manualmente.',
      };
    }
  }

  async calcularSugestao(
    farinhaInput: number,
    tempAtual?: number,
    tempFinal?: number,
    minutosAlvo?: number,
  ) {
    // Para pegar todas as prodoções de sucesso com as duas temperaturas (excluindo câmara)
    const historico = await this.prisma.producao.findMany({
      where: {
        usouCamara: false, // Câmara possui parâmetros fixos e clima artificial; não contamina a sugestão K-NN
        avaliacao: {
          nota: { gte: 4 }, // Maior ou igual a 4
        },
        tempAmbienteInicial: { not: null }, // Com temperatura inicial
        tempAmbienteFinal: { not: null }, // Com temperatura final
        farinhaKg: { gt: 0 },
      },
      select: {
        id: true,
        farinhaKg: true,
        fermentoGrama: true,
        emulsificanteMl: true,
        tempAmbienteInicial: true,
        tempAmbienteFinal: true,
        tempoFermentacaoMinutos: true,
        observacoes: true,
        usouCamara: true,
        avaliacao: {
          select: {
            nota: true,
            comentario: true,
            tempAmbienteFinalReal: true,
          },
        },
      },
    });

    if (historico.length === 0) {
      return {
        fermento: 0,
        mensagem:
          'Sem dados históricos excelentes com temperatura para calcular.',
        provas: [],
      };
    }

    let selecionados: any[] = [];

    // Cálculo com pesos
    if (tempAtual) {
      // Calcula a distância de cada registro para o cenário atual
      const comDistancia = historico.map((p) => {
        const tIni = Number(p.tempAmbienteInicial);
        const tFim = p.tempAmbienteFinal ? Number(p.tempAmbienteFinal) : tIni; // Usa a inicial como fallback

        // Distância Euclidiana simplificada: |Delta Inicial| + |Delta Final|
        const diffIni = Math.abs(tIni - tempAtual);
        const diffFim = tempFinal ? Math.abs(tFim - tempFinal) : 0;
        const distanciaTemp = diffIni + diffFim; // Quanto menor, melhor

        let distanciaTempo = 0;
        if (minutosAlvo && p.tempoFermentacaoMinutos) {
          distanciaTempo =
            Math.abs(p.tempoFermentacaoMinutos - minutosAlvo) / 60;
        }

        const distanciaTotal = distanciaTemp + distanciaTempo;

        // O peso é o inverso da distância, quanto menor a distância, maior o peso
        const peso = 1 / (distanciaTotal + 0.1); // Adiciona +1 pra evitar divisão por 0 caso a temperatura for idêntica

        return {
          ...p,
          distancia: distanciaTotal,
          peso,
        };
      });

      // Ordena pelos mais próximos
      comDistancia.sort((a, b) => a.distancia - b.distancia);

      // Pega os top 20 mais parecidos
      selecionados = comDistancia.slice(0, 20);
    } else {
      // Peso igual pra todos como fallback
      selecionados = historico.slice(-20).map((p) => ({
        ...p,
        peso: 1,
      }));
    }

    // Média ponderada
    let somaPonderada = 0;
    let somaPesos = 0;

    for (const item of selecionados) {
      const farinha = Number(item.farinhaKg);
      const fermento = Number(item.fermentoGrama);

      // Se o peso é alto, essa proporção possui mais importância
      if (farinha > 0) {
        const proporcao = fermento / farinha;
        somaPonderada += proporcao * item.peso;
        somaPesos += item.peso;
      }
    }

    const mediaProporcao = somaPesos > 0 ? somaPonderada / somaPesos : 0;
    const fermentoSugerido = Math.round(mediaProporcao * farinhaInput);

    const topProvas = selecionados.slice(0, 5);

    return {
      fermento: fermentoSugerido,
      mensagem: `Sistema analisou ${selecionados.length} fornadas similares (considerando Clima e Tempo de Fermentação).`,
      // Retorna completo para a prova
      provas: topProvas.map((s) => ({
        id: s.id,
        tIni: Number(s.tempAmbienteInicial),
        tFim: s.tempAmbienteFinal ? Number(s.tempAmbienteFinal) : null,
        tReal: s.avaliacao?.tempAmbienteFinalReal
          ? Number(s.avaliacao.tempAmbienteFinalReal)
          : null,
        nota: s.avaliacao?.nota,
        tempo: s.tempoFermentacaoMinutos,
        farinha: Number(s.farinhaKg),
        fermento: Number(s.fermentoGrama),
        emulsificante: Number(s.emulsificanteMl),
        obs: s.observacoes,
        comentario: s.avaliacao?.comentario,
      })),
    };
  }

  async importarDados(buffer: Buffer) {
    // Dispara o processamento em background sem await.
    this.processarImportacao(buffer).catch((err) => {
      this.logger.error('Erro fatal na importação em background: ' + err.message);
    });

    return {
      mensagem: 'Importação iniciada! Aguarde cerca de 1 minuto e recarregue o histórico para ver os dados.',
    };
  }

  private async processarImportacao(buffer: Buffer) {
    const bufferString = buffer.toString('utf-8');
    const stream = Readable.from(bufferString);
    const timezoneImportacao =
      this.configService.get<string>('IMPORT_TIMEZONE') ||
      this.configService.get<string>('TZ') ||
      this.timezonePadraoImportacao;

    const parser = stream.pipe(
      parse({
        delimiter: ';',
        columns: true,
        trim: true,
        bom: true,
        relax_column_count: true,
        skip_empty_lines: true,
      }),
    );

    // Helpers
    const normalizeKey = (obj: any, keyPart: string) => {
      const key = Object.keys(obj).find((k) =>
        k.toLowerCase().includes(keyPart.toLowerCase()),
      );
      return key ? obj[key] : null;
    };

    const parseNum = (val: any) => {
      if (!val || String(val).toUpperCase().trim() === 'N/A') return 0;
      return parseFloat(String(val).replace(',', '.').trim()) || 0;
    };

    // Lê todo o CSV em memória (zero chamadas ao banco)
    type DadosLinha = {
      dataProducao: string;
      horaInicio: string;
      horaFim: string;
      tempoFermentacaoMinutos: number;
      farinhaKg: number;
      fermentoGrama: number;
      emulsificanteMl: number;
      tempAmbienteInicial: number;
      tempAmbienteFinal: number;
      observacoes: string | null;
      ehPendente: boolean;
      nota: number;
      tempFimReal: number | null;
      comentario: string | null;
    };

    const linhasValidas: DadosLinha[] = [];
    let erros = 0;

    for await (const row of parser) {
      try {
        const rawData = normalizeKey(row, 'data');
        if (!rawData) {
          this.logger.warn('Linha ignorada: Coluna de Data não encontrada.');
          continue;
        }

        const tempIni     = normalizeKey(row, 'inicial');
        const tempFimPrev = normalizeKey(row, 'final prevista');
        const tempFimReal = normalizeKey(row, 'final real');
        const farinhaStr  = normalizeKey(row, 'quilos farinha');
        const fermentoStr = normalizeKey(row, 'gramas fermento');
        const emulsifStr  = normalizeKey(row, 'ml emulsificante');
        const qualidadeStr = normalizeKey(row, 'qualidade');
        const statusStr   = normalizeKey(row, 'status');

        const partes   = String(rawData).trim().split(/[ ,]+/);
        const dataPart = partes[0];
        let horaPart   = partes[1] || '00:00:00';

        if (horaPart.split(':').length === 2) horaPart += ':00';

        const dataSplitted = dataPart.split('/');
        if (dataSplitted.length !== 3) {
          this.logger.warn(`Linha ignorada: Formato de data inválido: ${rawData}`);
          continue;
        }

        const [dia, mes, ano] = dataSplitted;

        const [hora, minuto, segundo] = horaPart.split(':');
        const parsedDate = this.criarDataNoFuso(
          Number(ano),
          Number(mes),
          Number(dia),
          Number(hora),
          Number(minuto),
          Number(segundo),
          timezoneImportacao,
        );

        if (!parsedDate || isNaN(parsedDate.getTime())) {
          this.logger.warn(`Linha ignorada: Data inválida: ${rawData}`);
          continue;
        }

        const dataInicioIso = parsedDate.toISOString();
        const dataProducaoDate = this.criarDataNoFuso(
          Number(ano),
          Number(mes),
          Number(dia),
          0,
          0,
          0,
          timezoneImportacao,
        );

        if (!dataProducaoDate || isNaN(dataProducaoDate.getTime())) {
          this.logger.warn(`Linha ignorada: Data de produção inválida: ${rawData}`);
          continue;
        }

        const mapNota: Record<string, number> = {
          excelente: 5, bom: 4, razoavel: 3,
          regular: 3,   ruim: 2, pessimo: 1, péssimo: 1,
        };

        const notaStr  = qualidadeStr ? qualidadeStr.toLowerCase().trim() : 'bom';
        const nota     = mapNota[notaStr] || 4;
        const fermento = parseNum(fermentoStr);
        const farinha  = parseNum(farinhaStr);

        if (farinha <= 0) {
          this.logger.warn(`Linha ignorada: Farinha <= 0: ${farinhaStr}`);
          continue;
        }

        const tempoHorasStr = normalizeKey(row, 'tempo ferment');
        const minutos = tempoHorasStr ? Math.round(parseNum(tempoHorasStr) * 60) : 0;

        const obs    = normalizeKey(row, 'observa');
        const coment = normalizeKey(row, 'coment');

        const ehPendente =
          (statusStr    && statusStr.toLowerCase().trim()    === 'pendente') ||
          (qualidadeStr && qualidadeStr.toLowerCase().trim() === 'n/a')      ||
          (qualidadeStr && qualidadeStr.toLowerCase().trim() === 'pendente');

        linhasValidas.push({
          dataProducao:            dataProducaoDate.toISOString(),
          horaInicio:              dataInicioIso,
          horaFim:                 new Date(parsedDate.getTime() + minutos * 60000).toISOString(),
          tempoFermentacaoMinutos: minutos,
          farinhaKg:               farinha,
          fermentoGrama:           fermento,
          emulsificanteMl:         parseNum(emulsifStr),
          tempAmbienteInicial:     parseNum(tempIni),
          tempAmbienteFinal:       parseNum(tempFimPrev),
          observacoes:             obs && String(obs).toUpperCase() !== 'N/A' ? obs : null,
          ehPendente:              !!ehPendente,
          nota,
          tempFimReal:             tempFimReal && String(tempFimReal).toUpperCase() !== 'N/A'
                                     ? parseNum(tempFimReal)
                                     : null,
          comentario:              coment && String(coment).toUpperCase() !== 'N/A' ? coment : null,
        });

      } catch (error: any) {
        this.logger.error(`Erro ao processar linha ${linhasValidas.length + erros + 1}: ${error.message}`);
        erros++;
      }
    }

    linhasValidas.reverse(); // Inverte para inserir no bd corretamente

    // Envia pro banco em lotes de 50, SEM $transaction
    const TAMANHO_LOTE = 50;
    let importados = 0;

    for (let i = 0; i < linhasValidas.length; i += TAMANHO_LOTE) {
      const lote = linhasValidas.slice(i, i + TAMANHO_LOTE);

      try {
        // Promise.all sem $transaction: paralelo, sem timeout de conexão
        const resultados = await Promise.allSettled(
          lote.map((linha) =>
            this.prisma.producao.create({
              data: {
                dataProducao:            linha.dataProducao,
                horaInicio:              linha.horaInicio,
                horaFim:                 linha.horaFim,
                tempoFermentacaoMinutos: linha.tempoFermentacaoMinutos,
                farinhaKg:               linha.farinhaKg,
                fermentoGrama:           linha.fermentoGrama,
                emulsificanteMl:         linha.emulsificanteMl,
                tempAmbienteInicial:     linha.tempAmbienteInicial,
                tempAmbienteFinal:       linha.tempAmbienteFinal,
                observacoes:             linha.observacoes,

                ...(!linha.ehPendente && {
                  avaliacao: {
                    create: {
                      nota:                  linha.nota,
                      tempAmbienteFinalReal:  linha.tempFimReal,
                      comentario:            linha.comentario,
                    },
                  },
                }),
              },
            }),
          ),
        );

        // Promise.allSettled não lança exceção - verifica cada resultado
        const sucessos = resultados.filter((r) => r.status === 'fulfilled').length;
        const falhas   = resultados.filter((r) => r.status === 'rejected').length;

        importados += sucessos;
        erros      += falhas;

        this.logger.log(
          `Lote ${Math.floor(i / TAMANHO_LOTE) + 1}: ${sucessos} salvos, ${falhas} erros — total ${importados}/${linhasValidas.length}`,
        );

      } catch (error: any) {
        this.logger.error(
          `Erro inesperado no lote ${Math.floor(i / TAMANHO_LOTE) + 1}: ${error.message}`,
        );
        erros += lote.length;
      }
    }

    this.logger.log(`Importação concluída. Importados: ${importados}. Erros/Ignorados: ${erros}`);
  }

  async exportarDados() {
    const dados = await this.prisma.producao.findMany({
      include: {
        avaliacao: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    const dadosFormatados = dados.map((p) => {
      const notaLabels = {
        5: 'excelente',
        4: 'bom',
        3: 'regular',
        2: 'ruim',
        1: 'pessimo',
      };

      return {
        Fornada: `#${p.id}`,
        'Data/Hora': new Date(p.horaInicio).toLocaleString('pt-BR'),
        'Câmara': p.usouCamara ? 'Sim' : 'Não',
        'Temperatura Inicial (°C)': p.tempAmbienteInicial,
        'Temperatura Final Prevista (°C)': p.tempAmbienteFinal,
        'Temperatura Final Real (°C)': p.avaliacao?.tempAmbienteFinalReal || '',
        'Tempo Fermentação (h)': (p.tempoFermentacaoMinutos / 60)
          .toFixed(1)
          .replace('.', ','),
        'Quilos Farinha': Number(p.farinhaKg).toFixed(1).replace('.', ','),
        'ML Emulsificante': p.emulsificanteMl,
        'Gramas Fermento': p.fermentoGrama,
        'Fermento por KG': (Number(p.fermentoGrama) / Number(p.farinhaKg))
          .toFixed(1)
          .replace('.', ','),
        Qualidade: p.avaliacao ? notaLabels[p.avaliacao.nota] : 'pendente',
        'Status Avaliação': p.avaliacao ? 'Avaliado' : 'Pendente',
        Observações: p.observacoes || '',
        'Comentários Avaliação': p.avaliacao?.comentario || '',
      };
    });

    const json2csvParser = new Parser({
      delimiter: ';',
    });
    return json2csvParser.parse(dadosFormatados);
  }

  private criarDataNoFuso(
    ano: number,
    mes: number,
    dia: number,
    hora: number,
    minuto: number,
    segundo: number,
    timezone: string,
  ): Date | null {
    if (
      !Number.isFinite(ano) ||
      !Number.isFinite(mes) ||
      !Number.isFinite(dia) ||
      !Number.isFinite(hora) ||
      !Number.isFinite(minuto) ||
      !Number.isFinite(segundo)
    ) {
      return null;
    }

    // Converte o horário local (fuso configurado) para um instante UTC persistível.
    const utcGuessMs = Date.UTC(ano, mes - 1, dia, hora, minuto, segundo);
    const instante = this.converterHorarioLocalParaUtc(utcGuessMs, timezone);

    return isNaN(instante.getTime()) ? null : instante;
  }

  private converterHorarioLocalParaUtc(
    utcGuessMs: number,
    timezone: string,
  ): Date {
    let utcMs = utcGuessMs;

    // Duas iterações estabilizam o cálculo caso exista transição de horário no dia.
    for (let i = 0; i < 2; i++) {
      const offsetMs = this.getOffsetDoFusoMs(new Date(utcMs), timezone);
      utcMs = utcGuessMs - offsetMs;
    }

    return new Date(utcMs);
  }

  private getOffsetDoFusoMs(date: Date, timezone: string): number {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const parts = formatter.formatToParts(date);
      const valores: Record<string, string> = {};

      for (const part of parts) {
        if (part.type !== 'literal') {
          valores[part.type] = part.value;
        }
      }

      const asUtcMs = Date.UTC(
        Number(valores.year),
        Number(valores.month) - 1,
        Number(valores.day),
        Number(valores.hour),
        Number(valores.minute),
        Number(valores.second),
      );

      return asUtcMs - date.getTime();
    } catch {
      this.logger.warn(
        `Timezone inválido (${timezone}) na importação. Usando UTC como fallback.`,
      );
      return 0;
    }
  }
}
