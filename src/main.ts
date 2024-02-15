import DatabaseBackup from "./class/DatabaseBackup";

const dbName = 'hotel';
const backupInterval = 24 * 60 * 60 * 1000; // 24 hour

function backupDatabase(): void {
    const backup = new DatabaseBackup(dbName);
    backup.backup();
}

backupDatabase();

setInterval(backupDatabase, backupInterval);