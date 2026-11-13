import { KycTier, PrismaClient, Role, TaxRuleKind } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AnnexEvoice development data…');

  const hashedPassword = await bcrypt.hash('devpass123', 10);

  const owner = await prisma.user.upsert({
    where: { phone: '+2348012345001' },
    create: { phone: '+2348012345001', email: 'owner@acme.test', hashedPassword },
    update: {},
  });

  const accountant = await prisma.user.upsert({
    where: { email: 'accountant@firm.test' },
    create: { email: 'accountant@firm.test', hashedPassword },
    update: {},
  });

  const tenantA = await prisma.tenant.upsert({
    where: { tin: 'TIN-000-0001' },
    create: {
      legalName: 'Acme Supplies Nigeria Ltd',
      tradingName: 'Acme Supplies',
      tin: 'TIN-000-0001',
      rcNumber: 'RC1234567',
      phone: '+2348012345001',
      email: 'hello@acme.test',
      address: '12 Marina, Lagos Island, Lagos',
      kycTier: KycTier.TIER_1,
      memberships: { create: [{ userId: owner.id, role: Role.OWNER }, { userId: accountant.id, role: Role.ACCOUNTANT }] },
    },
    update: {},
  });

  const tenantB = await prisma.tenant.upsert({
    where: { tin: 'TIN-000-0002' },
    create: {
      legalName: 'Baobab Services Ltd',
      tradingName: 'Baobab',
      tin: 'TIN-000-0002',
      rcNumber: 'RC7654321',
      phone: '+2348098765432',
      email: 'kola@baobab.test',
      address: '7 Allen Ave, Ikeja, Lagos',
      kycTier: KycTier.TIER_0,
      memberships: { create: [{ userId: accountant.id, role: Role.ACCOUNTANT }] },
    },
    update: {},
  });

  for (const tenantId of [tenantA.id, tenantB.id]) {
    await prisma.invoiceSequence.upsert({
      where: { tenantId },
      create: { tenantId, nextNumber: 1n },
      update: {},
    });

    const vat = await prisma.taxRule.upsert({
      where: { id: `${tenantId}-vat` },
      update: {},
      create: {
        id: `${tenantId}-vat`.replace(/[^0-9a-f-]/gi, '').slice(0, 36),
        tenantId,
        kind: TaxRuleKind.VAT,
        name: 'VAT 7.5%',
        rateBps: 750,
        effectiveFrom: new Date('2020-02-01'),
      },
    }).catch(async () => {
      return prisma.taxRule.create({
        data: {
          tenantId,
          kind: TaxRuleKind.VAT,
          name: 'VAT 7.5%',
          rateBps: 750,
          effectiveFrom: new Date('2020-02-01'),
        },
      });
    });

    await prisma.taxRule.create({
      data: {
        tenantId,
        kind: TaxRuleKind.WHT,
        name: 'WHT 5% (services)',
        rateBps: 500,
        effectiveFrom: new Date('2020-01-01'),
      },
    });

    await prisma.taxRule.create({
      data: {
        tenantId,
        kind: TaxRuleKind.EXEMPT,
        name: 'VAT Exempt',
        rateBps: 0,
        effectiveFrom: new Date('2020-02-01'),
      },
    });

    await prisma.tenant.update({ where: { id: tenantId }, data: { defaultVatRuleId: vat.id } });

    await prisma.customer.createMany({
      data: [
        { tenantId, name: 'Chidi Okafor', phone: '+2348023456789', email: 'chidi@example.ng', address: '12 Awolowo Rd, Ikoyi' },
        { tenantId, name: 'Aisha Bello', phone: '+2348067891234', email: 'aisha@example.ng' },
        { tenantId, name: 'Oluwaseun Adebayo', email: 'seun@buyer.ng' },
      ],
    });

    await prisma.product.createMany({
      data: [
        { tenantId, name: 'Bag of Cement (50kg)', sku: 'CEM-50', unitPriceKobo: 950_000n, taxRuleId: vat.id },
        { tenantId, name: 'Consulting hour', sku: 'SVC-HR', unitPriceKobo: 50_000_00n, taxRuleId: vat.id },
      ],
    });
  }

  console.log('Seed complete.');
  console.log('Login: phone +2348012345001 password devpass123 (OWNER of Acme)');
  console.log('       email accountant@firm.test password devpass123 (ACCOUNTANT on both tenants)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
