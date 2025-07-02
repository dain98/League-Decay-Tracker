import crypto from 'crypto';

// Generate a secure API key
function generateApiKey() {
  // Generate a 32-byte random key and encode it as base64
  const apiKey = crypto.randomBytes(32).toString('base64');
  
  console.log('🔑 Generated API Key for Decay Processing:');
  console.log('='.repeat(50));
  console.log(apiKey);
  console.log('='.repeat(50));
  console.log('\n📝 Add this to your .env file:');
  console.log(`DECAY_API_KEY=${apiKey}`);
  console.log('\n⚠️  Keep this key secure and don\'t commit it to version control!');
  console.log('\n💡 You can also use this key in your cron jobs or automated scripts.');
}

generateApiKey(); 
