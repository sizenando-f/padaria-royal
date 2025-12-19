import { IsInt, Min, Max, IsOptional, IsNotEmpty, IsString, isString } from "class-validator";

export class CreateAvaliacaoDto {
    @IsInt()
    @IsNotEmpty()
    producaoId: number;     // Para saber qual pão está sendo avaliado

    @IsInt()
    @Min(1)
    @Max(5)
    nota: number;   // Nota de 1 a 5 estrelas

    @IsString()
    @IsNotEmpty()
    status: string; // RUIM, REGULAR, BOM, EXCELENTE

    @IsString()
    @IsOptional()
    comentario?: string;
}
