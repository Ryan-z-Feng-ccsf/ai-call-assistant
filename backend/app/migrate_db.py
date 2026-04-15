"""
igrate_db.py — Migration script to add user_id column
"""
import sqlite3
import os

DB_PATH = "./call_history.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print("❌ call_history.db not found")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("PRAGMA table_info(call_records)")
    columns = [row[1] for row in cur.fetchall()]
    print(f"📋 Current columns: {columns}")

    if "user_id" in columns:
        print("✅ user_id column already exists, no migration needed.")
        conn.close()
        return

    # 添加 user_id，旧记录设为 "legacy_user"
    cur.execute("ALTER TABLE call_records ADD COLUMN user_id TEXT DEFAULT 'legacy_user'")
    conn.commit()
    print("✅ Added user_id column successfully, old records user_id = 'legacy_user'")

    cur.execute("SELECT COUNT(*) FROM call_records")
    print(f"📊 Total of {cur.fetchone()[0]} records updated.")
    conn.close()

if __name__ == "__main__":
    migrate()
