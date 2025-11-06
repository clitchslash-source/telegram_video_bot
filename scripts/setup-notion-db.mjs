import axios from 'axios';

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
  console.error('Missing NOTION_API_KEY or NOTION_DATABASE_ID');
  process.exit(1);
}

const notionClient = axios.create({
  baseURL: 'https://api.notion.com/v1',
  headers: {
    Authorization: `Bearer ${NOTION_API_KEY}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  },
});

async function setupNotionDatabase() {
  try {
    console.log('Setting up Notion database...');

    // Get database info
    const dbResponse = await notionClient.get(`/databases/${NOTION_DATABASE_ID}`);
    console.log('✅ Database connected:', dbResponse.data.title);

    // The database should already have the following properties:
    // - Telegram ID (title)
    // - Username (text)
    // - First Name (text)
    // - Last Name (text)
    // - Current Balance (number)
    // - Total Purchased (number)
    // - Total Spent (number)
    // - Total Generations (number)
    // - Last Interaction (date)
    // - Created At (date)

    console.log('\n📋 Database properties:');
    Object.entries(dbResponse.data.properties).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value.type}`);
    });

    console.log('\n✅ Notion database setup complete!');
  } catch (error) {
    console.error('❌ Error setting up Notion database:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

setupNotionDatabase();
