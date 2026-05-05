import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "src/prisma/prisma.service";
import { Parser } from "json2csv";
import { Cron } from "@nestjs/schedule";
import { Resend } from 'resend'

@Injectable()
export class BackupService {
    private readonly logger = new Logger(BackupService.name);
    
    private lastBackupDate: string = '';    // Para salvar a data do último backup
    private isProcessing: boolean = false; // Trava o email duplo

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService
    ){}

    @Cron('0 0 19 * * *', { timeZone: 'America/Campo_Grande'})    // Para rodar todos os dias as 18:00
    async verificarEExecutarBackup() {
        this.logger.log('Iniciando rotina de Backup diário...');

        try {
            await this.executeBackupWithRetries(false);
        } catch (err) {
            this.logger.error('Backup final falhou após tentativas:', err);
        }
    }

    // Método público para disparo manual via controller
    async triggerBackupManual() {
        return this.executeBackupWithRetries(true);
    }

    // Envolve a execução com retry + exponential backoff
    private async executeBackupWithRetries(ignoreDate = false) {
        const hoje = new Date().toLocaleDateString('pt-BR');

        if (!ignoreDate && this.lastBackupDate === hoje) {
            this.logger.log('Backup já realizado hoje, pulando execução.');
            return;
        }

        if (this.isProcessing) {
            this.logger.log('Outra execução de backup está em andamento, pulando.');
            return;
        }

        this.isProcessing = true;
        this.logger.log(`Iniciando rotina de Backup (manual=${ignoreDate})...`);

        try {
            const maxAttempts = 5;
            let attempt = 0;
            let delayMs = 2000; // Começar com 2s em vez de 1s

            while (attempt < maxAttempts) {
                attempt++;
                const timestamp = new Date().toISOString();
                try {
                    this.logger.log(`[${timestamp}] Tentativa ${attempt} de ${maxAttempts} para gerar/enviar backup.`);
                    await this.runBackup();
                    this.lastBackupDate = hoje;
                    this.logger.log(`[${timestamp}] Backup enviado com sucesso (tentativa ${attempt}).`);
                    break;
                } catch (error: any) {
                    const code = error?.code || error?.message || 'unknown';
                    this.logger.error(`[${timestamp}] Falha na tentativa ${attempt}: ${code}`);
                    this.logger.debug(`[${timestamp}] Detalhes do erro da tentativa ${attempt}: ${JSON.stringify(error)}`);

                    if (attempt >= maxAttempts) {
                        this.logger.error(`[${timestamp}] Todas as ${maxAttempts} tentativas de backup falharam.`);
                        throw error;
                    }

                    this.logger.log(`[${timestamp}] Aguardando ${delayMs}ms antes da tentativa ${attempt + 1}...`);
                    await new Promise((r) => setTimeout(r, delayMs));
                    delayMs *= 2;
                }
            }
        } finally {
            this.isProcessing = false;
        }
    }

    // Lógica única que realiza a coleta, formatação e envio do backup
    private async runBackup() {
        // Coleta todos os dados
        const dados = await this.prisma.producao.findMany({
            include: {
                avaliacao: true
            },
            orderBy: {
                id: 'desc'
            }
        });

        if(dados.length === 0){
            this.logger.log('Sem dados para backup.');
            return;
        }

        // Formata para CSV compatível
        const dadosFormatados = dados.map((p) => {
            const notaLabels: any = {
                5: 'excelente',
                4: 'bom',
                3: 'regular',
                2: 'ruim',
                1: 'pessimo'
            };

            return {
                'Fornada': `#${p.id}`,
                'Data/Hora': new Date(p.horaInicio).toLocaleString('pt-BR'),
                'Temperatura Inicial (°C)': p.tempAmbienteInicial,
                'Temperatura Final Prevista (°C)': p.tempAmbienteFinal,
                'Temperatura Final Real (°C)': p.avaliacao?.tempAmbienteFinalReal || '',
                'Tempo Fermentação (h)': (p.tempoFermentacaoMinutos / 60).toFixed(1).replace('.', ','),
                'Quilos Farinha': Number(p.farinhaKg).toFixed(1).replace('.', ','),
                'ML Emulsificante': p.emulsificanteMl,
                'Gramas Fermento': p.fermentoGrama,
                'Qualidade': p.avaliacao ? notaLabels[p.avaliacao.nota] : 'pendente',
                'Observações': p.observacoes || '',
                'Comentários Avaliação': p.avaliacao?.comentario || '',
            };
        });

        const json2csvParser = new Parser({ delimiter: ';' });
        const csvContent = json2csvParser.parse(dadosFormatados);

        // Busca email no banco de dados
        const configBanco = await this.prisma.configuracao.findUnique({
            where: {
                chave: 'EMAIL_BACKUP'
            }
        });

        // Pega do .env se não tiver
        const emailDestino = configBanco ? configBanco.valor : this.configService.get('EMAIL_DESTINO');

        // Configura o envio de email
        const resend = new Resend(this.configService.get('RESEND_API_KEY'));

        const hoje = new Date().toLocaleDateString('pt-BR');

        const { data, error } = await resend.emails.send({
            from: 'Padaria Royal <onboarding@resend.dev>',
            to: emailDestino,
            subject: `Backup Diário - ${hoje} - Padaria Royal`,
            text: `Olá gerente, \n\nSegue em anexo o backup completo dos dados do sistema referente ao dia ${hoje}.\n\nGuarde este arquivo em segurança. Pode ser usado para restaurar dados via importação.`,
            attachments: [
                {
                    filename: `backup-royal-${hoje.replace(/\//g, '-')}.csv`,
                    content: Buffer.from(csvContent, 'utf-8'),
                },
            ],
        });

        if (error) {
            this.logger.error(`Erro da API do Resend: ${error.message}`);
            throw error;
        }

            this.logger.log(`Backup enviado com sucesso para ${emailDestino} (ID: ${data?.id})`);
            }
}
