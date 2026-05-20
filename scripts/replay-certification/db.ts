import { execSync } from 'child_process';

export class Database {
  async query(sql: string): Promise<{ rows: any[] }> {
    try {
      const command = `npx supabase db query "${sql}" --linked --output json`;
      const output = execSync(command, { encoding: 'utf8' }).trim();
      
      if (!output) {
        return { rows: [] };
      }
      
      // The CLI might output update warnings. Extract the JSON object.
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { rows: [] };
      }
      
      const data = JSON.parse(jsonMatch[0]);
      return { rows: data.rows || [] };
    } catch (e: any) {
      if (e.message.includes('JSON.parse') || e.message.includes('Unexpected token')) {
         return { rows: [] };
      }
      throw e;
    }
  }

  async execute(sql: string): Promise<void> {
    execSync(`npx supabase db query "${sql}" --linked --output json`, { stdio: 'inherit' });
  }
}

export const db = new Database();
