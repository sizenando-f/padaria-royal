import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('123456', 10);

  const gerente = await prisma.usuario.upsert({
    where: {
      email: 'gerente@royal.com',
    },
    update: {},
    create: {
      email: 'gerente@royal.com',
      nome: 'Gerente',
      senha: senhaHash,
      cargo: 'GERENTE',
    },
  });

  const padeiro = await prisma.usuario.upsert({
    where: {
      email: 'padeiro@royal.com',
    },
    update: {},
    create: {
      email: 'padeiro@royal.com',
      nome: 'Padeiro',
      senha: senhaHash,
      cargo: 'PADEIRO',
    },
  });

  console.log({ gerente, padeiro });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
