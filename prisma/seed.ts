import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@empresa.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@empresa.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // Create qualidade user
  const qualidadePassword = await bcrypt.hash('qualidade123', 10)
  const qualidade = await prisma.user.upsert({
    where: { email: 'qualidade@empresa.com' },
    update: {},
    create: {
      name: 'Equipe Qualidade',
      email: 'qualidade@empresa.com',
      password: qualidadePassword,
      role: 'QUALIDADE',
    },
  })

  // Create operacao user
  const operacaoPassword = await bcrypt.hash('operacao123', 10)
  await prisma.user.upsert({
    where: { email: 'operacao@empresa.com' },
    update: {},
    create: {
      name: 'Equipe Operação',
      email: 'operacao@empresa.com',
      password: operacaoPassword,
      role: 'OPERACAO',
    },
  })

  // Create email lists
  const qualidadeList = await prisma.emailList.upsert({
    where: { id: 'list-qualidade' },
    update: {},
    create: {
      id: 'list-qualidade',
      name: 'Qualidade',
      description: 'Equipe de qualidade',
      isActive: true,
      recipients: {
        create: [
          { email: 'qualidade@empresa.com', name: 'Equipe Qualidade' },
        ],
      },
    },
  })

  await prisma.emailList.upsert({
    where: { id: 'list-operacao' },
    update: {},
    create: {
      id: 'list-operacao',
      name: 'Operação',
      description: 'Equipe de operação',
      isActive: true,
      recipients: {
        create: [
          { email: 'operacao@empresa.com', name: 'Equipe Operação' },
        ],
      },
    },
  })

  await prisma.emailList.upsert({
    where: { id: 'list-supervisao' },
    update: {},
    create: {
      id: 'list-supervisao',
      name: 'Supervisão',
      description: 'Supervisores',
      isActive: true,
      recipients: {
        create: [
          { email: 'supervisao@empresa.com', name: 'Supervisão' },
        ],
      },
    },
  })

  // Create email templates
  await prisma.emailTemplate.upsert({
    where: { id: 'tmpl-conforme' },
    update: {},
    create: {
      id: 'tmpl-conforme',
      name: 'Recebimento Conforme',
      subject: 'Recebimento de veículo conforme — NF {{nota_fiscal}}',
      body: `Olá,

Segue em anexo o relatório de recebimento do veículo referente à NF {{nota_fiscal}} e ordem de recebimento {{ordem_recebimento}}.

Status geral: {{status_geral}}

Placa: {{placa}}
Código do produto: {{codigo_produto}}
Lote: {{lote}}
Data do recebimento: {{data_recebimento}}

Atenciosamente,
Equipe da Qualidade`,
      isActive: true,
    },
  })

  await prisma.emailTemplate.upsert({
    where: { id: 'tmpl-nao-conforme' },
    update: {},
    create: {
      id: 'tmpl-nao-conforme',
      name: 'Recebimento com Não Conformidade',
      subject: 'Não conformidade no recebimento — NF {{nota_fiscal}}',
      body: `Olá,

Segue em anexo o relatório de recebimento do veículo referente à NF {{nota_fiscal}} e ordem de recebimento {{ordem_recebimento}}.

Foi identificada não conformidade durante o recebimento.

Placa: {{placa}}
Código do produto: {{codigo_produto}}
Lote: {{lote}}
Não conformidade: {{resumo_nao_conformidade}}
Data do recebimento: {{data_recebimento}}

Solicitamos avaliação e tratativa conforme procedimento interno.

Atenciosamente,
Equipe da Qualidade`,
      isActive: true,
    },
  })

  await prisma.emailTemplate.upsert({
    where: { id: 'tmpl-reenvio' },
    update: {},
    create: {
      id: 'tmpl-reenvio',
      name: 'Reenvio de Relatório',
      subject: 'Reenvio de relatório de recebimento — NF {{nota_fiscal}}',
      body: `Olá,

Conforme solicitado, segue novamente em anexo o relatório de recebimento referente à NF {{nota_fiscal}}.

Ordem de recebimento: {{ordem_recebimento}}
Placa: {{placa}}
Código do produto: {{codigo_produto}}
Lote: {{lote}}
Status geral: {{status_geral}}

Atenciosamente,
Equipe da Qualidade`,
      isActive: true,
    },
  })

  console.log('Seed completed successfully!')
  console.log('Users created:')
  console.log('  Admin: admin@empresa.com / admin123')
  console.log('  Qualidade: qualidade@empresa.com / qualidade123')
  console.log('  Operação: operacao@empresa.com / operacao123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
