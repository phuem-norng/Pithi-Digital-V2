import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TEMPLATE_NAME = 'Floral Rose Wedding Template';
const FLORAL_ROSE_IMAGE =
  'https://pub-93085525881746c1a7b523e463cbfb35.r2.dev/1777401615682-432012146_797776719062432_7949193257349104001_n.jpg';

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
    const updated = await prisma.template.update({
      where: { id: existing.id },
      data: {
        previewUrl: FLORAL_ROSE_IMAGE,
        thumbnail: FLORAL_ROSE_IMAGE,
      },
    });
    console.log(`Updated template image: ${updated.name} (${updated.id})`);
    return;
  }

  const created = await prisma.template.create({
    data: {
      name: TEMPLATE_NAME,
      eventTypeId: eventType.id,
      previewUrl: FLORAL_ROSE_IMAGE,
      thumbnail: FLORAL_ROSE_IMAGE,
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

  console.log(`Created template: ${created.name} (${created.id})`);
}

main()
  .catch((error) => {
    console.error('Failed to add floral template:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
