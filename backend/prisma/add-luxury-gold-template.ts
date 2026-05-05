import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TEMPLATE_NAME = 'Luxury Gold Wedding Template';
const DEFAULT_IMAGE =
  'https://pub-93085525881746c1a7b523e463cbfb35.r2.dev/1776941595513-img_2539-566x850.jpeg';

async function main() {
  const eventType =
    (await prisma.eventType.findFirst({ where: { slug: 'wedding' } })) ||
    (await prisma.eventType.findFirst());

  if (!eventType) {
    throw new Error('No event type found. Please create event type first.');
  }

  const existing = await prisma.template.findFirst({
    where: {
      eventTypeId: eventType.id,
      name: TEMPLATE_NAME,
    },
  });

  if (existing) {
    console.log(`Template already exists: ${existing.name} (${existing.id})`);
    return;
  }

  const created = await prisma.template.create({
    data: {
      name: TEMPLATE_NAME,
      eventTypeId: eventType.id,
      previewUrl: DEFAULT_IMAGE,
      thumbnail: DEFAULT_IMAGE,
      config: {
        theme: 'luxury-gold',
        colors: {
          primary: '#a16207',
          heading: '#a16207',
          text: '#854d0e',
        },
      },
    },
  });

  console.log(`Created template: ${created.name} (${created.id})`);
}

main()
  .catch((error) => {
    console.error('Failed to add luxury template:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
