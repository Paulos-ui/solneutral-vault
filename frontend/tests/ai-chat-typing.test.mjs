import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync(new URL('../components/RiskAnalyst.tsx',import.meta.url),'utf8');
const server=readFileSync(new URL('../app/api/ai/interpret/route.ts',import.meta.url),'utf8');
test('AI history updates retain ChatMessage roles without widening to string',()=>{
 assert.match(ui,/useState<ChatMessage\[\]>/);
 assert.match(ui,/const next: ChatMessage\[\]=\[/);
 assert.match(ui,/\{role:'user',content:question\}/);
 assert.match(ui,/\{role:'assistant',content\}/);
});
test('Claude route validates untrusted history using same typed contract',()=>{
 assert.match(server,/parseChatHistory\(p\.history\)/);
 assert.match(server,/history: ChatMessage\[\]/);
});
