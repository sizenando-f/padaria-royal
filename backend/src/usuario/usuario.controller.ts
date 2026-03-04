import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UnauthorizedException, UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/auth/auth.guard";
import { UsuarioService } from "./usuario.service";

@UseGuards(AuthGuard)
@Controller('usuario')
export class UsuarioController {
    constructor(
        private readonly usuarioService: UsuarioService
    ) {}

    @Get()
    findAll(@Request() req){
        // Apenas gerentes podem ver a lista de funcionários
        if(req.user.cargo !== "GERENTE"){
            throw new UnauthorizedException("Acesso restrito a gerentes.");
        }

        return this.usuarioService.findAll();
    }

    @Post()
    create(@Body() createUsuarioDto: any, @Request() req){
        if(req.user.cargo !== "GERENTE"){
            throw new UnauthorizedException("Acesso restrito a gerentes.");
        }

        return this.usuarioService.create(createUsuarioDto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateData: any, @Request() req){
        if(req.user.cargo !== 'GERENTE'){
            throw new UnauthorizedException('Acesso restrito a gerentes.');
        }

        return this.usuarioService.update(+id, updateData);
    }

    @Delete(":id")
    remove(@Param('id') id: string, @Request() req){
        if(req.user.cargo !== "GERENTE"){
            throw new UnauthorizedException("Acesso restrito a gerentes.");
        }

        // Gerente não pode apagar a si mesmo
        if(Number(id) === req.user.sub){
            throw new UnauthorizedException("Você não pode excluir sua própria conta.");
        }

        return this.usuarioService.remove(+id);
    }
}