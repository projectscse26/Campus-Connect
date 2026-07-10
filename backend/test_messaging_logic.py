import os
import sys

# Add app directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.authority import Authority
from app.models.messaging import Conversation, Message, SenderType, MessageType
from app.api.messaging import (
    get_student_conversation,
    get_dean_conversations,
    get_student_profile_reveal,
    get_conversation_messages,
    send_message
)

def main():
    print("=== STARTING DIRECT DATABASE MESSAGING SYSTEM VERIFICATION (DEAN FLOW) ===")
    db = SessionLocal()
    try:
        # Load test users
        student_user = db.query(User).filter(User.email == "abinaya23td0654@svcet.ac.in").first()
        dean_user = db.query(User).filter(User.email == "dean@svcet.ac.in").first()

        if not student_user or not dean_user:
            print("Error: Required test users (abinaya23td0654@svcet.ac.in or dean@svcet.ac.in) not found in DB.")
            sys.exit(1)

        print(f"Loaded student user: {student_user.email} (ID: {student_user.id})")
        print(f"Loaded Dean user: {dean_user.email} (ID: {dean_user.id})")

        # Resolve profiles
        student_profile = db.query(Student).filter(Student.user_id == student_user.id).first()
        dean_profile = db.query(Authority).filter(Authority.user_id == dean_user.id).first()

        if not student_profile or not dean_profile:
            print("Error: Student or Dean profile not found in DB.")
            sys.exit(1)

        print(f"Student: {student_profile.first_name} {student_profile.last_name} (ID: {student_profile.id})")
        print(f"Dean: {dean_profile.first_name} {dean_profile.last_name} (ID: {dean_profile.id})")

        # Clean up any existing conversation between this student and Dean for a clean test run
        db.query(Message).filter(
            Message.conversation_id.in_(
                db.query(Conversation.id).filter(
                    Conversation.student_id == student_profile.id,
                    Conversation.dean_id == dean_profile.id
                )
            )
        ).delete(synchronize_session=False)
        
        db.query(Conversation).filter(
            Conversation.student_id == student_profile.id,
            Conversation.dean_id == dean_profile.id
        ).delete(synchronize_session=False)
        db.commit()
        print("Cleaned up previous test records.")

        # --- Test 1: Create Conversation via student portal ---
        print("\n--- Test 1: Create Conversation ---")
        conv_res = get_student_conversation(db=db, current_user=student_user)
        print(f"Pass: Conversation resolved/created (ID: {conv_res.id})")
        assert conv_res.student_id == student_profile.id
        assert conv_res.dean_id == dean_profile.id
        assert conv_res.dean_unread_count == 0
        assert conv_res.student_unread_count == 0

        # --- Test 2: Send Message from Student ---
        print("\n--- Test 2: Student sends a message ---")
        msg_text = "Hello Dean, this is an anonymous concern about Academic Schedule."
        # Call the send_message function directly (file = None)
        import asyncio
        async def run_send_msg():
            return await send_message(
                conversation_id=conv_res.id,
                message_text=msg_text,
                file=None,
                db=db,
                current_user=student_user
            )
        msg_res = asyncio.run(run_send_msg())
        print(f"Pass: Message sent successfully (ID: {msg_res.id})")
        assert msg_res.message_text == msg_text
        assert msg_res.sender_type == SenderType.STUDENT
        assert msg_res.is_read is False

        # Verify unread counts updated in DB
        db.refresh(db.query(Conversation).filter(Conversation.id == conv_res.id).first())
        conv_db = db.query(Conversation).filter(Conversation.id == conv_res.id).first()
        print(f"Dean Unread Count: {conv_db.dean_unread_count} (Expected: 1)")
        print(f"Last Message: '{conv_db.last_message}' (Expected: '{msg_text}')")
        assert conv_db.dean_unread_count == 1
        assert conv_db.last_message == msg_text

        # --- Test 3: List Conversations as Dean & Search ---
        print("\n--- Test 3: Dean lists & searches conversations ---")
        # List all conversations
        convs = get_dean_conversations(search=None, db=db, current_user=dean_user)
        print(f"Pass: Dean retrieved {len(convs)} conversation(s).")
        assert len(convs) >= 1
        assert any(c.id == conv_res.id for c in convs)

        # Search by student first name
        convs_search_name = get_dean_conversations(search=student_profile.first_name, db=db, current_user=dean_user)
        print(f"Pass: Search by first name '{student_profile.first_name}' found {len(convs_search_name)} conversations.")
        assert any(c.id == conv_res.id for c in convs_search_name)

        # Search by student register number
        convs_search_reg = get_dean_conversations(search=student_profile.register_number, db=db, current_user=dean_user)
        print(f"Pass: Search by register number '{student_profile.register_number}' found {len(convs_search_reg)} conversations.")
        assert any(c.id == conv_res.id for c in convs_search_reg)

        # Search by something non-existent
        convs_search_none = get_dean_conversations(search="XYZ999_DUMMY", db=db, current_user=dean_user)
        print(f"Pass: Search for non-existent student returned {len(convs_search_none)} results.")
        assert not any(c.id == conv_res.id for c in convs_search_none)

        # --- Test 4: Dean reads messages ---
        print("\n--- Test 4: Dean reads messages (unread resets) ---")
        msgs = get_conversation_messages(conversation_id=conv_res.id, db=db, current_user=dean_user)
        print(f"Pass: Dean retrieved {len(msgs)} message(s).")
        assert len(msgs) == 1
        assert msgs[0].message_text == msg_text

        # Verify unread counts updated to 0 in DB
        db.refresh(conv_db)
        print(f"Dean Unread Count after read: {conv_db.dean_unread_count} (Expected: 0)")
        assert conv_db.dean_unread_count == 0

        # --- Test 5: Dean sends a reply ---
        print("\n--- Test 5: Dean replies to student ---")
        reply_text = "Thank you for sharing your concern. I will look into it."
        async def run_reply_msg():
            return await send_message(
                conversation_id=conv_res.id,
                message_text=reply_text,
                file=None,
                db=db,
                current_user=dean_user
            )
        reply_res = asyncio.run(run_reply_msg())
        print(f"Pass: Dean reply sent successfully (ID: {reply_res.id})")
        assert reply_res.message_text == reply_text
        assert reply_res.sender_type == SenderType.DEAN

        db.refresh(conv_db)
        print(f"Student Unread Count: {conv_db.student_unread_count} (Expected: 1)")
        assert conv_db.student_unread_count == 1

        # --- Test 6: Reveal Student Profile ---
        print("\n--- Test 6: Dean reveals student profile ---")
        profile_reveal = get_student_profile_reveal(conversation_id=conv_res.id, db=db, current_user=dean_user)
        print(f"Pass: Student identity revealed successfully.")
        print(f"Student Name: {profile_reveal.name}")
        print(f"Register Number: {profile_reveal.register_number}")
        print(f"Department: {profile_reveal.department}")
        assert profile_reveal.register_number == student_profile.register_number
        assert student_profile.first_name in profile_reveal.name

        # --- Test 7: Student reads messages ---
        print("\n--- Test 7: Student reads replies (unread resets) ---")
        stud_msgs = get_conversation_messages(conversation_id=conv_res.id, db=db, current_user=student_user)
        print(f"Pass: Student retrieved {len(stud_msgs)} message(s).")
        assert len(stud_msgs) == 2

        db.refresh(conv_db)
        print(f"Student Unread Count after read: {conv_db.student_unread_count} (Expected: 0)")
        assert conv_db.student_unread_count == 0

        # Clean up database test records
        db.query(Message).filter(Message.conversation_id == conv_res.id).delete(synchronize_session=False)
        db.query(Conversation).filter(Conversation.id == conv_res.id).delete(synchronize_session=False)
        db.commit()
        print("\n=== ALL TEST CASES COMPLETED PERFECTLY ===")

    finally:
        db.close()

if __name__ == "__main__":
    main()
