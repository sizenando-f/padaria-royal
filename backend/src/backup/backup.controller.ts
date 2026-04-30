import { Controller, Post, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { BackupService } from './backup.service';

@Controller('backup')
export class BackupController {
  private readonly logger = new Logger(BackupController.name);
  constructor(private backupService: BackupService) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  async runManual() {
    this.logger.log('Recebido pedido manual de backup.');
    try {
      await this.backupService.triggerBackupManual();
      return { message: 'Backup trigger executed' };
    } catch (error) {
      this.logger.error('Erro ao executar backup manual:', error);
      return { message: 'Backup failed', error: String(error) };
    }
  }
}
