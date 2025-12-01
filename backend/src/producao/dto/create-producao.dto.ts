import { isNotEmpty, IsNumber, IsString, IsDateString, IsOptional, Min, IsNotEmpty, IsDate, min } from "class-validator";

export class CreateProducaoDto {
    // Valida se é uma string de data ISO 8601 (ex: "2025-11-27T14:00:00Z")
    @IsNotEmpty({message: "A hora de início é obrigatória"})
    @IsDateString()
    horaInicio: string;

    @IsNotEmpty({message: "A hora prevista do forno é obrigatória"})
    @IsDateString()
    horaFim: string;

    @IsNumber()
    @Min(0.1, {message: "A quantidade de farinha deve ser maior que zero"})
    farinhaKg: number;

    @IsNumber()
    @Min(0)
    emulsificanteMl: number;

    @IsNumber()
    @Min(0)
    fermentoGrama: number;

    // Opcionais (Já que virão de uma API de clima)
    @IsOptional()
    @IsNumber()
    tempAmbienteInicial?: number;

    @IsOptional()
    @IsNumber()
    tempAmbienteFinal?: number;

    @IsOptional()
    @IsString()
    observacoes?: string;
}
