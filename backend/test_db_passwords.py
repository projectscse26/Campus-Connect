import psycopg2
import sys

def test_passwords():
    common_passwords = ["postgres", "admin", "admin123", "root", "password", "Welcome123", ""]
    
    for pwd in common_passwords:
        try:
            conn = psycopg2.connect(
                dbname="postgres",
                user="postgres",
                password=pwd,
                host="localhost",
                port="5432"
            )
            print(f"SUCCESS:{pwd}")
            conn.close()
            return pwd
        except psycopg2.OperationalError as e:
            continue
        except Exception as e:
            continue
    
    print("FAILED")
    sys.exit(1)

if __name__ == "__main__":
    test_passwords()
