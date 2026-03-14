import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "src/prisma/prisma.service";
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { Parser } from "json2csv";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class BackupService {
    private readonly logger = new Logger(BackupService.name);
    
    private lastBackupDate: string = '';    // Para salvar a data do último backup
    private isProcessing: boolean = false; // Trava o email duplo

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService
    ){}

    @Cron('0 30 10 * * *', { timeZone: 'America/Campo_Grande'})    // Para rodar todos os dias as 18:00
    async verificarEExecutarBackup() {
        this.logger.log(`Cron disparado! Hora atual: ${new Date().toLocaleString('pt-BR')}`)

        const hoje = new Date().toLocaleDateString('pt-BR');

        // Verifica se já fez backup hoje
        if(this.lastBackupDate === hoje || this.isProcessing) {
            return; // Sai da função
        }

        this.isProcessing = true;   // Ativa a trava
        this.logger.log('Iniciando rotina de Backup diário...');

        try {
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
                this.logger.log('Sem dadoss para backup.');
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
                    // Esses cabeçalhos iguais aos que o 'importarDados'
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
            const oauth2Client = new google.auth.OAuth2(
                this.configService.get('GMAIL_CLIENT_ID'),
                this.configService.get('GMAIL_CLIENT_SECRET'),
                'https://developers.google.com/oauthplayground',
            );

            oauth2Client.setCredentials({
                refresh_token: this.configService.get('GMAIL_REFRESH_TOKEN'),
            });

            const accessToken = await oauth2Client.getAccessToken();

            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    type: 'OAuth2',
                    user: 'black.wingsss.ofc@gmail.com',
                    clientId: this.configService.get<string>('GMAIL_CLIENT_ID'),
                    clientSecret: this.configService.get<string>('GMAIL_CLIENT_SECRET'),
                    refreshToken: this.configService.get<string>('GMAIL_REFRESH_TOKEN'),
                    accessToken: accessToken?.token ?? undefined,
                },
            }); 

            await transporter.sendMail({
                from: '"Padaria Royal" <black.wingsss.ofc@gmail.com>',
                to: emailDestino,
                subject: `Backup Diário - ${hoje} - Padaria Royal`,
                text: `Olá gerente, \n\nSegue em anexo o backup completo dos dados do sistema referente ao dia ${hoje}.\n\nGuarde este arquivo em segurança. Pode ser usado para restaurar dados via importação.`,
                attachments: [
                    {
                        filename: `backup-royal-${hoje.replace(/\//g, '-')}.csv`,
                        content: csvContent,
                        contentType: 'text/csv',
                    },
                ],
            });

            // Marca como feito
            this.lastBackupDate = hoje;
            this.logger.log(`Backup enviado com sucesso para ${emailDestino}`);
        } catch (error) {
            this.logger.error('Falha ao enviar backup:', error);
        } finally {
            // Libera a trava
            this.isProcessing = false;
        }
    }
}