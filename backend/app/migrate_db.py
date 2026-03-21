"""
migrate_db.py — 添加 user_id 字段迁移脚本
"""
import sqlite3
import os

DB_PATH = "./call_history.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print("❌ 找不到 call_history.db")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("PRAGMA table_info(call_records)")
    columns = [row[1] for row in cur.fetchall()]
    print(f"📋 当前字段: {columns}")

    if "user_id" in columns:
        print("✅ user_id 字段已存在，无需迁移。")
        conn.close()
        return

    # 添加 user_id，旧记录设为 "legacy_user"
    cur.execute("ALTER TABLE call_records ADD COLUMN user_id TEXT DEFAULT 'legacy_user'")
    conn.commit()
    print("✅ 添加 user_id 字段完成，旧记录 user_id = 'legacy_user'")

    cur.execute("SELECT COUNT(*) FROM call_records")
    print(f"📊 共 {cur.fetchone()[0]} 条记录已更新。")
    conn.close()

if __name__ == "__main__":
    migrate()