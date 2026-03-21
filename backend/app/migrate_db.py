"""
migrate_db.py — 一次性数据库迁移脚本
为旧表添加 source_language 和 target_language 字段

用法：
    python migrate_db.py
"""

import sqlite3
import os

DB_PATH = "./call_history.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print("❌ 找不到 call_history.db，请确认路径是否正确。")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("PRAGMA table_info(call_records)")
    columns = [row[1] for row in cur.fetchall()]
    print(f"📋 当前字段: {columns}")

    changed = False

    if "source_language" not in columns:
        cur.execute("ALTER TABLE call_records ADD COLUMN source_language TEXT DEFAULT 'English'")
        print("   ➕ 添加 source_language 字段（默认 English）")
        changed = True

    if "target_language" not in columns:
        cur.execute("ALTER TABLE call_records ADD COLUMN target_language TEXT DEFAULT 'Chinese (中文)'")
        print("   ➕ 添加 target_language 字段（默认 Chinese）")
        changed = True

    if not changed:
        print("✅ 已是最新结构，无需迁移。")
        conn.close()
        return

    conn.commit()

    cur.execute("PRAGMA table_info(call_records)")
    new_columns = [row[1] for row in cur.fetchall()]
    print(f"✅ 迁移完成！新字段: {new_columns}")

    cur.execute("SELECT COUNT(*) FROM call_records")
    count = cur.fetchone()[0]
    print(f"📊 共 {count} 条历史记录已更新。")

    conn.close()

if __name__ == "__main__":
    migrate()