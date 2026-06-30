import os
import sys

# Add app to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.lms import Announcement
from app.api.announcements import get_announcements, create_announcement, update_announcement, delete_announcement
from app.schemas.announcements import AnnouncementCreate, AnnouncementUpdate

def main():
    print("=== STARTING DIRECT DATABASE ANNOUNCEMENT PERMISSIONS VERIFICATION ===")
    db = SessionLocal()
    try:
        # Get users
        admin_user = db.query(User).filter(User.email == "admin@svcet.edu").first()
        hod_user = db.query(User).filter(User.email == "hod@svcet.edu").first()
        faculty_user = db.query(User).filter(User.email == "faculty@svcet.edu").first()
        student_user = db.query(User).filter(User.email == "student@svcet.edu").first()
        authority_user = db.query(User).filter(User.email == "authority@svcet.edu").first()

        users = {
            "admin": admin_user,
            "hod": hod_user,
            "faculty": faculty_user,
            "student": student_user,
            "authority": authority_user
        }

        for role, u in users.items():
            if not u:
                print(f"Error: User for role {role} not found in DB. Make sure seed_db.py has been run.")
                sys.exit(1)
            print(f"Loaded user {role}: {u.email} (ID: {u.id})")

        # Clean up any previous test announcements to have a clean slate
        test_title_prefix = "[TEST PERM]"
        db.query(Announcement).filter(Announcement.title.like(f"{test_title_prefix}%")).delete(synchronize_session=False)
        db.commit()

        # 1. Test creation permissions
        print("\n--- Test 1: Role-based creation restrictions ---")
        
        # Student cannot create (should raise HTTP 403)
        try:
            create_announcement(
                ann_in=AnnouncementCreate(title=f"{test_title_prefix} Student", content="...", category="General", target_audience="Students"),
                db=db,
                current_user=student_user
            )
            print("FAIL: Student was allowed to create announcement")
            assert False
        except Exception as e:
            print(f"Pass: Student creation blocked: {e.detail if hasattr(e, 'detail') else e}")

        # Faculty can only target Students
        try:
            create_announcement(
                ann_in=AnnouncementCreate(title=f"{test_title_prefix} Fac Everyone", content="...", category="General", target_audience="Everyone"),
                db=db,
                current_user=faculty_user
            )
            print("FAIL: Faculty was allowed to target Everyone")
            assert False
        except Exception as e:
            print(f"Pass: Faculty targeting Everyone blocked: {e.detail if hasattr(e, 'detail') else e}")

        # Faculty targeting Students should succeed
        fac_ann = create_announcement(
            ann_in=AnnouncementCreate(title=f"{test_title_prefix} Fac Students", content="Hi Students", category="Academic", target_audience="Students"),
            db=db,
            current_user=faculty_user
        )
        print(f"Pass: Faculty targeting Students succeeded (ID: {fac_ann.id})")

        # Admin targeting Everyone should succeed
        admin_ann = create_announcement(
            ann_in=AnnouncementCreate(title=f"{test_title_prefix} Admin Everyone", content="Global announcement", category="Urgent", target_audience="Everyone", is_global=True),
            db=db,
            current_user=admin_user
        )
        print(f"Pass: Admin targeting Everyone succeeded (ID: {admin_ann.id})")

        # 2. Test Visibility Logic
        print("\n--- Test 2: Visibility checking ---")

        # Fetch visible announcements for Faculty creator (should see their own)
        fac_visible = [a.id for a in get_announcements(db=db, current_user=faculty_user)]
        print(f"Faculty creator sees own: {fac_ann.id in fac_visible} (Expected: True)")
        assert fac_ann.id in fac_visible

        # Fetch visible announcements for Student (should see Faculty announcement & Admin global)
        stud_visible = [a.id for a in get_announcements(db=db, current_user=student_user)]
        print(f"Student sees Faculty announcement: {fac_ann.id in stud_visible} (Expected: True)")
        print(f"Student sees Admin global announcement: {admin_ann.id in stud_visible} (Expected: True)")
        assert fac_ann.id in stud_visible
        assert admin_ann.id in stud_visible

        # Fetch visible announcements for HOD (should NOT see Faculty announcement, should see Admin global)
        hod_visible = [a.id for a in get_announcements(db=db, current_user=hod_user)]
        print(f"HOD sees Faculty announcement: {fac_ann.id in hod_visible} (Expected: False)")
        print(f"HOD sees Admin global announcement: {admin_ann.id in hod_visible} (Expected: True)")
        assert fac_ann.id not in hod_visible
        assert admin_ann.id in hod_visible

        # Fetch visible announcements for Admin (should see ALL announcements, including Faculty ones)
        admin_visible = [a.id for a in get_announcements(db=db, current_user=admin_user)]
        print(f"Admin sees Faculty announcement: {fac_ann.id in admin_visible} (Expected: True)")
        print(f"Admin sees Admin global announcement: {admin_ann.id in admin_visible} (Expected: True)")
        assert fac_ann.id in admin_visible
        assert admin_ann.id in admin_visible

        # 3. Test Delete permissions
        print("\n--- Test 3: Delete restrictions ---")
        # Faculty cannot delete Admin's
        try:
            delete_announcement(ann_id=admin_ann.id, db=db, current_user=faculty_user)
            print("FAIL: Faculty was allowed to delete Admin announcement")
            assert False
        except Exception as e:
            print(f"Pass: Faculty delete Admin announcement blocked: {e.detail if hasattr(e, 'detail') else e}")

        # Faculty can delete own
        delete_announcement(ann_id=fac_ann.id, db=db, current_user=faculty_user)
        print("Pass: Faculty deleted own announcement")

        # Admin can delete any
        # Let's create another faculty announcement to check Admin delete
        fac_ann2 = create_announcement(
            ann_in=AnnouncementCreate(title=f"{test_title_prefix} Fac Students 2", content="Hi Students 2", category="Academic", target_audience="Students"),
            db=db,
            current_user=faculty_user
        )
        delete_announcement(ann_id=fac_ann2.id, db=db, current_user=admin_user)
        print("Pass: Admin successfully deleted Faculty announcement")

        # Cleanup admin announcement
        delete_announcement(ann_id=admin_ann.id, db=db, current_user=admin_user)
        print("Pass: Cleanup admin announcement succeeded")

        print("\n=== ALL ANNOUNCEMENT BACKEND TESTS PASSED SUCCESSFULLY! ===")

    finally:
        db.close()

if __name__ == "__main__":
    main()
