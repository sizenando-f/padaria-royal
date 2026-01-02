import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { CreateProducaoDto } from './dto/create-producao.dto';
import { UpdateProducaoDto } from './dto/update-producao.dto';
import { PrismaService } from 'src/prisma/prisma.service';  // Importa o Prisma Service
import { ConfigService } from '@nestjs/config';
import axios from 'axios';


@Injectable()
export class ProducaoService {
  private readonly logger = new Logger(ProducaoService.name);

  // Fazemos a injeção
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ){}

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

  async getPrevisaoPorHorario(inicioIso: string, fimIso: string) {
    try {
      const apiKey = this.configService.get<string>('OPENWEATHER_API_KEY');
      // Mudar posteriormente para variável de ambiente
      const cidade = 'Rio Brilhante,BR';

      if(!apiKey) throw new Error('API Key não configurada');

      // Rota forecast que traz dados a cada 3 horas para os próximos 5 dias
      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;

      const response = await axios.get(url);
      const listaPrevisoes = response.data.list;

      // Converte as datas para segundos para comparar
      const targetInicio = new Date(inicioIso).getTime() / 1000;
      const targetFim = new Date(fimIso).getTime() / 1000;

      // Função para achar a previsão mais próxima da hora desejada
      const encontrarMaisProxima = (targetTime: number) => {
        // Reduz lista para achar qual tem a menor diferença
        return listaPrevisoes.reduce((prev, curr) => {
          return (Math.abs(curr.dt - targetTime) < Math.abs(prev.dt - targetTime) ? curr : prev);
        });
      };

      const previsaoInicio = encontrarMaisProxima(targetInicio);
      const previsaoFim = encontrarMaisProxima(targetFim);

      // Margem de erro
      const tresHorasEmSegundos = 3 * 60 * 60;

      const diffInicio = Math.abs(previsaoInicio.dt - targetInicio);

      if(diffInicio > tresHorasEmSegundos * 2){
        // Para caso a previsão estiver muito longe
        return {
          tempInicial: null,
          tempFinal: null,
          aviso: "Data fora do alcance de previsão (Passado ou +5 dias)"
        };
      }

      return {
        tempInicial: Math.round(previsaoInicio.main.temp),
        tempFinal: Math.round(previsaoFim.main.temp),
        climaDescricao: previsaoInicio.weather[0].description
      }
    } catch (error) {
      this.logger.error(`Erro ao buscar previsão: ${error.message}`);
      return null;
    }
  }

  async calcularSugestao(farinhaInput: number, tempAtual?: number, tempFinal?: number){
    // Para pegar todas as prodoções de sucesso com as duas temperaturas
   const historico = await this.prisma.producao.findMany({
    where: {
      avaliacao: {status: 'EXCELENTE'}, // Só o melhor
      tempAmbienteInicial: {not: null}, // Com temperatura inicial
      tempAmbienteFinal: {not: null},   // Com temperatura final
      farinhaKg: {gt: 0}
    },
    select: {
      id: true,
      farinhaKg: true,
      fermentoGrama: true,
      emulsificanteMl: true,
      tempAmbienteInicial: true,
      tempAmbienteFinal: true
    }
   });

   if(historico.length === 0){
    return {
      fermento: 0,
      mensagem: 'Sem dados históricos excelentes com temperatura para calcular.',
      provas: []
    };
   }

   // VERIFICAR
   let selecionados: any[] = [];

   // Cálculo com pesos
   if (tempAtual) {
    // Calcula a distância de cada registro para o cenário atual
    const comDistancia = historico.map(p => {
      const tIni = Number(p.tempAmbienteInicial);
      const tFim = p.tempAmbienteFinal ? Number(p.tempAmbienteFinal) : tIni;  // Usa a inicial como fallback
    
      // Distância Euclidiana simplificada: |Delta Inicial| + |Delta Final|
      const diffIni = Math.abs(tIni - tempAtual);
      const diffFim = tempFinal ? Math.abs(tFim - tempFinal) : 0;

      const distanciaTotal = diffIni + diffFim;

      // O peso é o inverso da distância, quanto menor a distância, maior o peso 
      const peso = 1 / (distanciaTotal + 0.1); // Adiciona +1 pra evitar divisão por 0 caso a temperatura for idêntica

      return {
        ...p,
        distancia: distanciaTotal,
        peso
      };
    });

    // Ordena pelos mais próximos
    comDistancia.sort((a, b) => a.distancia - b.distancia);

    // Pega os top 20 mais parecidos
    selecionados = comDistancia.slice(0, 20);
   } else {
      // Peso igual pra todos como fallback
      selecionados = historico.slice(-20).map(p => ({
        ...p,
        peso: 1
      }));
   }

   // Média ponderada
   let somaPonderada = 0;
   let somaPesos = 0;

   for (const item of selecionados) {
    const farinha = Number(item.farinhaKg);
    const fermento = Number(item.fermentoGrama);
    
    // Se o peso é alto, essa proporção possui mais importância
    if(farinha > 0){
      const proporcao = fermento / farinha;
      somaPonderada += (proporcao * item.peso);
      somaPesos += item.peso;
    }
   }

   const mediaProporcao = somaPesos > 0 ? somaPonderada / somaPesos : 0;
   const fermentoSugerido = Math.round(mediaProporcao * farinhaInput);

   return {
    fermento:  fermentoSugerido,
    mensagem: `Cálculo realizado com base nas ${selecionados.length} fornadas mais similares encontradas.`,
    // Retorna completo para a prova
    provas: selecionados.map(s => ({
      id: s.id,
      tIni: Number(s.tempAmbienteInicial),
      tFim: s.tempAmbienteFinal ? Number(s.tempAmbienteFinal) : null,
      farinha: Number(s.farinhaKg),
      fermento: Number(s.fermentoGrama),
      emulsificante: Number(s.emulsificanteMl)
    }))
   }
  };
}
