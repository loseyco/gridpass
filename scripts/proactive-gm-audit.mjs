// scripts/proactive-gm-audit.mjs
// Autonomous Proactive GM Audit & Subagent Dispatcher Engine
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function runProactiveAudit() {
  console.log('==================================================');
  console.log('🤖 PROACTIVE GM AUTONOMOUS AUDIT & SWARM DISPATCHER');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('==================================================\n');

  try {
    // 1. Audit Member Feedback
    console.log('📥 STEP 1: AUDITING MEMBER FEEDBACK TRIAGE QUEUE...');
    const feedbackOutput = execSync('node db-inspect.mjs user_feedback', { encoding: 'utf-8' });
    console.log(feedbackOutput.split('\n').slice(0, 15).join('\n'));

    // 2. Audit System Logs & Telemetry
    console.log('\n📡 STEP 2: AUDITING REAL-TIME TELEMETRY & FRICTION SIGNALS...');
    const logsOutput = execSync('node db-inspect.mjs system_logs', { encoding: 'utf-8' });
    console.log(logsOutput.split('\n').slice(0, 15).join('\n'));

    // 3. Audit Agent Tickets Queue
    console.log('\n🎟️ STEP 3: AUDITING SUBAGENT EXECUTION TICKETS...');
    const ticketsOutput = execSync('node db-inspect.mjs agent_tickets', { encoding: 'utf-8' });
    console.log(ticketsOutput.split('\n').slice(0, 15).join('\n'));

    console.log('\n==================================================');
    console.log('✅ PROACTIVE GM AUDIT COMPLETED CLEANLY WITH 0 ERRORS');
    console.log('==================================================');
  } catch (err) {
    console.error('❌ Error executing proactive GM audit:', err.message);
  }
}

runProactiveAudit();
