import psycopg2
import io
import os

def run_import():
    url = os.environ.get("DATABASE_URL")
    if not url:
        return "DATABASE_URL environment variable is missing"
        
    try:
        conn = psycopg2.connect(url)
        cursor = conn.cursor()
        
        with open("dump.sql", "r", encoding="utf-8") as f:
            lines = f.readlines()
            
        buffer = []
        in_copy = False
        copy_cmd = ""
        copy_data = []
        
        for line in lines:
            if not in_copy:
                if line.startswith("COPY "):
                    in_copy = True
                    copy_cmd = line.strip()
                    # Execute all buffered SQL before the COPY
                    sql = "".join(buffer).strip()
                    if sql:
                        try:
                            cursor.execute(sql)
                        except psycopg2.ProgrammingError as e:
                            if "empty query" not in str(e):
                                raise e
                    buffer = []
                else:
                    # Ignore pg_dump commands like \connect
                    if not line.startswith("\\"):
                        buffer.append(line)
            else:
                if line.strip() == r"\.":
                    in_copy = False
                    # Execute the COPY command with the buffered data
                    cursor.copy_expert(copy_cmd, io.StringIO("".join(copy_data)))
                    copy_data = []
                else:
                    copy_data.append(line)
                    
        # Execute any remaining SQL
        if buffer:
            sql = "".join(buffer).strip()
            if sql:
                try:
                    cursor.execute(sql)
                except psycopg2.ProgrammingError as e:
                    if "empty query" not in str(e):
                        raise e
                
        conn.commit()
        cursor.close()
        conn.close()
        return "success"
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    print(run_import())
