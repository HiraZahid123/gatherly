
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'hassanjamal9986@gmail.com';
  
  // 1. Upsert User
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: 'Hassan Jamal (Tester)',
      phone: '1234567890', // Dummy phone
    },
    create: {
      email,
      name: 'Hassan Jamal (Tester)',
      phone: '1234567890',
      role: 'GUEST',
    }
  });
  console.log('User Upserted:', user.id);

  // 2. Get latest event
  const latestEvent = await prisma.event.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!latestEvent) {
    console.log('No events found to associate RSVP with.');
    return;
  }

  // 3. Create dummy RSVPs (e.g., 5 dummy RSVPs to show activity)
  const dummyNames = ['Alex Smith', 'Jordan Doe', 'Taylor Swift', 'Casey Jones', 'Morgan Freeman'];
  
  for (let i = 0; i < dummyNames.length; i++) {
     const dummyEmail = `dummy${i}@example.com`;
     await prisma.rSVP.upsert({
       where: { eventId_guestEmail: { eventId: latestEvent.id, guestEmail: dummyEmail } },
       update: { status: 'ACCEPTED' },
       create: {
         eventId: latestEvent.id,
         guestEmail: dummyEmail,
         guestName: dummyNames[i],
         status: 'ACCEPTED',
       }
     });
     
     // Add a comment for each
     await prisma.comment.create({
       data: {
         eventId: latestEvent.id,
         userId: user.id, // Linking to the tester user for simplicity or ideally creating new dummy users
         content: `Excited for ${latestEvent.title}!`,
         type: 'TEXT'
       }
     });
  }

  // Also RSVP the requested user
  await prisma.rSVP.upsert({
    where: { eventId_guestEmail: { eventId: latestEvent.id, guestEmail: email } },
    update: { status: 'ACCEPTED' },
    create: {
      eventId: latestEvent.id,
      guestEmail: email,
      guestName: 'Hassan Jamal',
      status: 'ACCEPTED',
      userId: user.id
    }
  });

  console.log(`Added dummy data for event: ${latestEvent.title} (${latestEvent.id})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
