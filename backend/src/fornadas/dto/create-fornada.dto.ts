export class CreateFornadaDto {
    tempInicial: number;
    tempFinalPrevista: number;
    tempoFermentacao: number;   // Em minutos
    farinhaKg: number;
    emulsificanteMl: number;
    fermentoGrama: number;
    observacoes?: string;
}
