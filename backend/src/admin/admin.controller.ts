import { Body, Controller, Get, Patch, Request, UnauthorizedException, UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/auth/auth.guard";
import { AdminService } from "./admin.service";

@UseGuards(AuthGuard)
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    private verificarGerente(req: any){
        if(req.user.cargo !== 'GERENTE') throw new UnauthorizedException('Acesso restrito.');
    }

    @Get('logs')
    getLogs(@Request() req){
        this.verificarGerente(req);
        return this.adminService.getLogsExclusao();
    }

    @Get('config/email')
    getEmail(@Request() req){
        this.verificarGerente(req);
        return this.adminService.getEmailBackup();
    }

    @Patch('config/email')
    updateEmail(@Body() body: { email: string}, @Request() req){
        this.verificarGerente(req);
        return this.adminService.updateEmailBackup(body.email);
    }
}