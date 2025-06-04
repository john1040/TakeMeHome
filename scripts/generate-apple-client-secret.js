const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Configuration - Update these values with your Apple Developer account details
const CONFIG = {
  // Your Team ID from Apple Developer account
  teamId: 'M7NQ89BQ4Y',
  
  // Your Key ID (from the .p8 filename: AuthKey_XXXXXXXXXX.p8)
  keyId: 'FQ5L9P9UL4',
  
  // Your Services ID (the identifier you created for Sign In with Apple)
  clientId: 'com.john1040.tmhapp', // e.g., 'com.yourcompany.TakeMeHome.client'
  
  // Path to your .p8 private key file
  privateKeyPath: 'scripts/AuthKey_FQ5L9P9UL4.p8', // Update this path
};

function generateAppleClientSecret() {
  try {
    // Validate configuration
    if (CONFIG.teamId === 'M7NQ89BQ4Y' || 
        CONFIG.keyId === 'FQ5L9P9UL4' || 
        CONFIG.clientId === 'com.john1040.tmhapp') {
      console.error('❌ Error: Please update the CONFIG object with your Apple Developer details');
      console.log('\nRequired information:');
      console.log('1. Team ID: Found in Apple Developer account → Membership');
      console.log('2. Key ID: The 10-character ID from your .p8 filename');
      console.log('3. Services ID: The identifier you created for Sign In with Apple');
      console.log('4. Private Key Path: Path to your .p8 file');
      return;
    }

    // Check if private key file exists
    if (!fs.existsSync(CONFIG.privateKeyPath)) {
      console.error(`❌ Error: Private key file not found at: ${CONFIG.privateKeyPath}`);
      console.log('\nPlease:');
      console.log('1. Place your .p8 file in the project directory');
      console.log('2. Update the privateKeyPath in the CONFIG object');
      return;
    }

    // Read the private key
    const privateKey = fs.readFileSync(CONFIG.privateKeyPath, 'utf8');

    // Create JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: CONFIG.teamId,
      iat: now,
      exp: now + (86400 * 180), // 6 months (maximum allowed)
      aud: 'https://appleid.apple.com',
      sub: CONFIG.clientId,
    };

    // Generate JWT
    const clientSecret = jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      header: {
        kid: CONFIG.keyId,
        alg: 'ES256',
      },
    });

    // Display results
    console.log('✅ Apple Client Secret generated successfully!\n');
    console.log('📋 Configuration Summary:');
    console.log(`   Team ID: ${CONFIG.teamId}`);
    console.log(`   Key ID: ${CONFIG.keyId}`);
    console.log(`   Services ID: ${CONFIG.clientId}`);
    console.log(`   Expires: ${new Date((now + 86400 * 180) * 1000).toISOString()}\n`);
    
    console.log('🔑 Client Secret (use this in Supabase):');
    console.log('─'.repeat(80));
    console.log(clientSecret);
    console.log('─'.repeat(80));
    
    console.log('\n📝 Next Steps:');
    console.log('1. Copy the client secret above');
    console.log('2. Go to Supabase Dashboard → Authentication → Providers → Apple');
    console.log('3. Paste the client secret in the "Client Secret" field');
    console.log(`4. Set Client ID to: ${CONFIG.clientId}`);
    console.log('5. Set Redirect URL to: https://nkkaxelmylemiesxvmoz.supabase.co/auth/v1/callback');
    
    console.log('\n⚠️  Important Notes:');
    console.log('• This token expires in 6 months - you\'ll need to regenerate it');
    console.log('• Keep your .p8 file secure and never commit it to version control');
    console.log('• The Services ID must be configured in Apple Developer Portal');

  } catch (error) {
    console.error('❌ Error generating client secret:', error.message);
    
    if (error.message.includes('invalid key')) {
      console.log('\n🔍 Troubleshooting:');
      console.log('• Verify your .p8 file is valid and not corrupted');
      console.log('• Ensure the Key ID matches the .p8 filename');
    } else if (error.message.includes('ENOENT')) {
      console.log('\n🔍 Troubleshooting:');
      console.log('• Check the private key file path');
      console.log('• Ensure the .p8 file exists and is readable');
    }
  }
}

// Check if jsonwebtoken is installed
try {
  require.resolve('jsonwebtoken');
} catch (e) {
  console.error('❌ Error: jsonwebtoken package not found');
  console.log('\nPlease install it by running:');
  console.log('npm install jsonwebtoken');
  console.log('\nThen run this script again.');
  process.exit(1);
}

// Run the generator
console.log('🍎 Apple Sign In Client Secret Generator\n');
generateAppleClientSecret();