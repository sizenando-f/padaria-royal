import { Injectable, BadRequestException, Logger } from '@nestjs/common';
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

        // Para saber quem fez
        criadoPorId: usuarioId || null,
      },
    });
  }

  async findAll() {
    return await this.prisma.producao.findMany({
      include: {
        avaliacao: true, // Para trazer a avaliação junto
      },
      orderBy: {
        id: 'desc', // Mostra do mais recente ao mais antigo
      },
    });
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

  async update(id: number, data: UpdateProducaoDto) {
    return await this.prisma.producao.update({
      where: { id },
      data: data,
    });
  }

  async remove(id: number) {
    // Verifica se existe
    const existe = await this.prisma.producao.findUnique({ where: { id } });
    if (!existe) {
      throw new Error('Produção não encontrada');
    }

    // Apaga de vez
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

    return await this.prisma.producao.findMany({
      where,
      include: { avaliacao: true },
      orderBy: { id: 'desc' }
    });
  }

  async getPrevisaoPorHorario(inicioIso: string, fimIso: string) {
    try {
      const lat = this.configService.get<string>('CIDADE_LAT');
      const lon = this.configService.get<string>('CIDADE_LON');

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&timezone=auto&forecast_days=3&timeformat=unixtime`;

      this.logger.log(`Buscando clima (Auto) em: ${url}`);

      const response = await axios.get(url);

      const times: number[] = response.data.hourly.time;
      const temps: number[] = response.data.hourly.temperature_2m;

      const targetInicioSeconds = Math.floor(
        new Date(inicioIso).getTime() / 1000,
      );
      const targetFimSeconds = Math.floor(new Date(fimIso).getTime() / 1000);

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
      return null;
    }
  }

  async calcularSugestao(
    farinhaInput: number,
    tempAtual?: number,
    tempFinal?: number,
    minutosAlvo?: number,
  ) {
    // Para pegar todas as prodoções de sucesso com as duas temperaturas
    const historico = await this.prisma.producao.findMany({
      where: {
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
      mensagem: `IA analisou ${selecionados.length} fornadas similares (considerando Clima e Tempo de Fermentação).`,
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
    const bufferString = buffer.toString('utf-8');

    const stream = Readable.from(bufferString);

    const parser = stream.pipe(
      parse({
        delimiter: ';',
        columns: true, // Usa a primeira linha como cabeçalho
        trim: true, // Remove espaços em branco
        bom: true, // Remove caracteres invisíveis do Excel
        relax_column_count: true, // Ignora erros de colunas vazias no final
        skip_empty_lines: true,
      }),
    );

    let importados = 0;
    let erros = 0;

    const normalizeKey = (obj: any, keyPart: string) => {
      const key = Object.keys(obj).find((k) =>
        k.toLowerCase().includes(keyPart.toLowerCase()),
      );
      return key ? obj[key] : null;
    };

    for await (const row of parser) {
      try {
        // Pegando dados de forma segura
        const rawData = row['Data/Hora'] || row['data/hora'];
        if (!rawData) continue;

        const tempIni = normalizeKey(row, 'inicial');
        const tempFimPrev = normalizeKey(row, 'final prevista');
        const tempFimReal = normalizeKey(row, 'final real');

        // Ingredientes
        const farinhaStr = normalizeKey(row, 'quilos farinha');
        const fermentoStr = normalizeKey(row, 'gramas fermento');
        const emulsifStr = normalizeKey(row, 'ml emulsificante');
        const qualidadeStr = normalizeKey(row, 'qualidade');

        // Conversões

        // Converte a data para ISO
        const [dataPart, horaPart] = rawData.split(' ');
        if (!dataPart || !horaPart) continue;

        const [dia, mes, ano] = dataPart.split('/');

        // Data ISO para o bd
        const dataISO = `${ano}-${mes}-${dia}T${horaPart}:00.000Z`;

        // Mapear a nota
        const mapNota: Record<string, number> = {
          excelente: 5,
          bom: 4,
          razoavel: 3,
          regular: 3,
          ruim: 2,
          pessimo: 1,
          péssimo: 1,
        };

        const notaStr = qualidadeStr
          ? qualidadeStr.toLowerCase().trim()
          : 'bom';
        const nota = mapNota[notaStr] || 4;

        // Converte trocando virgula por ponto
        const parseNum = (val: string) =>
          val ? parseFloat(val.replace(',', '.').trim()) : 0;
        const fermento = parseNum(fermentoStr);
        const farinha = parseNum(farinhaStr);

        // Pula pra evitar sujeira
        if (farinha <= 0) continue;

        // Calcula o tempo
        const tempoHorasStr = normalizeKey(row, 'tempo ferment');
        const minutos = tempoHorasStr
          ? Math.round(parseNum(tempoHorasStr) * 60)
          : 0;

        const obs = normalizeKey(row, 'observa');
        const coment = normalizeKey(row, 'coment');

        // Insere no banco
        await this.prisma.producao.create({
          data: {
            dataProducao: `${ano}-${mes}-${dia}T00:00:00.000Z`,
            horaInicio: dataISO,
            // Calcula hora fim baseado no tempo de fermentação
            horaFim: new Date(
              new Date(dataISO).getTime() + minutos * 60000,
            ).toISOString(),
            tempoFermentacaoMinutos: minutos,
            farinhaKg: farinha,
            fermentoGrama: fermento,
            emulsificanteMl: parseNum(emulsifStr),
            tempAmbienteInicial: parseNum(tempIni),
            tempAmbienteFinal: parseNum(tempFimPrev),
            observacoes: obs || null,
            avaliacao: {
              create: {
                nota: nota,
                tempAmbienteFinalReal: tempFimReal
                  ? parseNum(tempFimReal)
                  : null,
                comentario: coment || null,
              },
            },
          },
        });

        importados++;
      } catch (error) {
        console.error(
          `Erro ao importar linha ${importados + erros + 1}`,
          error.message,
        );
        erros++;
      }
    }
    return {
      mensagem: `Processamento finalizado. Importados: ${importados}. Erros/Ignorados: ${erros}`,
    };
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
}
