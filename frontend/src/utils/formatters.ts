export function formatarFarinha(kg: number) {
  const num = Number(kg) || 0;
  if (num >= 1000) {
    const t = num / 1000;
    const formatado = t.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
    return {
      valor: formatado,
      unidade: 'toneladas',
      legivel: `${formatado} t`,
    };
  }

  const formatado = num.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return {
    valor: formatado,
    unidade: 'kg',
    legivel: `${formatado} kg`,
  };
}

export function formatarFermento(gramas: number) {
  const num = Number(gramas) || 0;
  if (num >= 1_000_000) {
    const t = num / 1_000_000;
    const formatado = t.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
    return {
      valor: formatado,
      unidade: 'toneladas',
      legivel: `${formatado} t`,
    };
  }

  if (num >= 1000) {
    const kg = num / 1000;
    const formatado = kg.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
    return {
      valor: formatado,
      unidade: 'kg',
      legivel: `${formatado} kg`,
    };
  }

  const formatado = Math.round(num).toLocaleString('pt-BR');
  return {
    valor: formatado,
    unidade: 'g',
    legivel: `${formatado} g`,
  };
}

export function formatarEmulsificante(ml: number) {
  const num = Number(ml) || 0;
  if (num >= 1000) {
    const litros = num / 1000;
    const formatado = litros.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
    return {
      valor: formatado,
      unidade: 'Litros',
      legivel: `${formatado} L`,
    };
  }

  const formatado = Math.round(num).toLocaleString('pt-BR');
  return {
    valor: formatado,
    unidade: 'ml',
    legivel: `${formatado} ml`,
  };
}

export function formatarMinutos(minutos: number): string {
  const m = Math.round(Number(minutos) || 0);
  if (m < 60) return `${m} min`;
  const horas = Math.floor(m / 60);
  const resto = m % 60;
  return resto > 0 ? `${horas}h ${resto}min` : `${horas}h`;
}
