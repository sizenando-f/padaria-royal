import { IsInt, Min, Max, IsOptional, IsNotEmpty, IsString, isString, IsNumber } from "class-validator";

export class CreateAvaliacaoDto {
    @IsInt()
    @IsNotEmpty()
    producaoId: number;     // Para saber qual pão está sendo avaliado

    @IsInt()
    @Min(1)
    @Max(5)
    nota: number;   // Nota de 1 a 5 estrelas

    @IsOptional()
    @IsNumber()
    tempAmbienteFinalReal?: number;

    @IsString()
    @IsOptional()
    comentario?: string;
}
