import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

type TableName = 'teachers' | 'students' | 'subjects' | 'attendance_sessions' | 'attendance_records';

type Store = Record<TableName, any[]>;

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
    const parsed = JSON.parse(raw);
    this.store = { ...this.store, ...parsed };
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
    subjects.forEach((subject, index) => {
      if (!existingNames.has(subject)) {
        this.store.subjects.push({ id: this.store.subjects.length + 1, subject_name: subject });
      }
    });
  }

  prepare(query: string) {
    return {
      get: (...params: any[]) => this.select(query, params),
      all: (...params: any[]) => this.selectAll(query, params),
      run: (...params: any[]) => this.run(query, ...params),
    };
  }

  exec(_query: string) {
    return undefined;
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

  run(query: string, ...params: any[]) {
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

const dbPath = path.join(process.cwd(), 'data', 'attendance.json');
const db = new JsonDatabase(dbPath);

export function initializeDatabase() {
  db.prepare('SELECT 1').get();
}

export function getDb() {
  return db;
}
