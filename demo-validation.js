// demo-validation.js
// Demo script to showcase the validation and missing information features

const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function demoValidationFlow() {
    console.log('🛡️  MCP Task Scheduler - Validation & Safety Demo');
    console.log('================================================\n');
    
    console.log('This demo shows how the enhanced client now:');
    console.log('1. 🤔 Asks for missing information');
    console.log('2. ✅ Requires confirmation before executing actions');
    console.log('3. 📋 Shows clear summaries of what will happen\n');
    
    // Scenario 1: Vague request
    console.log('📝 Scenario 1: Vague Request');
    console.log('=========================');
    console.log('User says: "Schedule a meeting"');
    console.log('\n🤖 Assistant Response:');
    console.log('🤔 I need more details to schedule your meeting');
    console.log('\nI need the following information:');
    console.log('  1. meeting title/topic');
    console.log('  2. date and time');
    console.log('  3. duration or end time');
    console.log('\nPlease provide more details and try again.');
    
    await askQuestion('\nPress Enter to continue...');
    
    // Scenario 2: Complete request with validation
    console.log('\n📝 Scenario 2: Complete Request with Validation');
    console.log('==============================================');
    console.log('User says: "Schedule a team meeting tomorrow at 3pm"');
    console.log('\n🤖 Assistant Response:');
    console.log('Creating a work meeting for tomorrow at 3pm');
    console.log('\n📋 Action Summary: Create "Team meeting" on July 2, 2025 from 3:00 PM to 4:00 PM with work tag');
    console.log('\n❓ Do you want me to proceed with this action? (y/n):');
    
    const answer1 = await askQuestion('Your choice (y/n): ');
    
    if (answer1.toLowerCase().startsWith('y')) {
        console.log('\n⏳ Executing...');
        console.log('✅ Task created successfully!');
        console.log('  📅 Team meeting');
        console.log('     Date: 7/2/2025');
        console.log('     Time: 3:00 PM - 4:00 PM');
        console.log('     Tags: work');
    } else {
        console.log('❌ Action cancelled.');
    }
    
    await askQuestion('\nPress Enter to continue...');
    
    // Scenario 3: Reference to previous task
    console.log('\n📝 Scenario 3: Smart Reference with Validation');
    console.log('============================================');
    console.log('User says: "Delete that meeting"');
    console.log('\n🤖 Assistant Response:');
    console.log('I want to delete the team meeting we just created');
    console.log('\n📋 Action Summary: Delete "Team meeting" scheduled for July 2, 2025 at 3:00 PM');
    console.log('\n❓ Do you want me to proceed with this action? (y/n):');
    
    const answer2 = await askQuestion('Your choice (y/n): ');
    
    if (answer2.toLowerCase().startsWith('y')) {
        console.log('\n⏳ Executing...');
        console.log('✅ Task deleted successfully!');
    } else {
        console.log('❌ Action cancelled.');
    }
    
    await askQuestion('\nPress Enter to continue...');
    
    // Scenario 4: Simple CLI with validation
    console.log('\n📝 Scenario 4: Simple CLI with Interactive Prompts');
    console.log('================================================');
    console.log('Command: create');
    console.log('\n📝 Enter task title: Weekly planning session');
    console.log('📄 Enter task description (optional): Plan next week\'s priorities');
    console.log('📅 Enter date (optional): tomorrow');
    console.log('⏰ Enter time (optional): 10am');
    console.log('🏷️  Enter tags (optional): work');
    console.log('\n📋 Task Summary:');
    console.log('   Title: Weekly planning session');
    console.log('   Description: Plan next week\'s priorities');
    console.log('   Date & Time: 7/2/2025 at 10:00:00 AM');
    console.log('   Tags: work');
    console.log('\n❓ Create this task? (y/n):');
    
    const answer3 = await askQuestion('Your choice (y/n): ');
    
    if (answer3.toLowerCase().startsWith('y')) {
        console.log('✅ Task created: Weekly planning session');
    } else {
        console.log('❌ Task creation cancelled.');
    }
    
    console.log('\n🎉 Demo Complete!');
    console.log('\n💡 Key Benefits:');
    console.log('   • No accidental actions - everything requires confirmation');
    console.log('   • Clear communication - you always know what will happen');
    console.log('   • Intelligent prompting - system asks for missing details');
    console.log('   • Context awareness - remembers previous conversations');
    console.log('   • Safe operation - you\'re always in control');
    
    rl.close();
}

demoValidationFlow().catch(console.error);
