import axios from 'axios';

const NOTION_API_KEY = process.env.NOTION_API_KEY;

if (!NOTION_API_KEY) {
  console.error('❌ Missing NOTION_API_KEY environment variable');
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

async function createNotionDatabase() {
  try {
    console.log('🔄 Creating Notion database for Telegram Video Bot...\n');

    // Get the user's workspace ID
    const userResponse = await notionClient.get('/users/me');
    const workspaceId = userResponse.data.workspace_id;
    console.log('✅ Connected to Notion workspace:', workspaceId);

    // Create the database
    const dbResponse = await notionClient.post('/databases', {
      parent: {
        type: 'workspace',
        workspace: true,
      },
      title: [
        {
          type: 'text',
          text: {
            content: 'Telegram Video Bot Users',
          },
        },
      ],
      properties: {
        'Telegram ID': {
          title: {},
        },
        'Username': {
          rich_text: {},
        },
        'First Name': {
          rich_text: {},
        },
        'Last Name': {
          rich_text: {},
        },
        'Current Balance': {
          number: {
            format: 'number',
          },
        },
        'Total Purchased': {
          number: {
            format: 'number',
          },
        },
        'Total Spent': {
          number: {
            format: 'number',
          },
        },
        'Total Generations': {
          number: {
            format: 'number',
          },
        },
        'Last Interaction': {
          date: {},
        },
        'Created At': {
          date: {},
        },
        'Status': {
          select: {
            options: [
              { name: 'Active', color: 'green' },
              { name: 'Inactive', color: 'gray' },
              { name: 'Banned', color: 'red' },
            ],
          },
        },
      },
    });

    const databaseId = dbResponse.data.id;
    console.log('\n✅ Database created successfully!');
    console.log('📋 Database ID:', databaseId);
    console.log('\n📝 Add this to your environment variables:');
    console.log(`NOTION_DATABASE_ID=${databaseId}`);

    return databaseId;
  } catch (error) {
    console.error('\n❌ Error creating Notion database:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

createNotionDatabase();
