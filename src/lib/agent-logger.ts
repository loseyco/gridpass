import { db } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { AgentTicket, SOPGuide } from '@/lib/types/admin';

export async function logAgentExecutionTicket(ticket: Omit<AgentTicket, 'id' | 'created_at'>): Promise<string> {
  const ticketId = `tick_${Date.now()}`;
  const fullTicket: AgentTicket = {
    ...ticket,
    id: ticketId,
    created_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'agent_tickets', ticketId), fullTicket, { merge: true });
    console.log(`✅ Logged Agent Execution Ticket: [${ticketId}] (${ticket.title})`);
  } catch (err) {
    console.warn(`Fallback agent ticket log [${ticketId}]:`, err);
  }

  return ticketId;
}

export async function createSOPGuide(sop: Omit<SOPGuide, 'id' | 'created_at'>): Promise<string> {
  const sopId = `sop_${Date.now()}`;
  const fullSOP: SOPGuide = {
    ...sop,
    id: sopId,
    created_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'sops', sopId), fullSOP, { merge: true });
    console.log(`📚 Created SOP Manual Guide: [${sopId}] (${sop.title})`);
  } catch (err) {
    console.warn(`Fallback SOP guide creation [${sopId}]:`, err);
  }

  return sopId;
}
