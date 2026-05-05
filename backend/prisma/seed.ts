import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEFAULT_WEDDING_TEMPLATE_IMAGE =
  'https://pub-93085525881746c1a7b523e463cbfb35.r2.dev/1776941595513-img_2539-566x850.jpeg';
const FLORAL_ROSE_TEMPLATE_IMAGE =
  'https://pub-93085525881746c1a7b523e463cbfb35.r2.dev/1777401615682-432012146_797776719062432_7949193257349104001_n.jpg';

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

  const classicTemplate = await prisma.template.create({
    data: {
      name: 'Classic Wedding Template',
      eventTypeId: eventType.id,
      previewUrl: DEFAULT_WEDDING_TEMPLATE_IMAGE,
      thumbnail: DEFAULT_WEDDING_TEMPLATE_IMAGE,
      config: {
        theme: 'classic',
        colors: {
          primary: '#d4af37',
          secondary: '#ffffff',
        },
      },
    },
  });

  const floralTemplate = await prisma.template.create({
    data: {
      name: 'Floral Rose Wedding Template',
      eventTypeId: eventType.id,
      previewUrl: FLORAL_ROSE_TEMPLATE_IMAGE,
      thumbnail: FLORAL_ROSE_TEMPLATE_IMAGE,
      config: {
        theme: 'floral-rose',
        colors: {
          primary: '#9f1239',
          heading: '#9f1239',
          text: '#7a2141',
        },
      },
    },
  });

  console.log(`✅ Created template: ${classicTemplate.name}`);
  console.log(`✅ Created template: ${floralTemplate.name}`);

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
      templateId: classicTemplate.id,
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
