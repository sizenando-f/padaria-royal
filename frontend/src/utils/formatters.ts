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

export function formatarPaes(unidades: number) {
  const num = Math.round(Number(unidades) || 0);
  if (num >= 1_000_000) {
    const mi = (num / 1_000_000).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
    return {
      valor: mi,
      unidade: 'milhões',
      legivel: `${mi} mi pães`,
    };
  }

  // Apenas abrevia com 'mil pães' se passar de 100 mil (ex: 435,4 mil pães no histórico geral)
  // Abaixo de 100 mil (ex: no filtro mensal), exibe a contagem exata com ponto de milhar (ex: 6.035 pães)
  if (num >= 100_000) {
    const mil = (num / 1_000).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return {
      valor: mil,
      unidade: 'mil pães',
      legivel: `${mil} mil pães`,
    };
  }

  const formatado = num.toLocaleString('pt-BR');
  return {
    valor: formatado,
    unidade: num === 1 ? 'pão' : 'pães',
    legivel: `${formatado} pães`,
  };
}

export function formatarMassa(kg: number) {
  const num = Number(kg) || 0;
  if (num >= 1000) {
    const t = (num / 1000).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
    return {
      valor: t,
      unidade: 'toneladas',
      legivel: `${t} t`,
    };
  }

  const formatado = num.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
  return {
    valor: formatado,
    unidade: 'kg',
    legivel: `${formatado} kg`,
  };
}
