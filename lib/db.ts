import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { getSupabaseConfig } from './supabase';

type TableName = 'teachers' | 'students' | 'subjects' | 'attendance_sessions' | 'attendance_records';

type Store = Record<TableName, any[]>;

type DbQueryExecutor = {
  get: (...params: any[]) => Promise<any>;
  all: (...params: any[]) => Promise<any[]>;
  run: (...params: any[]) => Promise<any>;
};

class JsonDatabase {
  private filePath: string;
  private store: Store;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.store = {
      teachers: [],
      students: [],
      subjects: [],
      attendance_sessions: [],
      attendance_records: [],
    };
    this.ensureDirectory();
    this.load();
  }

  initialize() {
    this.load();
  }

  private ensureDirectory() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private load() {
    if (!fs.existsSync(this.filePath)) {
      this.seed();
      this.save();
      return;
    }

    const raw = fs.readFileSync(this.filePath, 'utf8');
    if (!raw.trim()) {
      this.seed();
      this.save();
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      this.store = { ...this.store, ...parsed };
    } catch {
      this.store = {
        teachers: [],
        students: [],
        subjects: [],
        attendance_sessions: [],
        attendance_records: [],
      };
    }

    this.seed();
    this.save();
  }

  private save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.store, null, 2));
  }

  private seed() {
    if (this.store.teachers.length === 0) {
      this.store.teachers.push({ id: 1, name: 'Teacher Sijey', username: '@dm!n_cj', password: bcrypt.hashSync('@dm!n_2026!', 10) });
    }

    const subjects = [
      'Information Assurance and Security 1',
      'Information Assurance and Security 2',
      'Information Management',
      'Web Systems and Technologies',
    ];

    const existingNames = new Set(this.store.subjects.map((item) => item.subject_name));
    subjects.forEach((subject) => {
      if (!existingNames.has(subject)) {
        this.store.subjects.push({ id: this.store.subjects.length + 1, subject_name: subject });
      }
    });
  }

  prepare(query: string): DbQueryExecutor {
    return {
      get: async (...params: any[]) => this.select(query, params),
      all: async (...params: any[]) => this.selectAll(query, params),
      run: async (...params: any[]) => this.runQuery(query, params),
    };
  }

  private select(query: string, params: any[] = []) {
    const match = query.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
    if (!match) {
      return null;
    }

    const [, selected, tableName, whereClause] = match;
    const items = (this.store[tableName as TableName] || []) as any[];
    let filtered = [...items];

    if (whereClause) {
      const clauses = whereClause.split(/\s+AND\s+/i);
      let paramIndex = 0;
      filtered = filtered.filter((item) => clauses.every((clause) => {
        const result = this.matchClause(item, clause, params[paramIndex]);
        paramIndex += 1;
        return result;
      }));
    }

    if (selected.includes('COUNT(*)')) {
      return { count: filtered.length };
    }

    if (selected === '*') {
      return filtered[0] || null;
    }

    return filtered[0] || null;
  }

  private selectAll(query: string, params: any[] = []) {
    const match = query.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
    if (!match) {
      return [];
    }

    const [, , tableName, whereClause] = match;
    let items = (this.store[tableName as TableName] || []) as any[];

    if (whereClause) {
      const clauses = whereClause.split(/\s+AND\s+/i);
      let paramIndex = 0;
      items = items.filter((item) => clauses.every((clause) => {
        const result = this.matchClause(item, clause, params[paramIndex]);
        paramIndex += 1;
        return result;
      }));
    }

    if (query.toUpperCase().includes('ORDER BY')) {
      const orderField = query.split('ORDER BY')[1]?.trim().split(' ')[0] || 'id';
      items = [...items].sort((a, b) => Number(a[orderField] || 0) - Number(b[orderField] || 0));
    }

    return items;
  }

  private matchClause(item: any, clause: string, param?: unknown) {
    const match = clause.match(/(\w+)\s*=\s*\?/i);
    if (!match) {
      return true;
    }
    const [, column] = match;
    return item[column] === param;
  }

  private runQuery(query: string, params: any[] = []) {
    const insertMatch = query.match(/INSERT(?:\s+OR\s+IGNORE)?\s+INTO\s+(\w+)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)/i);
    if (insertMatch) {
      const [, tableName, columnsText] = insertMatch;
      const columns = columnsText.split(',').map((col) => col.trim());
      const table = this.store[tableName as TableName];
      const row: Record<string, any> = {};
      columns.forEach((column, index) => {
        row[column] = params[index];
      });
      row.id = table.length + 1;
      table.push(row);
      this.save();
      return { lastInsertRowid: row.id };
    }

    const updateMatch = query.match(/UPDATE\s+(\w+)\s+SET\s+(.+)\s+WHERE\s+(.+)/i);
    if (updateMatch) {
      const [, tableName, setClause, whereClause] = updateMatch;
      const table = this.store[tableName as TableName] || [];
      const assignments = setClause.split(',').map((entry) => entry.trim());
      const whereMatch = whereClause.match(/(\w+)\s*=\s*\?/i);
      if (!whereMatch) {
        return { changes: 0 };
      }
      const [, whereColumn] = whereMatch;
      const targetId = params[params.length - 1];
      const target = table.find((item) => item[whereColumn] === targetId);
      if (!target) {
        return { changes: 0 };
      }
      assignments.forEach((entry, index) => {
        const assignMatch = entry.match(/(\w+)\s*=\s*\?/i);
        if (assignMatch) {
          const [, column] = assignMatch;
          target[column] = params[index];
        }
      });
      this.save();
      return { changes: 1 };
    }

    const deleteMatch = query.match(/DELETE\s+FROM\s+(\w+)\s+WHERE\s+(.+)/i);
    if (deleteMatch) {
      const [, tableName, whereClause] = deleteMatch;
      const table = this.store[tableName as TableName] || [];
      const whereMatch = whereClause.match(/(\w+)\s*=\s*\?/i);
      if (!whereMatch) {
        return { changes: 0 };
      }
      const [, whereColumn] = whereMatch;
      const targetId = params[0];
      const index = table.findIndex((item) => item[whereColumn] === targetId);
      if (index >= 0) {
        table.splice(index, 1);
        this.save();
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    return { changes: 0 };
  }
}

class SupabaseDatabase {
  private serviceRoleKey: string;

  constructor(serviceRoleKey: string) {
    this.serviceRoleKey = serviceRoleKey;
  }

  initialize() {
    return undefined;
  }

  prepare(query: string): DbQueryExecutor {
    return {
      get: async (...params: any[]) => this.select(query, params),
      all: async (...params: any[]) => this.selectAll(query, params),
      run: async (...params: any[]) => this.runQuery(query, params),
    };
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!this.serviceRoleKey) {
      throw new Error('Supabase service role key is not configured');
    }

    const { url } = getSupabaseConfig();
    const response = await fetch(`${url}/rest/v1${path}`, {
      ...init,
      headers: {
        apikey: this.serviceRoleKey,
        Authorization: `Bearer ${this.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(init.headers || {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase request failed: ${response.status} ${text}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  private async select(query: string, params: any[] = []) {
    const match = query.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
    if (!match) {
      return null;
    }

    const [, selected, tableName, whereClause] = match;
    let path = `/${tableName}`;
    const searchParams = new URLSearchParams();
    searchParams.set('select', selected === '*' ? '*' : selected.replace(/\s+/g, ''));

    if (whereClause) {
      const clauses = whereClause.split(/\s+AND\s+/i);
      clauses.forEach((clause, index) => {
        const matchClause = clause.match(/(\w+)\s*=\s*\?/i);
        if (matchClause) {
          const [, column] = matchClause;
          searchParams.set(column, `eq.${params[index]}`);
        }
      });
    }

    const url = new URLSearchParams(searchParams);
    if (url.toString()) {
      path += `?${url.toString()}`;
    }

    try {
      const data = await this.request<any[]>(path);
      if (selected.includes('COUNT(*)')) {
        return { count: data.length };
      }
      return data[0] || null;
    } catch {
      return null;
    }
  }

  private async selectAll(query: string, params: any[] = []) {
    const match = query.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
    if (!match) {
      return [];
    }

    const [, , tableName, whereClause] = match;
    let path = `/${tableName}`;
    const searchParams = new URLSearchParams();
    searchParams.set('select', '*');

    if (whereClause) {
      const clauses = whereClause.split(/\s+AND\s+/i);
      clauses.forEach((clause, index) => {
        const matchClause = clause.match(/(\w+)\s*=\s*\?/i);
        if (matchClause) {
          const [, column] = matchClause;
          searchParams.set(column, `eq.${params[index]}`);
        }
      });
    }

    const url = new URLSearchParams(searchParams);
    if (url.toString()) {
      path += `?${url.toString()}`;
    }

    try {
      return await this.request<any[]>(path);
    } catch {
      return [];
    }
  }

  private async runQuery(query: string, params: any[] = []) {
    const insertMatch = query.match(/INSERT(?:\s+OR\s+IGNORE)?\s+INTO\s+(\w+)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)/i);
    if (insertMatch) {
      const [, tableName, columnsText] = insertMatch;
      const columns = columnsText.split(',').map((col) => col.trim());
      const payload = columns.reduce((acc, column, index) => ({ ...acc, [column]: params[index] }), {});
      const data = await this.request<any[]>(`/${tableName}`, {
        method: 'POST',
        body: JSON.stringify([payload]),
      });
      return { lastInsertRowid: data[0]?.id || 1 };
    }

    const updateMatch = query.match(/UPDATE\s+(\w+)\s+SET\s+(.+)\s+WHERE\s+(.+)/i);
    if (updateMatch) {
      const [, tableName, setClause, whereClause] = updateMatch;
      const assignments = setClause.split(',').map((entry) => entry.trim());
      const payload = assignments.reduce((acc, entry, index) => {
        const assignMatch = entry.match(/(\w+)\s*=\s*\?/i);
        if (assignMatch) {
          const [, column] = assignMatch;
          acc[column] = params[index];
        }
        return acc;
      }, {} as Record<string, any>);

      const whereMatch = whereClause.match(/(\w+)\s*=\s*\?/i);
      if (!whereMatch) {
        return { changes: 0 };
      }
      const [, whereColumn] = whereMatch;
      const targetId = params[params.length - 1];
      await this.request(`/${tableName}?${whereColumn}=eq.${targetId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return { changes: 1 };
    }

    const deleteMatch = query.match(/DELETE\s+FROM\s+(\w+)\s+WHERE\s+(.+)/i);
    if (deleteMatch) {
      const [, tableName, whereClause] = deleteMatch;
      const whereMatch = whereClause.match(/(\w+)\s*=\s*\?/i);
      if (!whereMatch) {
        return { changes: 0 };
      }
      const [, whereColumn] = whereMatch;
      const targetId = params[0];
      await this.request(`/${tableName}?${whereColumn}=eq.${targetId}`, {
        method: 'DELETE',
      });
      return { changes: 1 };
    }

    return { changes: 0 };
  }
}

const dbPath = path.join(process.cwd(), 'data', 'attendance.json');
let db: JsonDatabase | SupabaseDatabase | null = null;

export function getDb() {
  if (!db) {
    const accessKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_cB3hcjoIkWlhRbpCeuUKsQ_vC9BHfKz';
    db = accessKey ? new SupabaseDatabase(accessKey) : new JsonDatabase(dbPath);
  }

  return db;
}

export function initializeDatabase() {
  getDb().initialize();
}
