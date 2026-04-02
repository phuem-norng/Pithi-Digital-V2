import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.guest.deleteMany();
  await prisma.event.deleteMany();
  await prisma.template.deleteMany();
  await prisma.eventType.deleteMany();
  await prisma.user.deleteMany();

  // Create a test user
  const defaultPassword = 'Pithi@123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  const user = await prisma.user.create({
    data: {
      email: 'test@pithidigital.com',
      name: 'Test User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Created user: ${user.email} (password: ${defaultPassword})`);

  const eventType = await prisma.eventType.create({
    data: {
      name: 'Wedding',
      slug: 'wedding',
      description: 'Wedding ceremonies and receptions',
    },
  });

  const template = await prisma.template.create({
    data: {
      name: 'Classic Wedding Template',
      eventTypeId: eventType.id,
      config: {
        theme: 'classic',
        colors: {
          primary: '#d4af37',
          secondary: '#ffffff',
        },
      },
    },
  });

  console.log(`✅ Created template: ${template.name}`);

  // Create a test event
  const event = await prisma.event.create({
    data: {
      title: 'Wedding Celebration',
      type: 'WEDDING',
      date: new Date('2026-06-15'),
      location: 'Phnom Penh, Cambodia',
      description: 'A beautiful wedding celebration',
      userId: user.id,
      eventTypeId: eventType.id,
      templateId: template.id,
    },
  });

  console.log(`✅ Created event: ${event.title}`);

  // Create test guests
  const guests = await Promise.all([
    prisma.guest.create({
      data: {
        name: 'Guest One',
        email: 'guest1@example.com',
        phone: '+855987654321',
        status: 'PENDING',
        eventId: event.id,
      },
    }),
    prisma.guest.create({
      data: {
        name: 'Guest Two',
        email: 'guest2@example.com',
        phone: '+855987654322',
        status: 'PENDING',
        eventId: event.id,
      },
    }),
  ]);

  console.log(`✅ Created ${guests.length} guests`);

  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
