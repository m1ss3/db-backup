import * as fs from 'fs';
import * as mysql from 'mysql';

class DatabaseBackup {
  private connection: mysql.Connection;
  private dbName: string;
  private tablesInDbName: string;

  constructor(dbName: string) {
    this.dbName = dbName;
    this.tablesInDbName = `Tables_in_${dbName}`;
    this.connection = mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: '123',
      database: dbName
    });
  }

  public backup(): void {
    const backupFileName = `${this.dbName}_backup_${this.getTimestamp()}.sql`;
    const backupPath = `./src/backups/${backupFileName}`;

    this.connection.connect(err => {
      if (err) {
        console.error('Error connecting to database :', err);
        return;
      }

      this.connection.query(`SHOW TABLES FROM ${this.dbName}`, async (err, rows: { [key: string]: string }[]) => {
        if (err) {
          console.error('We got an error while importing the tables :', err);
          return;
        }

        for (const row of rows) {
          const tableName = row[this.tablesInDbName];
          if (!tableName) {
            console.error('Invalid table name :', tableName);
            continue;
          }

          await this.backupTableStructure(tableName, backupPath);
          await this.backupTableData(tableName, backupPath);
        }

        console.log(`Database backup created: ${backupFileName}`);
        this.connection.end();
      });
    });
  }

  private async backupTableStructure(tableName: string, backupPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.connection.query(`SHOW CREATE TABLE ${tableName}`, (err, rows: any[]) => {
        if (err) {
          console.error(`Error retrieving table structure : ${tableName}`, err);
          reject(err);
        } else {
          const createTableSQL = rows[0]['Create Table'];
          fs.appendFileSync(backupPath, `${createTableSQL};\n\n`);
          resolve();
        }
      });
    });
  }

  private async backupTableData(tableName: string, backupPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.connection.query(`SELECT * FROM ${tableName}`, (err, rows: any[]) => {
        if (err) {
          console.error(`Error retrieving table data: ${tableName}`, err);
          reject(err);
        } else {
          const sqlDump = this.generateSqlDump(tableName, rows);
          fs.appendFileSync(backupPath, sqlDump);
          resolve();
        }
      });
    });
  }

  private generateSqlDump(tableName: string, rows: any[]): string {
    const header = `-- Dumping data for table ${tableName}\n\n`;
    const values = rows.map(row => {
      const rowValues = Object.values(row).map(value => {
        if (typeof value === 'string') {
          return `'${value.replace(/'/g, "\\'")}'`;
        }
        return value;
      });
      return `INSERT INTO ${tableName} VALUES (${rowValues.join(', ')});`;
    }).join('\n');
    return `${header}${values}\n\n`;
  }

  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0');
    return `${day}_${month}_${year}_${hour}_${minute}_${second}`;
  }

}

export default DatabaseBackup;
