
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:123@localhost:5432/event_platform?schema=public"
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const email = 'hassandev9986@gmail.com';
    const name = 'hassan';
    
    // 1. Insert/Update User
    const userRes = await client.query(`
      INSERT INTO users (id, name, email, phone, "emailVerified", role, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, NOW(), 'GUEST', NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET name = $2, phone = $4, "emailVerified" = NOW(), "updatedAt" = NOW()
      RETURNING id
    `, ['cl_tester_' + Date.now().toString(36), name, email, '923001234567']);
    
    const userId = userRes.rows[0].id;
    console.log('User settled:', userId);

    // 2. Get latest event
    const eventRes = await client.query(`
      SELECT id, title FROM events ORDER BY "createdAt" DESC LIMIT 1
    `);

    if (eventRes.rows.length === 0) {
      console.log('No events found');
      return;
    }

    const eventId = eventRes.rows[0].id;
    const eventTitle = eventRes.rows[0].title;
    console.log('Using event:', eventTitle);

    // 3. Insert dummy RSVPs
    const dummies = [
      ['Alex Smith', 'alex@example.com'],
      ['Taylor Reed', 'taylor@example.com'],
      ['Jordan Lee', 'jordan@example.com']
    ];

    for (const [dName, dEmail] of dummies) {
      const dId = 'cl_dummy_' + Math.random().toString(36).substr(2, 9);
      
      // Upsert dummy user
      await client.query(`
        INSERT INTO users (id, name, email, role, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'GUEST', NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
      `, [dId, dName, dEmail]);

      // Upsert RSVP
      await client.query(`
        INSERT INTO rsvps (id, status, "eventId", "guestName", "guestEmail", "createdAt", "updatedAt")
        VALUES ($1, 'ACCEPTED', $2, $3, $4, NOW(), NOW())
        ON CONFLICT ("eventId", "guestEmail") DO UPDATE SET status = 'ACCEPTED', "updatedAt" = NOW()
      `, ['rsvp_' + Math.random().toString(36).substr(2, 9), eventId, dName, dEmail]);

      // Add Comment
      await client.query(`
        INSERT INTO comments (id, content, type, "eventId", "userId", "createdAt", "updatedAt")
        VALUES ($1, $2, 'TEXT', $3, $4, NOW(), NOW())
      `, ['comment_' + Math.random().toString(36).substr(2, 9), `Can't wait for ${eventTitle}!`, eventId, userId]);
    }

    // 4. RSVP the requested user
    await client.query(`
      INSERT INTO rsvps (id, status, "eventId", "guestName", "guestEmail", "userId", "createdAt", "updatedAt")
      VALUES ($1, 'ACCEPTED', $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT ("eventId", "guestEmail") DO UPDATE SET status = 'ACCEPTED', "userId" = $5, "updatedAt" = NOW()
    `, ['rsvp_user_' + Date.now().toString(36), eventId, name, email, userId]);

    console.log('All dummy data added successfully');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
