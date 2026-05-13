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

  // Create default Config Lists
  const avaliadoresList = await prisma.configList.upsert({
    where: { name: 'AVALIADORES' },
    update: {},
    create: {
      name: 'AVALIADORES',
      description: 'Lista de avaliadores disponíveis no sistema',
      options: {
        create: [
          { label: 'CD CAMPO GRANDE', value: 'CD CAMPO GRANDE', order: 1 },
          { label: 'CD DOURADOS', value: 'CD DOURADOS', order: 2 },
          { label: 'CD CUIABÁ', value: 'CD CUIABÁ', order: 3 },
          { label: 'CD RONDONÓPOLIS', value: 'CD RONDONÓPOLIS', order: 4 },
          { label: 'CD RIO VERDE', value: 'CD RIO VERDE', order: 5 },
          { label: 'CD CORUMBÁ', value: 'CD CORUMBÁ', order: 6 },
        ]
      }
    }
  })

  // Create UNIDADES list
  const listNameUnidades = 'UNIDADES'
  await prisma.configList.upsert({
    where: { name: listNameUnidades },
    update: {},
    create: {
      name: listNameUnidades,
      description: 'Lista de unidades avaliadas (Ex: SIFs)',
    }
  })

  // Limpa e recria opções para garantir atualização
  const unidadesList = await prisma.configList.findUnique({ where: { name: listNameUnidades } })
  if (unidadesList) {
    await prisma.configListOption.deleteMany({ where: { configListId: unidadesList.id } })
    await prisma.configListOption.createMany({
      data: [
        { configListId: unidadesList.id, label: '03 - Campo Grande', value: '03 - Campo Grande', order: 1 },
        { configListId: unidadesList.id, label: '04 - Campo Grande', value: '04 - Campo Grande', order: 2 },
        { configListId: unidadesList.id, label: 'Alles', value: 'Alles', order: 3 },
        { configListId: unidadesList.id, label: 'Arrico', value: 'Arrico', order: 4 },
        { configListId: unidadesList.id, label: 'Bazu', value: 'Bazu', order: 5 },
        { configListId: unidadesList.id, label: 'Bio Pescados', value: 'Bio Pescados', order: 6 },
        { configListId: unidadesList.id, label: 'CD Campo Grande/MS', value: 'CD Campo Grande/MS', order: 7 },
        { configListId: unidadesList.id, label: 'CD Corumbá/MS', value: 'CD Corumbá/MS', order: 8 },
        { configListId: unidadesList.id, label: 'CD Cuiabá/MT', value: 'CD Cuiabá/MT', order: 9 },
        { configListId: unidadesList.id, label: 'CD Dourados/MS', value: 'CD Dourados/MS', order: 10 },
        { configListId: unidadesList.id, label: 'CD Rio Verde/GO', value: 'CD Rio Verde/GO', order: 11 },
        { configListId: unidadesList.id, label: 'CD Rondonópolis/MT', value: 'CD Rondonópolis/MT', order: 12 },
        { configListId: unidadesList.id, label: 'Coopavel', value: 'Coopavel', order: 13 },
        { configListId: unidadesList.id, label: 'CVale', value: 'CVale', order: 14 },
        { configListId: unidadesList.id, label: 'DFaves', value: 'DFaves', order: 15 },
        { configListId: unidadesList.id, label: 'Eldorado', value: 'Eldorado', order: 16 },
        { configListId: unidadesList.id, label: 'Famalac', value: 'Famalac', order: 17 },
        { configListId: unidadesList.id, label: 'Forno de Minas', value: 'Forno de Minas', order: 18 },
        { configListId: unidadesList.id, label: 'Grano', value: 'Grano', order: 19 },
        { configListId: unidadesList.id, label: 'Itaquiraí', value: 'Itaquiraí', order: 20 },
        { configListId: unidadesList.id, label: 'Mccain', value: 'Mccain', order: 21 },
        { configListId: unidadesList.id, label: 'Oyshi', value: 'Oyshi', order: 22 },
        { configListId: unidadesList.id, label: 'SIF 1289: Mais Frango - Miraguai/RS', value: 'SIF 1289: Mais Frango - Miraguai/RS', order: 23 },
        { configListId: unidadesList.id, label: 'SIF 2496: Comprimar Comercio de Pescado - Curuçá/PA', value: 'SIF 2496: Comprimar Comercio de Pescado - Curuçá/PA', order: 24 },
        { configListId: unidadesList.id, label: 'SIF 2575: Frango Santa Cecilia - Itapuí/SP', value: 'SIF 2575: Frango Santa Cecilia - Itapuí/SP', order: 25 },
        { configListId: unidadesList.id, label: 'SIF 2751: PGI - Laranjal Paulista', value: 'SIF 2751: PGI - Laranjal Paulista', order: 26 },
        { configListId: unidadesList.id, label: 'SIF 2985: Mar e Terra - Itaporã/MS', value: 'SIF 2985: Mar e Terra - Itaporã/MS', order: 27 },
        { configListId: unidadesList.id, label: 'SIF 34: Bello Alimentos Ltda - Eldorado/MS', value: 'SIF 34: Bello Alimentos Ltda - Eldorado/MS', order: 28 },
        { configListId: unidadesList.id, label: 'SIF 3772: Bello Alimentos Ltda - Aparecida do Taboado/MS', value: 'SIF 3772: Bello Alimentos Ltda - Aparecida do Taboado/MS', order: 29 },
        { configListId: unidadesList.id, label: 'SIF 4199: Geneseas Aquacultura - Aparecida do Taboado/MS', value: 'SIF 4199: Geneseas Aquacultura - Aparecida do Taboado/MS', order: 30 },
        { configListId: unidadesList.id, label: 'SIF 5027: Levo Alimentos Ltda - Umuarama/PR', value: 'SIF 5027: Levo Alimentos Ltda - Umuarama/PR', order: 31 },
        { configListId: unidadesList.id, label: 'SIF 5339: Levo Alimentos Ltda - Iporã/PR', value: 'SIF 5339: Levo Alimentos Ltda - Iporã/PR', order: 32 },
        { configListId: unidadesList.id, label: 'SISB 0674-C: Bello Bolsa Nova', value: 'SISB 0674-C: Bello Bolsa Nova', order: 33 },
        { configListId: unidadesList.id, label: 'Superfrio', value: 'Superfrio', order: 34 },
        { configListId: unidadesList.id, label: 'Taboado', value: 'Taboado', order: 35 },
        { configListId: unidadesList.id, label: 'Tradição Minas', value: 'Tradição Minas', order: 36 },
        { configListId: unidadesList.id, label: 'Zinho', value: 'Zinho', order: 37 },
      ]
    })
  }

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
