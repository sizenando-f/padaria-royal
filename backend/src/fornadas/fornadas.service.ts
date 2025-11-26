import { Injectable } from '@nestjs/common';
import { CreateFornadaDto } from './dto/create-fornada.dto';
import { UpdateFornadaDto } from './dto/update-fornada.dto';
import { PrismaService } from 'src/prisma/prisma.service';  // Importa o Prisma

@Injectable()
export class FornadasService {
  // Injeção de dependência: O Nest entrega o prisma pronto para uso
  constructor(private prisma: PrismaService){}

  // Aqui é onde o dado é salvo no banco de dados
  async create(data: CreateFornadaDto) {
    return await this.prisma.fornada.create({
      data: data,   // O prisma consegue mapear os campos automaticamente 
    })
  }

  async findAll() {
    return await this.prisma.fornada.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} fornada`;
  }

  update(id: number, updateFornadaDto: UpdateFornadaDto) {
    return `This action updates a #${id} fornada`;
  }

  remove(id: number) {
    return `This action removes a #${id} fornada`;
  }
}
