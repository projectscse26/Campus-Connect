"""
Script to check and fix authority titles in the database
Run this from the backend directory: python fix_authority_titles.py
"""

import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.authority import Authority

def check_and_fix_titles():
    """Check current authority titles and offer to fix them"""
    
    # Create database connection
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Get all authorities
        authorities = db.query(Authority).all()
        
        if not authorities:
            print("❌ No authorities found in database!")
            return
        
        print("\n" + "="*80)
        print("CURRENT AUTHORITY TITLES IN DATABASE")
        print("="*80)
        
        issues_found = []
        
        for auth in authorities:
            title_length = len(auth.title)
            title_repr = repr(auth.title)
            
            # Check for issues
            has_issue = False
            issue_type = []
            
            # Check for leading/trailing spaces
            if auth.title != auth.title.strip():
                has_issue = True
                issue_type.append("WHITESPACE")
            
            # Check for incorrect casing
            expected_titles = {
                'principal': 'Principal',
                'office manager': 'Office Manager',
                'dean': 'Dean',
                'vice principal': 'Vice Principal'
            }
            
            normalized = auth.title.lower().strip()
            if normalized in expected_titles and auth.title != expected_titles[normalized]:
                has_issue = True
                issue_type.append(f"SHOULD BE: {expected_titles[normalized]}")
            
            # Check for abbreviations
            if normalized in ['om', 'vp', 'officemanager', 'viceprincipal']:
                has_issue = True
                if normalized == 'om':
                    issue_type.append("SHOULD BE: Office Manager")
                elif normalized == 'vp':
                    issue_type.append("SHOULD BE: Vice Principal")
            
            status = "❌ ISSUE" if has_issue else "✅ OK"
            
            print(f"\nID: {auth.id}")
            print(f"Name: {auth.first_name} {auth.last_name}")
            print(f"Email: {auth.email}")
            print(f"Title: {title_repr}")
            print(f"Length: {title_length} characters")
            print(f"Status: {status}")
            
            if issue_type:
                print(f"Issues: {', '.join(issue_type)}")
                issues_found.append((auth, issue_type))
        
        print("\n" + "="*80)
        
        if not issues_found:
            print("✅ All authority titles are correct!")
            return
        
        print(f"\n⚠️  Found {len(issues_found)} authorities with title issues")
        
        # Ask if user wants to fix
        response = input("\nDo you want to fix these issues? (yes/no): ").strip().lower()
        
        if response not in ['yes', 'y']:
            print("No changes made.")
            return
        
        # Fix issues
        print("\n" + "="*80)
        print("FIXING TITLES...")
        print("="*80)
        
        for auth, issues in issues_found:
            old_title = auth.title
            normalized = auth.title.lower().strip()
            
            # Map to correct title
            title_map = {
                'principal': 'Principal',
                'office manager': 'Office Manager',
                'om': 'Office Manager',
                'dean': 'Dean',
                'vice principal': 'Vice Principal',
                'vp': 'Vice Principal',
                'officemanager': 'Office Manager',
                'viceprincipal': 'Vice Principal'
            }
            
            if normalized in title_map:
                new_title = title_map[normalized]
                auth.title = new_title
                print(f"\n✅ Fixed: {auth.email}")
                print(f"   Old: {repr(old_title)}")
                print(f"   New: {repr(new_title)}")
        
        # Commit changes
        db.commit()
        print("\n" + "="*80)
        print("✅ All titles have been fixed!")
        print("="*80)
        
        # Show final state
        print("\nFINAL STATE:")
        authorities = db.query(Authority).all()
        for auth in authorities:
            print(f"- {auth.email}: {repr(auth.title)}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "="*80)
    print("CAMPUS CONNECT - AUTHORITY TITLE CHECKER & FIXER")
    print("="*80)
    
    check_and_fix_titles()
    
    print("\n✅ Done! You can now restart your backend server.")
    print("   The dashboards should now work correctly.\n")
