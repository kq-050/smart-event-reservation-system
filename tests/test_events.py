import uuid
from datetime import datetime, timedelta, timezone

def test_get_events(client):
    response = client.get("/events")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_event_requires_authentication(client):
    response = client.post(
        "/events",
        json={
            "name": "Test Event",
            "location": "Islamabad",
            "capacity": 100
        }
    )

    assert response.status_code == 401
    

def test_normal_user_cannot_create_event(client):
    # Register a test user
    register_response = client.post(
        "/auth/register",
        json={
            "name": "Test User",
            "email": "testuser@example.com",
            "password": "testpassword123"
        }
    )

    assert register_response.status_code == 201

    # Login
    login_response = client.post(
        "/auth/login",
        json={
            "email": "testuser@example.com",
            "password": "testpassword123"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    # Try to create an event
    response = client.post(
        "/events",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "name": "Unauthorized Event",
            "location": "Islamabad",
            "capacity": 100
        }
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Organizer access required"
    

def test_organizer_can_create_event(client):
    # Register organizer
    register_response = client.post(
        "/auth/register",
        json={
            "name": "Test Organizer",
            "email": "organizer_test@example.com",
            "password": "testpassword123"
        }
    )

    assert register_response.status_code == 201

    # Change role directly in test DB
    from app.database import get_db
    from app import models
    from tests.conftest import TestingSessionLocal

    db = TestingSessionLocal()

    user = db.query(models.User).filter(
        models.User.email == "organizer_test@example.com"
    ).first()

    user.role = "organizer"
    db.commit()
    organizer_id = user.id
    db.close()

    # Login
    login_response = client.post(
        "/auth/login",
        json={
            "email": "organizer_test@example.com",
            "password": "testpassword123"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    # Create event
    response = client.post(
        "/events",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Test Python Conference",
            "location": "Islamabad",
            "capacity": 200
        }
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Test Python Conference"
    assert data["location"] == "Islamabad"
    assert data["capacity"] == 200
    assert data["organizer_id"] == organizer_id
    


def test_ticket_quantity_cannot_exceed_event_capacity(client):
    # Register organizer
    register_response = client.post(
        "/auth/register",
        json={
            "name": "Ticket Organizer",
            "email": "ticket_organizer@example.com",
            "password": "testpassword123"
        }
    )

    assert register_response.status_code == 201

    # Promote user to organizer
    from app import models
    from tests.conftest import TestingSessionLocal

    db = TestingSessionLocal()

    user = db.query(models.User).filter(
        models.User.email == "ticket_organizer@example.com"
    ).first()

    user.role = "organizer"
    db.commit()

    db.close()

    # Login
    login_response = client.post(
        "/auth/login",
        json={
            "email": "ticket_organizer@example.com",
            "password": "testpassword123"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Create event with capacity of 100
    event_response = client.post(
        "/events",
        headers=headers,
        json={
            "name": "Capacity Test Event",
            "location": "Islamabad",
            "capacity": 100
        }
    )

    assert event_response.status_code == 201

    event_id = event_response.json()["id"]

    # Create first ticket type with 80 tickets
    ticket_response = client.post(
        f"/events/{event_id}/ticket-types",
        headers=headers,
        json={
            "name": "Regular",
            "price": 2000,
            "quantity": 80
        }
    )

    assert ticket_response.status_code == 201

    # Try to add another 30 tickets.
    # 80 + 30 = 110, which exceeds the event capacity of 100.
    response = client.post(
        f"/events/{event_id}/ticket-types",
        headers=headers,
        json={
            "name": "VIP",
            "price": 5000,
            "quantity": 30
        }
    )

    assert response.status_code == 400
    assert "exceeds event capacity" in response.json()["detail"]
    
    
def test_reservation_cannot_exceed_available_tickets(client):
    from app import models
    from tests.conftest import TestingSessionLocal

    # ---------- Create organizer ----------
    client.post(
        "/auth/register",
        json={
            "name": "Reservation Organizer",
            "email": "reservation_organizer@example.com",
            "password": "testpassword123"
        }
    )

    db = TestingSessionLocal()

    organizer = db.query(models.User).filter(
        models.User.email == "reservation_organizer@example.com"
    ).first()

    organizer.role = "organizer"
    db.commit()
    db.close()

    # ---------- Login organizer ----------
    login_response = client.post(
        "/auth/login",
        json={
            "email": "reservation_organizer@example.com",
            "password": "testpassword123"
        }
    )

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # ---------- Create event ----------
    event_response = client.post(
        "/events",
        headers=headers,
        json={
            "name": "Reservation Test Event",
            "location": "Islamabad",
            "capacity": 10
        }
    )

    assert event_response.status_code == 201

    event_id = event_response.json()["id"]

    # ---------- Create ticket type ----------
    ticket_response = client.post(
        f"/events/{event_id}/ticket-types",
        headers=headers,
        json={
            "name": "Regular",
            "price": 2000,
            "quantity": 10
        }
    )

    assert ticket_response.status_code == 201

    ticket_type_id = ticket_response.json()["id"]

    # ---------- Create normal user ----------
    client.post(
        "/auth/register",
        json={
            "name": "Reservation User",
            "email": "reservation_user@example.com",
            "password": "testpassword123"
        }
    )

    # ---------- Login normal user ----------
    user_login = client.post(
        "/auth/login",
        json={
            "email": "reservation_user@example.com",
            "password": "testpassword123"
        }
    )

    user_token = user_login.json()["access_token"]

    user_headers = {
        "Authorization": f"Bearer {user_token}"
    }

    # ---------- Reserve 10 tickets ----------
    first_reservation = client.post(
        "/reservations",
        headers=user_headers,
        json={
            "ticket_type_id": ticket_type_id,
            "quantity": 10
        }
    )

    assert first_reservation.status_code == 201

    # ---------- Try to reserve one more ----------
    second_reservation = client.post(
        "/reservations",
        headers=user_headers,
        json={
            "ticket_type_id": ticket_type_id,
            "quantity": 1
        }
    )

    assert second_reservation.status_code == 400
    assert "Only 0 tickets available" in second_reservation.json()["detail"]
    

def test_cancellation_releases_tickets(client):
    from app import models
    from tests.conftest import TestingSessionLocal

    # ---------- Create organizer ----------
    client.post(
        "/auth/register",
        json={
            "name": "Cancel Organizer",
            "email": "cancel_organizer@example.com",
            "password": "testpassword123"
        }
    )

    db = TestingSessionLocal()

    organizer = db.query(models.User).filter(
        models.User.email == "cancel_organizer@example.com"
    ).first()

    organizer.role = "organizer"
    db.commit()
    db.close()

    # ---------- Login organizer ----------
    login_response = client.post(
        "/auth/login",
        json={
            "email": "cancel_organizer@example.com",
            "password": "testpassword123"
        }
    )

    organizer_token = login_response.json()["access_token"]

    organizer_headers = {
        "Authorization": f"Bearer {organizer_token}"
    }

    # ---------- Create event ----------
    event_response = client.post(
        "/events",
        headers=organizer_headers,
        json={
            "name": "Cancellation Test Event",
            "location": "Islamabad",
            "capacity": 10
        }
    )

    event_id = event_response.json()["id"]

    # ---------- Create ticket type ----------
    ticket_response = client.post(
        f"/events/{event_id}/ticket-types",
        headers=organizer_headers,
        json={
            "name": "Regular",
            "price": 2000,
            "quantity": 10
        }
    )

    ticket_type_id = ticket_response.json()["id"]

    # ---------- Create normal user ----------
    client.post(
        "/auth/register",
        json={
            "name": "Cancel User",
            "email": "cancel_user@example.com",
            "password": "testpassword123"
        }
    )

    # ---------- Login normal user ----------
    user_login = client.post(
        "/auth/login",
        json={
            "email": "cancel_user@example.com",
            "password": "testpassword123"
        }
    )

    user_token = user_login.json()["access_token"]

    user_headers = {
        "Authorization": f"Bearer {user_token}"
    }

    # ---------- Reserve 10 tickets ----------
    reservation_response = client.post(
        "/reservations",
        headers=user_headers,
        json={
            "ticket_type_id": ticket_type_id,
            "quantity": 10
        }
    )

    assert reservation_response.status_code == 201

    reservation_id = reservation_response.json()["id"]

    # ---------- Verify no tickets remain ----------
    availability_response = client.get(
        f"/ticket-types/{ticket_type_id}/availability"
    )

    assert availability_response.status_code == 200
    assert availability_response.json()["available_quantity"] == 0

    # ---------- Cancel reservation ----------
    cancel_response = client.put(
        f"/reservations/{reservation_id}/cancel",
        headers=user_headers
    )

    assert cancel_response.status_code == 200
    assert cancel_response.json()["status"] == "cancelled"

    # ---------- Verify tickets were released ----------
    availability_response = client.get(
        f"/ticket-types/{ticket_type_id}/availability"
    )

    assert availability_response.status_code == 200
    assert availability_response.json()["available_quantity"] == 10
    

def test_confirmed_reservation_appears_in_booking_history(client):
    from app import models
    from tests.conftest import TestingSessionLocal

    # ---------- Create organizer ----------
    client.post(
        "/auth/register",
        json={
            "name": "Booking Organizer",
            "email": "booking_organizer@example.com",
            "password": "testpassword123"
        }
    )

    db = TestingSessionLocal()

    organizer = db.query(models.User).filter(
        models.User.email == "booking_organizer@example.com"
    ).first()

    organizer.role = "organizer"
    db.commit()
    db.close()

    # ---------- Login organizer ----------
    login_response = client.post(
        "/auth/login",
        json={
            "email": "booking_organizer@example.com",
            "password": "testpassword123"
        }
    )

    organizer_token = login_response.json()["access_token"]

    organizer_headers = {
        "Authorization": f"Bearer {organizer_token}"
    }

    # ---------- Create event ----------
    event_response = client.post(
        "/events",
        headers=organizer_headers,
        json={
            "name": "Booking Test Event",
            "location": "Islamabad",
            "capacity": 50
        }
    )

    assert event_response.status_code == 201

    event_id = event_response.json()["id"]

    # ---------- Create ticket type ----------
    ticket_response = client.post(
        f"/events/{event_id}/ticket-types",
        headers=organizer_headers,
        json={
            "name": "Regular",
            "price": 2500,
            "quantity": 50
        }
    )

    assert ticket_response.status_code == 201

    ticket_type_id = ticket_response.json()["id"]

    # ---------- Create user ----------
    client.post(
        "/auth/register",
        json={
            "name": "Booking User",
            "email": "booking_user@example.com",
            "password": "testpassword123"
        }
    )

    # ---------- Login user ----------
    user_login = client.post(
        "/auth/login",
        json={
            "email": "booking_user@example.com",
            "password": "testpassword123"
        }
    )

    assert user_login.status_code == 200

    user_token = user_login.json()["access_token"]

    user_headers = {
        "Authorization": f"Bearer {user_token}"
    }

    # ---------- Create reservation ----------
    reservation_response = client.post(
        "/reservations",
        headers=user_headers,
        json={
            "ticket_type_id": ticket_type_id,
            "quantity": 2
        }
    )

    assert reservation_response.status_code == 201

    reservation_id = reservation_response.json()["id"]
    booking_reference = reservation_response.json()["booking_reference"]

    assert reservation_response.json()["status"] == "active"

    # ---------- Confirm reservation ----------
    confirm_response = client.put(
        f"/reservations/{reservation_id}/confirm",
        headers=user_headers
    )

    assert confirm_response.status_code == 200
    assert confirm_response.json()["status"] == "confirmed"

    # ---------- Check booking history ----------
    bookings_response = client.get(
        "/bookings/my",
        headers=user_headers
    )

    assert bookings_response.status_code == 200

    bookings = bookings_response.json()

    assert len(bookings) >= 1

    booking = next(
        booking for booking in bookings
        if booking["booking_reference"] == booking_reference
    )

    assert booking["status"] == "confirmed"
    assert booking["quantity"] == 2
    

def test_user_cannot_cancel_another_users_reservation(client):
    from app import models
    from tests.conftest import TestingSessionLocal

    # ---------- Create organizer ----------
    client.post(
        "/auth/register",
        json={
            "name": "Security Organizer",
            "email": "security_organizer@example.com",
            "password": "testpassword123"
        }
    )

    db = TestingSessionLocal()

    organizer = db.query(models.User).filter(
        models.User.email == "security_organizer@example.com"
    ).first()

    organizer.role = "organizer"
    db.commit()
    db.close()

    # ---------- Login organizer ----------
    organizer_login = client.post(
        "/auth/login",
        json={
            "email": "security_organizer@example.com",
            "password": "testpassword123"
        }
    )

    organizer_token = organizer_login.json()["access_token"]

    organizer_headers = {
        "Authorization": f"Bearer {organizer_token}"
    }

    # ---------- Create event ----------
    event_response = client.post(
        "/events",
        headers=organizer_headers,
        json={
            "name": "Security Test Event",
            "location": "Islamabad",
            "capacity": 20
        }
    )

    event_id = event_response.json()["id"]

    # ---------- Create ticket type ----------
    ticket_response = client.post(
        f"/events/{event_id}/ticket-types",
        headers=organizer_headers,
        json={
            "name": "Regular",
            "price": 2000,
            "quantity": 20
        }
    )

    ticket_type_id = ticket_response.json()["id"]

    # ---------- Create User A ----------
    client.post(
        "/auth/register",
        json={
            "name": "User A",
            "email": "security_user_a@example.com",
            "password": "testpassword123"
        }
    )

    # ---------- Login User A ----------
    user_a_login = client.post(
        "/auth/login",
        json={
            "email": "security_user_a@example.com",
            "password": "testpassword123"
        }
    )

    user_a_token = user_a_login.json()["access_token"]

    user_a_headers = {
        "Authorization": f"Bearer {user_a_token}"
    }

    # ---------- User A creates reservation ----------
    reservation_response = client.post(
        "/reservations",
        headers=user_a_headers,
        json={
            "ticket_type_id": ticket_type_id,
            "quantity": 2
        }
    )

    assert reservation_response.status_code == 201

    reservation_id = reservation_response.json()["id"]

    # ---------- Create User B ----------
    client.post(
        "/auth/register",
        json={
            "name": "User B",
            "email": "security_user_b@example.com",
            "password": "testpassword123"
        }
    )

    # ---------- Login User B ----------
    user_b_login = client.post(
        "/auth/login",
        json={
            "email": "security_user_b@example.com",
            "password": "testpassword123"
        }
    )

    user_b_token = user_b_login.json()["access_token"]

    user_b_headers = {
        "Authorization": f"Bearer {user_b_token}"
    }

    # ---------- User B tries to cancel User A's reservation ----------
    response = client.put(
        f"/reservations/{reservation_id}/cancel",
        headers=user_b_headers
    )

    assert response.status_code == 403
    assert response.json()["detail"] == (
        "You can only cancel your own reservations"
    )


def test_fixture_can_create_organizer(client, create_user):
    organizer = create_user(
        client,
        "Fixture Organizer",
        "fixture_test@example.com",
        role="organizer"
    )

    response = client.post(
        "/events",
        headers=organizer["headers"],
        json={
            "name": "Fixture Test Event",
            "location": "Islamabad",
            "capacity": 100
        }
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Fixture Test Event"
    

def test_event_cannot_reduce_capacity_below_ticket_quantity(
    client,
    create_event
):
    result = create_event(capacity=100)

    event_id = result["event"]["id"]
    headers = result["headers"]

    # Create 80 tickets
    ticket_response = client.post(
        f"/events/{event_id}/ticket-types",
        headers=headers,
        json={
            "name": "Regular",
            "price": 2000,
            "quantity": 80
        }
    )

    assert ticket_response.status_code == 201

    # Try reducing event capacity to 50
    update_response = client.put(
        f"/events/{event_id}",
        headers=headers,
        json={
            "name": "Test Event",
            "location": "Islamabad",
            "capacity": 50
        }
    )

    assert update_response.status_code == 400

    assert "cannot be reduced below" in (
        update_response.json()["detail"]
    )
    

def test_expired_reservation_cannot_be_confirmed(client, create_event):
    from datetime import datetime, timedelta

    result = create_event(capacity=20)

    headers = result["headers"]
    event_id = result["event"]["id"]

    # Create ticket type
    ticket_response = client.post(
        f"/events/{event_id}/ticket-types",
        headers=headers,
        json={
            "name": "Regular",
            "price": 2000,
            "quantity": 20
        }
    )

    assert ticket_response.status_code == 201

    ticket_type_id = ticket_response.json()["id"]

    # Create normal user
    user = client.post(
        "/auth/register",
        json={
            "name": "Expired User",
            "email": "expired_user@example.com",
            "password": "testpassword123"
        }
    )

    assert user.status_code == 201

    login_response = client.post(
        "/auth/login",
        json={
            "email": "expired_user@example.com",
            "password": "testpassword123"
        }
    )

    token = login_response.json()["access_token"]

    user_headers = {
        "Authorization": f"Bearer {token}"
    }

    # Create reservation
    reservation_response = client.post(
        "/reservations",
        headers=user_headers,
        json={
            "ticket_type_id": ticket_type_id,
            "quantity": 2
        }
    )

    assert reservation_response.status_code == 201

    reservation_id = reservation_response.json()["id"]

    # Manually make the reservation expired
    from tests.conftest import TestingSessionLocal
    from app import models

    db = TestingSessionLocal()

    reservation = db.query(models.Reservation).filter(
        models.Reservation.id == reservation_id
    ).first()

    reservation.expires_at = (
    datetime.now(timezone.utc).replace(tzinfo=None)
    - timedelta(minutes=1)
        )

    db.commit()
    db.close()

    # Try to confirm expired reservation
    response = client.put(
        f"/reservations/{reservation_id}/confirm",
        headers=user_headers
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Reservation has expired"
    

def test_user_cannot_confirm_another_users_reservation(
    client,
    create_event
):
    result = create_event(capacity=20)

    organizer_headers = result["headers"]
    event_id = result["event"]["id"]

    # Create ticket type
    ticket_response = client.post(
        f"/events/{event_id}/ticket-types",
        headers=organizer_headers,
        json={
            "name": "Regular",
            "price": 2000,
            "quantity": 20
        }
    )

    assert ticket_response.status_code == 201

    ticket_type_id = ticket_response.json()["id"]

    # Create User A
    user_a = client.post(
        "/auth/register",
        json={
            "name": "Confirm User A",
            "email": "confirm_user_a@example.com",
            "password": "testpassword123"
        }
    )

    assert user_a.status_code == 201

    login_a = client.post(
        "/auth/login",
        json={
            "email": "confirm_user_a@example.com",
            "password": "testpassword123"
        }
    )

    token_a = login_a.json()["access_token"]

    headers_a = {
        "Authorization": f"Bearer {token_a}"
    }

    # User A creates reservation
    reservation_response = client.post(
        "/reservations",
        headers=headers_a,
        json={
            "ticket_type_id": ticket_type_id,
            "quantity": 2
        }
    )

    assert reservation_response.status_code == 201

    reservation_id = reservation_response.json()["id"]

    # Create User B
    user_b = client.post(
        "/auth/register",
        json={
            "name": "Confirm User B",
            "email": "confirm_user_b@example.com",
            "password": "testpassword123"
        }
    )

    assert user_b.status_code == 201

    login_b = client.post(
        "/auth/login",
        json={
            "email": "confirm_user_b@example.com",
            "password": "testpassword123"
        }
    )

    token_b = login_b.json()["access_token"]

    headers_b = {
        "Authorization": f"Bearer {token_b}"
    }

    # User B tries to confirm User A's reservation
    response = client.put(
        f"/reservations/{reservation_id}/confirm",
        headers=headers_b
    )

    assert response.status_code == 403
    assert response.json()["detail"] == (
        "You can only confirm your own reservations"
    )
    

def test_event_search(client):
    # Create organizer
    client.post(
        "/auth/register",
        json={
            "name": "Search Organizer",
            "email": "search_organizer@example.com",
            "password": "testpassword123"
        }
    )

    # Make user organizer
    from app import models
    from tests.conftest import TestingSessionLocal

    db = TestingSessionLocal()

    organizer = db.query(models.User).filter(
        models.User.email == "search_organizer@example.com"
    ).first()

    organizer.role = "organizer"
    db.commit()
    db.close()

    # Login
    login_response = client.post(
        "/auth/login",
        json={
            "email": "search_organizer@example.com",
            "password": "testpassword123"
        }
    )

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Create two events
    client.post(
        "/events",
        headers=headers,
        json={
            "name": "Python Developer Conference",
            "location": "Islamabad",
            "capacity": 500
        }
    )

    client.post(
        "/events",
        headers=headers,
        json={
            "name": "JavaScript Workshop",
            "location": "Lahore",
            "capacity": 100
        }
    )

    # Search
    response = client.get(
        "/events?search=Python"
    )

    assert response.status_code == 200

    events = response.json()

    assert len(events) == 1
    assert events[0]["name"] == "Python Developer Conference"


def test_event_location_filter(client):
    # Create organizer
    client.post(
        "/auth/register",
        json={
            "name": "Location Organizer",
            "email": "location_organizer@example.com",
            "password": "testpassword123"
        }
    )

    from app import models
    from tests.conftest import TestingSessionLocal

    db = TestingSessionLocal()

    organizer = db.query(models.User).filter(
        models.User.email == "location_organizer@example.com"
    ).first()

    organizer.role = "organizer"
    db.commit()
    db.close()

    # Login
    login_response = client.post(
        "/auth/login",
        json={
            "email": "location_organizer@example.com",
            "password": "testpassword123"
        }
    )

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Create events in different locations
    client.post(
        "/events",
        headers=headers,
        json={
            "name": "Islamabad Tech Summit",
            "location": "Islamabad",
            "capacity": 300
        }
    )

    client.post(
        "/events",
        headers=headers,
        json={
            "name": "Lahore Developer Meetup",
            "location": "Lahore",
            "capacity": 200
        }
    )

    # Filter by location
    response = client.get(
        "/events?location=Islamabad"
    )

    assert response.status_code == 200

    events = response.json()

    assert len(events) == 1
    assert events[0]["location"] == "Islamabad"


def test_event_pagination(client):
    # Create organizer
    client.post(
        "/auth/register",
        json={
            "name": "Pagination Organizer",
            "email": "pagination_organizer@example.com",
            "password": "testpassword123"
        }
    )

    from app import models
    from tests.conftest import TestingSessionLocal

    db = TestingSessionLocal()

    organizer = db.query(models.User).filter(
        models.User.email == "pagination_organizer@example.com"
    ).first()

    organizer.role = "organizer"
    db.commit()
    db.close()

    # Login
    login_response = client.post(
        "/auth/login",
        json={
            "email": "pagination_organizer@example.com",
            "password": "testpassword123"
        }
    )

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Create three events
    for i in range(3):
        response = client.post(
            "/events",
            headers=headers,
            json={
                "name": f"Pagination Event {i}",
                "location": "Islamabad",
                "capacity": 100
            }
        )

        assert response.status_code == 201

    # Get only two events
    response = client.get(
        "/events?skip=0&limit=2"
    )

    assert response.status_code == 200

    events = response.json()

    assert len(events) == 2

    # Get next page
    response = client.get(
        "/events?skip=2&limit=2"
    )

    assert response.status_code == 200

    events = response.json()

    assert len(events) == 1
    

def test_organizer_can_only_see_their_own_events(
    client,
    create_user
):
    # Create Organizer A
    organizer_a = create_user(
        client,
        "Organizer A",
        "organizer_a@example.com",
        role="organizer"
    )

    # Create Organizer B
    organizer_b = create_user(
        client,
        "Organizer B",
        "organizer_b@example.com",
        role="organizer"
    )

    # Organizer A creates an event
    response_a = client.post(
        "/events",
        headers=organizer_a["headers"],
        json={
            "name": "Organizer A Event",
            "location": "Islamabad",
            "capacity": 100
        }
    )

    assert response_a.status_code == 201

    # Organizer B creates an event
    response_b = client.post(
        "/events",
        headers=organizer_b["headers"],
        json={
            "name": "Organizer B Event",
            "location": "Lahore",
            "capacity": 200
        }
    )

    assert response_b.status_code == 201

    # Organizer A requests their events
    response = client.get(
        "/organizer/events",
        headers=organizer_a["headers"]
    )

    assert response.status_code == 200

    events = response.json()

    # Organizer A should see their own event
    assert len(events) == 1
    assert events[0]["name"] == "Organizer A Event"
    

def test_organizer_can_only_view_tickets_for_their_own_event(
    client,
    create_user
):
    # Create Organizer A
    organizer_a = create_user(
        client,
        "Organizer A",
        "tickets_organizer_a@example.com",
        role="organizer"
    )

    # Create Organizer B
    organizer_b = create_user(
        client,
        "Organizer B",
        "tickets_organizer_b@example.com",
        role="organizer"
    )

    # Organizer A creates an event
    response_a = client.post(
        "/events",
        headers=organizer_a["headers"],
        json={
            "name": "Organizer A Event",
            "location": "Islamabad",
            "capacity": 100
        }
    )

    assert response_a.status_code == 201
    event_a = response_a.json()

    # Organizer B creates an event
    response_b = client.post(
        "/events",
        headers=organizer_b["headers"],
        json={
            "name": "Organizer B Event",
            "location": "Lahore",
            "capacity": 200
        }
    )

    assert response_b.status_code == 201
    event_b = response_b.json()

    # Organizer A views their own event's tickets
    own_response = client.get(
        f"/organizer/events/{event_a['id']}/tickets",
        headers=organizer_a["headers"]
    )

    assert own_response.status_code == 200
    assert own_response.json()["event_id"] == event_a["id"]

    # Organizer A tries to view Organizer B's event
    other_response = client.get(
        f"/organizer/events/{event_b['id']}/tickets",
        headers=organizer_a["headers"]
    )

    assert other_response.status_code == 404


def test_ticket_quantity_cannot_exceed_event_capacity(
    client,
    create_user
):
    organizer = create_user(
        client,
        "Ticket Organizer",
        "ticket_capacity@example.com",
        role="organizer"
    )

    event_response = client.post(
        "/events",
        headers=organizer["headers"],
        json={
            "name": "Capacity Test Event",
            "location": "Islamabad",
            "capacity": 100
        }
    )

    assert event_response.status_code == 201

    event_id = event_response.json()["id"]

    response = client.post(
        f"/events/{event_id}/ticket-types",
        headers=organizer["headers"],
        json={
            "name": "VIP",
            "price": 100,
            "quantity": 101
        }
    )

    assert response.status_code == 400
    assert "exceeds event capacity" in response.json()["detail"]
    

def test_total_ticket_quantity_cannot_exceed_event_capacity(
    client,
    create_user
):
    organizer = create_user(
        client,
        "Multi Ticket Organizer",
        "multi_ticket@example.com",
        role="organizer"
    )

    event_response = client.post(
        "/events",
        headers=organizer["headers"],
        json={
            "name": "Multi Ticket Event",
            "location": "Islamabad",
            "capacity": 100
        }
    )

    assert event_response.status_code == 201

    event_id = event_response.json()["id"]

    # Add 60 tickets
    first_response = client.post(
        f"/events/{event_id}/ticket-types",
        headers=organizer["headers"],
        json={
            "name": "Standard",
            "price": 50,
            "quantity": 60
        }
    )

    assert first_response.status_code == 201

    # Try to add another 50.
    # 60 + 50 = 110 > 100
    second_response = client.post(
        f"/events/{event_id}/ticket-types",
        headers=organizer["headers"],
        json={
            "name": "VIP",
            "price": 100,
            "quantity": 50
        }
    )

    assert second_response.status_code == 400
    assert "exceeds event capacity" in second_response.json()["detail"]
    

def test_organizer_cannot_update_another_organizers_ticket(
    client,
    create_user
):
    organizer_a = create_user(
        client,
        "Organizer A",
        "ticket_owner_a@example.com",
        role="organizer"
    )

    organizer_b = create_user(
        client,
        "Organizer B",
        "ticket_owner_b@example.com",
        role="organizer"
    )

    # Organizer A creates the event
    event_response = client.post(
        "/events",
        headers=organizer_a["headers"],
        json={
            "name": "Organizer A Event",
            "location": "Islamabad",
            "capacity": 100
        }
    )

    assert event_response.status_code == 201

    event_id = event_response.json()["id"]

    # Organizer A creates the ticket
    ticket_response = client.post(
        f"/events/{event_id}/ticket-types",
        headers=organizer_a["headers"],
        json={
            "name": "Standard",
            "price": 50,
            "quantity": 50
        }
    )

    assert ticket_response.status_code == 201

    ticket_id = ticket_response.json()["id"]

    # Organizer B tries to modify Organizer A's ticket
    update_response = client.put(
        f"/ticket-types/{ticket_id}",
        headers=organizer_b["headers"],
        json={
            "name": "Hacked Ticket",
            "price": 1,
            "quantity": 1
        }
    )

    assert update_response.status_code == 403
    

def test_my_bookings_pagination(client, create_user, create_event):
    user = create_user(
        client,
        "Booking User",
        f"booking_{uuid.uuid4().hex[:8]}@example.com"
    )

    event_data = create_event()
    event = event_data["event"]
    organizer_headers = event_data["headers"]

    ticket_response = client.post(
        f"/events/{event['id']}/ticket-types",
        headers=organizer_headers,
        json={
            "name": "General Admission",
            "price": 1000,
            "quantity": 20
        }
    )

    assert ticket_response.status_code == 201

    ticket_type_id = ticket_response.json()["id"]

    # Create 3 confirmed bookings for the same user
    for _ in range(3):
        reservation_response = client.post(
            "/reservations",
            headers=user["headers"],
            json={
                "ticket_type_id": ticket_type_id,
                "quantity": 1
            }
        )

        assert reservation_response.status_code == 201

        reservation_id = reservation_response.json()["id"]

        confirm_response = client.put(
            f"/reservations/{reservation_id}/confirm",
            headers=user["headers"]
        )

        assert confirm_response.status_code == 200

    # Request only 2 bookings
    response = client.get(
        "/bookings/my?skip=0&limit=2",
        headers=user["headers"]
    )

    assert response.status_code == 200
    assert len(response.json()) == 2
    
def test_my_reservations_pagination(client, create_user, create_event):
    user = create_user(
        client,
        "Reservation User",
        f"reservation_{uuid.uuid4().hex[:8]}@example.com"
    )

    event_data = create_event()
    event = event_data["event"]
    organizer_headers = event_data["headers"]

    ticket_response = client.post(
        f"/events/{event['id']}/ticket-types",
        headers=organizer_headers,
        json={
            "name": "General Admission",
            "price": 1000,
            "quantity": 20
        }
    )

    ticket_type_id = ticket_response.json()["id"]

    # Create 3 reservations
    for _ in range(3):
        response = client.post(
            "/reservations",
            headers=user["headers"],
            json={
                "ticket_type_id": ticket_type_id,
                "quantity": 1
            }
        )

        assert response.status_code == 201

    # Request only 2 reservations
    response = client.get(
        "/reservations/my?skip=0&limit=2",
        headers=user["headers"]
    )

    assert response.status_code == 200
    assert len(response.json()) == 2

def test_user_cannot_view_another_users_booking(
    client,
    create_user,
    create_event
):
    user_one = create_user(
        client,
        "User One",
        f"user1_{uuid.uuid4().hex[:8]}@example.com"
    )

    user_two = create_user(
        client,
        "User Two",
        f"user2_{uuid.uuid4().hex[:8]}@example.com"
    )

    event_data = create_event()
    event = event_data["event"]
    organizer_headers = event_data["headers"]

    ticket_response = client.post(
        f"/events/{event['id']}/ticket-types",
        headers=organizer_headers,
        json={
            "name": "General Admission",
            "price": 1000,
            "quantity": 10
        }
    )

    ticket_type_id = ticket_response.json()["id"]

    # User One creates a reservation
    reservation_response = client.post(
        "/reservations",
        headers=user_one["headers"],
        json={
            "ticket_type_id": ticket_type_id,
            "quantity": 1
        }
    )

    assert reservation_response.status_code == 201

    reservation_id = reservation_response.json()["id"]

    # User One confirms it
    confirm_response = client.put(
        f"/reservations/{reservation_id}/confirm",
        headers=user_one["headers"]
    )

    assert confirm_response.status_code == 200

    booking_reference = reservation_response.json()["booking_reference"]

    # User Two tries to access User One's booking
    response = client.get(
        f"/bookings/{booking_reference}",
        headers=user_two["headers"]
    )

    assert response.status_code == 404
    
    
def test_organizer_can_only_see_their_own_reservations(
    client,
    create_user,
    create_event
):
    organizer_one = create_user(
        client,
        "Organizer One",
        f"org1_{uuid.uuid4().hex[:8]}@example.com",
        role="organizer"
    )

    organizer_two = create_user(
        client,
        "Organizer Two",
        f"org2_{uuid.uuid4().hex[:8]}@example.com",
        role="organizer"
    )

    user = create_user(
        client,
        "Booking User",
        f"booking_{uuid.uuid4().hex[:8]}@example.com"
    )

    # Create event for Organizer One
    event_one_response = client.post(
        "/events",
        headers=organizer_one["headers"],
        json={
            "name": "Organizer One Event",
            "location": "Islamabad",
            "capacity": 100
        }
    )

    assert event_one_response.status_code == 201
    event_one = event_one_response.json()

    # Create event for Organizer Two
    event_two_response = client.post(
        "/events",
        headers=organizer_two["headers"],
        json={
            "name": "Organizer Two Event",
            "location": "Lahore",
            "capacity": 100
        }
    )

    assert event_two_response.status_code == 201
    event_two = event_two_response.json()

    # Create ticket type for Organizer One's event
    ticket_one_response = client.post(
        f"/events/{event_one['id']}/ticket-types",
        headers=organizer_one["headers"],
        json={
            "name": "General Admission",
            "price": 1000,
            "quantity": 10
        }
    )

    assert ticket_one_response.status_code == 201
    ticket_one_id = ticket_one_response.json()["id"]

    # Create ticket type for Organizer Two's event
    ticket_two_response = client.post(
        f"/events/{event_two['id']}/ticket-types",
        headers=organizer_two["headers"],
        json={
            "name": "General Admission",
            "price": 1000,
            "quantity": 10
        }
    )

    assert ticket_two_response.status_code == 201
    ticket_two_id = ticket_two_response.json()["id"]

    # User creates reservation for Organizer One's event
    reservation_one = client.post(
        "/reservations",
        headers=user["headers"],
        json={
            "ticket_type_id": ticket_one_id,
            "quantity": 1
        }
    )

    assert reservation_one.status_code == 201

    # User creates reservation for Organizer Two's event
    reservation_two = client.post(
        "/reservations",
        headers=user["headers"],
        json={
            "ticket_type_id": ticket_two_id,
            "quantity": 1
        }
    )

    assert reservation_two.status_code == 201

    # Organizer One should only see their reservation
    response = client.get(
        "/organizer/reservations",
        headers=organizer_one["headers"]
    )

    assert response.status_code == 200

    reservations = response.json()

    assert len(reservations) == 1
    assert reservations[0]["id"] == reservation_one.json()["id"]
    

def test_normal_user_cannot_view_organizer_reservations(
    client,
    create_user
):
    user = create_user(
        client,
        "Normal User",
        f"user_{uuid.uuid4().hex[:8]}@example.com"
    )

    response = client.get(
        "/organizer/reservations",
        headers=user["headers"]
    )

    assert response.status_code == 403
    

def test_organizer_reservation_contains_customer_event_and_ticket_details(
    client,
    create_user
):
    customer_email = f"customer_{uuid.uuid4().hex[:8]}@example.com"

    organizer = create_user(
        client,
        "Event Organizer",
        f"organizer_{uuid.uuid4().hex[:8]}@example.com",
        role="organizer"
    )

    customer = create_user(
        client,
        "Booking Customer",
        customer_email
    )

    # Create event
    event_response = client.post(
        "/events",
        headers=organizer["headers"],
        json={
            "name": "Python Developer Conference",
            "location": "Islamabad",
            "capacity": 100
        }
    )

    assert event_response.status_code == 201
    event = event_response.json()

    # Create ticket type
    ticket_response = client.post(
        f"/events/{event['id']}/ticket-types",
        headers=organizer["headers"],
        json={
            "name": "VIP",
            "price": 2500,
            "quantity": 20
        }
    )

    assert ticket_response.status_code == 201
    ticket_type = ticket_response.json()

    # Customer creates reservation
    reservation_response = client.post(
        "/reservations",
        headers=customer["headers"],
        json={
            "ticket_type_id": ticket_type["id"],
            "quantity": 2
        }
    )

    assert reservation_response.status_code == 201

    reservation = reservation_response.json()

    # Organizer views reservations
    response = client.get(
        "/organizer/reservations",
        headers=organizer["headers"]
    )

    assert response.status_code == 200

    reservations = response.json()

    assert len(reservations) == 1

    booking = reservations[0]

    assert booking["id"] == reservation["id"]
    assert booking["booking_reference"] == reservation["booking_reference"]

    assert booking["customer_name"] == "Booking Customer"
    assert booking["customer_email"] == customer_email

    assert booking["event_id"] == event["id"]
    assert booking["event_name"] == "Python Developer Conference"

    assert booking["ticket_type_id"] == ticket_type["id"]
    assert booking["ticket_type_name"] == "VIP"
    assert booking["ticket_price"] == 2500

    assert booking["quantity"] == 2
    assert booking["total_price"] == 5000
    assert booking["status"] == "active"


def test_organizer_dashboard_contains_event_statistics(
    client,
    create_user
):
    organizer = create_user(
        client,
        "Dashboard Organizer",
        f"dashboard_{uuid.uuid4().hex[:8]}@example.com",
        role="organizer"
    )

    customer = create_user(
        client,
        "Dashboard Customer",
        f"customer_{uuid.uuid4().hex[:8]}@example.com"
    )

    # Create event
    event_response = client.post(
        "/events",
        headers=organizer["headers"],
        json={
            "name": "Python Developer Conference",
            "location": "Islamabad",
            "capacity": 100
        }
    )

    assert event_response.status_code == 201
    event = event_response.json()

    # Create ticket type
    ticket_response = client.post(
        f"/events/{event['id']}/ticket-types",
        headers=organizer["headers"],
        json={
            "name": "VIP",
            "price": 2500,
            "quantity": 20
        }
    )

    assert ticket_response.status_code == 201
    ticket_type = ticket_response.json()

    # Create reservation
    reservation_response = client.post(
        "/reservations",
        headers=customer["headers"],
        json={
            "ticket_type_id": ticket_type["id"],
            "quantity": 2
        }
    )

    assert reservation_response.status_code == 201

    reservation = reservation_response.json()

    # Confirm reservation
    confirm_response = client.put(
        f"/reservations/{reservation['id']}/confirm",
        headers=customer["headers"]
    )

    assert confirm_response.status_code == 200

    # Get dashboard
    response = client.get(
        "/organizer/dashboard",
        headers=organizer["headers"]
    )

    assert response.status_code == 200

    data = response.json()

    # Overall statistics
    assert data["total_events"] == 1
    assert data["total_ticket_types"] == 1
    assert data["total_reservations"] == 1
    assert data["confirmed_bookings"] == 1
    assert data["total_tickets_sold"] == 2
    assert data["total_revenue"] == 5000

    # Event-level statistics
    assert len(data["events"]) == 1

    event_stats = data["events"][0]

    assert event_stats["event_id"] == event["id"]
    assert event_stats["event_name"] == "Python Developer Conference"
    assert event_stats["capacity"] == 100

    assert event_stats["total_ticket_types"] == 1
    assert event_stats["total_tickets"] == 20
    assert event_stats["tickets_sold"] == 2
    assert event_stats["tickets_available"] == 18

    assert event_stats["total_reservations"] == 1
    assert event_stats["confirmed_bookings"] == 1
    assert event_stats["active_reservations"] == 0
    assert event_stats["cancelled_reservations"] == 0
    assert event_stats["expired_reservations"] == 0

    assert event_stats["total_revenue"] == 5000
    
def test_organizer_dashboard_only_contains_own_events(
    client,
    create_user
):
    organizer_one = create_user(
        client,
        "Organizer One",
        f"dashboard_org1_{uuid.uuid4().hex[:8]}@example.com",
        role="organizer"
    )

    organizer_two = create_user(
        client,
        "Organizer Two",
        f"dashboard_org2_{uuid.uuid4().hex[:8]}@example.com",
        role="organizer"
    )

    # Organizer One creates an event
    response_one = client.post(
        "/events",
        headers=organizer_one["headers"],
        json={
            "name": "Organizer One Event",
            "location": "Islamabad",
            "capacity": 100
        }
    )

    assert response_one.status_code == 201

    # Organizer Two creates an event
    response_two = client.post(
        "/events",
        headers=organizer_two["headers"],
        json={
            "name": "Organizer Two Event",
            "location": "Lahore",
            "capacity": 200
        }
    )

    assert response_two.status_code == 201

    # Organizer One's dashboard
    dashboard_one = client.get(
        "/organizer/dashboard",
        headers=organizer_one["headers"]
    )

    assert dashboard_one.status_code == 200

    data_one = dashboard_one.json()

    assert data_one["total_events"] == 1
    assert len(data_one["events"]) == 1
    assert data_one["events"][0]["event_name"] == "Organizer One Event"

    # Organizer Two's dashboard
    dashboard_two = client.get(
        "/organizer/dashboard",
        headers=organizer_two["headers"]
    )

    assert dashboard_two.status_code == 200

    data_two = dashboard_two.json()

    assert data_two["total_events"] == 1
    assert len(data_two["events"]) == 1
    assert data_two["events"][0]["event_name"] == "Organizer Two Event"
    

def test_normal_user_cannot_view_organizer_dashboard(
    client,
    create_user
):
    user = create_user(
        client,
        "Normal Dashboard User",
        f"dashboard_user_{uuid.uuid4().hex[:8]}@example.com"
    )

    response = client.get(
        "/organizer/dashboard",
        headers=user["headers"]
    )

    assert response.status_code == 403


def test_organizer_cannot_update_another_organizers_event(
    client,
    create_user
):
    organizer_one = create_user(
        client,
        "Organizer One",
        f"update_org1_{uuid.uuid4().hex[:8]}@example.com",
        role="organizer"
    )

    organizer_two = create_user(
        client,
        "Organizer Two",
        f"update_org2_{uuid.uuid4().hex[:8]}@example.com",
        role="organizer"
    )

    event_response = client.post(
        "/events",
        headers=organizer_one["headers"],
        json={
            "name": "Original Event",
            "location": "Islamabad",
            "capacity": 100
        }
    )

    assert event_response.status_code == 201

    event = event_response.json()

    response = client.put(
        f"/events/{event['id']}",
        headers=organizer_two["headers"],
        json={
            "name": "Hacked Event",
            "location": "Lahore",
            "capacity": 200
        }
    )

    assert response.status_code == 403
    

def test_organizer_cannot_delete_another_organizers_event(
    client,
    create_user
):
    organizer_one = create_user(
        client,
        "Delete Organizer One",
        f"delete_org1_{uuid.uuid4().hex[:8]}@example.com",
        role="organizer"
    )

    organizer_two = create_user(
        client,
        "Delete Organizer Two",
        f"delete_org2_{uuid.uuid4().hex[:8]}@example.com",
        role="organizer"
    )

    event_response = client.post(
        "/events",
        headers=organizer_one["headers"],
        json={
            "name": "Protected Event",
            "location": "Islamabad",
            "capacity": 100
        }
    )

    assert event_response.status_code == 201

    event = event_response.json()

    response = client.delete(
        f"/events/{event['id']}",
        headers=organizer_two["headers"]
    )

    assert response.status_code == 403


def test_create_event_rejects_invalid_data(
    client,
    create_user
):
    organizer = create_user(
        client,
        "Validation Organizer",
        f"validation_{uuid.uuid4().hex[:8]}@example.com",
        role="organizer"
    )

    response = client.post(
        "/events",
        headers=organizer["headers"],
        json={
            "name": "AB",
            "location": "I",
            "capacity": 0
        }
    )

    assert response.status_code == 422
    

def test_create_ticket_type_rejects_invalid_data(
    client,
    create_event
):
    event_data = create_event(
        name="Ticket Validation Event",
        capacity=100
    )

    response = client.post(
        f"/events/{event_data['event']['id']}/ticket-types",
        headers=event_data["headers"],
        json={
            "name": "A",
            "price": -100,
            "quantity": 0
        }
    )

    assert response.status_code == 422
    

def test_create_reservation_rejects_invalid_quantity(
    client,
    create_event
):
    event_data = create_event(
        name="Reservation Validation Event",
        capacity=100
    )

    ticket_response = client.post(
        f"/events/{event_data['event']['id']}/ticket-types",
        headers=event_data["headers"],
        json={
            "name": "General",
            "price": 1000,
            "quantity": 20
        }
    )

    assert ticket_response.status_code == 201

    ticket_type = ticket_response.json()

    user = client.post(
        "/auth/register",
        json={
            "name": "Reservation Validation User",
            "email": f"reservation_validation_{uuid.uuid4().hex[:8]}@example.com",
            "password": "testpassword123"
        }
    )

    assert user.status_code == 201

    login_response = client.post(
        "/auth/login",
        json={
            "email": user.json()["email"],
            "password": "testpassword123"
        }
    )

    assert login_response.status_code == 200

    headers = {
        "Authorization": (
            f"Bearer {login_response.json()['access_token']}"
        )
    }

    response = client.post(
        "/reservations",
        headers=headers,
        json={
            "ticket_type_id": ticket_type["id"],
            "quantity": 0
        }
    )

    assert response.status_code == 422
    

def test_event_pagination_rejects_invalid_values(client):
    response = client.get(
        "/events?skip=-1&limit=101"
    )

    assert response.status_code == 422
    

def test_normal_user_cannot_create_ticket_type(
    client,
    create_event,
    create_user
):
    event_data = create_event(
        name="Protected Ticket Event",
        capacity=100
    )

    user = create_user(
        client,
        "Normal Ticket User",
        f"ticket_user_{uuid.uuid4().hex[:8]}@example.com"
    )

    response = client.post(
        f"/events/{event_data['event']['id']}/ticket-types",
        headers=user["headers"],
        json={
            "name": "VIP",
            "price": 2000,
            "quantity": 10
        }
    )

    assert response.status_code == 403
    

def test_cancelled_reservation_cannot_be_confirmed(
    client,
    create_event,
    create_user
):
    event_data = create_event(
        name="Cancelled Reservation Event",
        capacity=100
    )

    ticket_response = client.post(
        f"/events/{event_data['event']['id']}/ticket-types",
        headers=event_data["headers"],
        json={
            "name": "General",
            "price": 1000,
            "quantity": 20
        }
    )

    assert ticket_response.status_code == 201

    ticket_type = ticket_response.json()

    user = create_user(
        client,
        "Cancellation User",
        f"cancel_confirm_{uuid.uuid4().hex[:8]}@example.com"
    )

    reservation_response = client.post(
        "/reservations",
        headers=user["headers"],
        json={
            "ticket_type_id": ticket_type["id"],
            "quantity": 2
        }
    )

    assert reservation_response.status_code == 201

    reservation = reservation_response.json()

    cancel_response = client.put(
        f"/reservations/{reservation['id']}/cancel",
        headers=user["headers"]
    )

    assert cancel_response.status_code == 200

    confirm_response = client.put(
        f"/reservations/{reservation['id']}/confirm",
        headers=user["headers"]
    )

    assert confirm_response.status_code == 400
    
    
def test_get_nonexistent_event_returns_404(client):
    response = client.get("/events/999999")

    assert response.status_code == 404


def test_confirmed_reservation_reduces_available_capacity(client, create_event, create_user):
    result = create_event(capacity=10)
    headers = result["headers"]
    event_id = result["event"]["id"]

    ticket_response = client.post(
        f"/events/{event_id}/ticket-types",
        headers=headers,
        json={
            "name": "VIP Single",
            "price": 5000,
            "quantity": 1
        }
    )
    assert ticket_response.status_code == 201
    ticket_type_id = ticket_response.json()["id"]

    user1 = create_user(client, "User One", "user1_cap@example.com")
    user2 = create_user(client, "User Two", "user2_cap@example.com")

    # User 1 reserves the 1 available ticket
    res1 = client.post(
        "/reservations",
        headers=user1["headers"],
        json={
            "ticket_type_id": ticket_type_id,
            "quantity": 1
        }
    )
    assert res1.status_code == 201
    res1_id = res1.json()["id"]

    # User 1 confirms the reservation
    confirm_res = client.put(
        f"/reservations/{res1_id}/confirm",
        headers=user1["headers"]
    )
    assert confirm_res.status_code == 200
    assert confirm_res.json()["status"] == "confirmed"

    # User 2 attempts to reserve the ticket, which should fail
    res2 = client.post(
        "/reservations",
        headers=user2["headers"],
        json={
            "ticket_type_id": ticket_type_id,
            "quantity": 1
        }
    )
    assert res2.status_code == 400
    assert "0 tickets available" in res2.json()["detail"]


def test_duplicate_email_registration_fails(client):
    email = f"dup_{uuid.uuid4().hex[:8]}@example.com"
    res1 = client.post(
        "/auth/register",
        json={"name": "First User", "email": email, "password": "password123"}
    )
    assert res1.status_code == 201

    res2 = client.post(
        "/auth/register",
        json={"name": "Duplicate User", "email": email, "password": "password123"}
    )
    assert res2.status_code == 400
    assert "already registered" in res2.json()["detail"]


def test_login_with_invalid_credentials_fails(client, create_user):
    user = create_user(client, "Login User", f"login_{uuid.uuid4().hex[:8]}@example.com", password="correctpassword123")

    # Wrong password
    res1 = client.post(
        "/auth/login",
        json={"email": "login_user@example.com", "password": "wrongpassword123"}
    )
    assert res1.status_code == 401
    assert "Invalid email or password" in res1.json()["detail"]

    # Non-existent email
    res2 = client.post(
        "/auth/login",
        json={"email": "nonexistent_email_12345@example.com", "password": "somepassword123"}
    )
    assert res2.status_code == 401
    assert "Invalid email or password" in res2.json()["detail"]


def test_invalid_registration_data_rejected(client):
    # Empty / whitespace name
    res1 = client.post(
        "/auth/register",
        json={"name": "   ", "email": "valid_email@example.com", "password": "password123"}
    )
    assert res1.status_code == 422

    # Short password
    res2 = client.post(
        "/auth/register",
        json={"name": "Valid Name", "email": "valid_email2@example.com", "password": "123"}
    )
    assert res2.status_code == 422


def test_background_scheduler_expire_reservations_job(client, create_event, create_user):
    from datetime import datetime, timedelta, timezone
    from tests.conftest import TestingSessionLocal
    from app import models
    from app.scheduler import expire_reservations

    result = create_event(capacity=20)
    event_id = result["event"]["id"]
    headers = result["headers"]

    ticket_res = client.post(
        f"/events/{event_id}/ticket-types",
        headers=headers,
        json={"name": "Standard", "price": 1000, "quantity": 10}
    )
    ticket_id = ticket_res.json()["id"]

    user = create_user(client, "Sched User", f"sched_{uuid.uuid4().hex[:8]}@example.com")
    res = client.post(
        "/reservations",
        headers=user["headers"],
        json={"ticket_type_id": ticket_id, "quantity": 2}
    )
    reservation_id = res.json()["id"]

    # Manually set expires_at in the past
    db = TestingSessionLocal()
    reservation = db.query(models.Reservation).filter(models.Reservation.id == reservation_id).first()
    reservation.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=5)
    db.commit()
    db.close()

    # Trigger scheduler job
    expire_reservations()

    # Verify status is now expired in database
    db = TestingSessionLocal()
    updated_res = db.query(models.Reservation).filter(models.Reservation.id == reservation_id).first()
    assert updated_res.status == "expired"
    db.close()


def test_invalid_booking_reference_returns_404(client, create_user):
    user = create_user(client, "Lookup User", f"lookup_{uuid.uuid4().hex[:8]}@example.com")
    res = client.get(
        "/bookings/EVT-NONEXISTENT",
        headers=user["headers"]
    )
    assert res.status_code == 404


def test_nonexistent_ticket_availability_returns_404(client):
    res = client.get("/ticket-types/999999/availability")
    assert res.status_code == 404


def test_organizer_cannot_delete_another_organizers_ticket_type(client, create_user, create_event):
    org1 = create_user(client, "Org One", f"org1_{uuid.uuid4().hex[:8]}@example.com", role="organizer")
    org2 = create_user(client, "Org Two", f"org2_{uuid.uuid4().hex[:8]}@example.com", role="organizer")

    event_res = client.post(
        "/events",
        headers=org1["headers"],
        json={"name": "Org 1 Event", "location": "Lahore", "capacity": 50}
    )
    event_id = event_res.json()["id"]

    ticket_res = client.post(
        f"/events/{event_id}/ticket-types",
        headers=org1["headers"],
        json={"name": "Early Bird", "price": 500, "quantity": 20}
    )
    ticket_id = ticket_res.json()["id"]

    # Org 2 attempts to delete Org 1's ticket type
    delete_res = client.delete(
        f"/ticket-types/{ticket_id}",
        headers=org2["headers"]
    )
    assert delete_res.status_code == 403


def test_cannot_delete_event_with_ticket_types(client, create_event):
    result = create_event(capacity=50)
    event_id = result["event"]["id"]
    headers = result["headers"]

    client.post(
        f"/events/{event_id}/ticket-types",
        headers=headers,
        json={"name": "General", "price": 1000, "quantity": 10}
    )

    # Attempt to delete event
    delete_res = client.delete(
        f"/events/{event_id}",
        headers=headers
    )
    assert delete_res.status_code == 400
    assert "ticket types already exist" in delete_res.json()["detail"]


def test_cannot_delete_ticket_type_with_existing_reservations(client, create_event, create_user):
    result = create_event(capacity=50)
    event_id = result["event"]["id"]
    headers = result["headers"]

    ticket_res = client.post(
        f"/events/{event_id}/ticket-types",
        headers=headers,
        json={"name": "General Admission", "price": 1000, "quantity": 10}
    )
    ticket_id = ticket_res.json()["id"]

    user = create_user(client, "Buyer", f"buyer_{uuid.uuid4().hex[:8]}@example.com")
    client.post(
        "/reservations",
        headers=user["headers"],
        json={"ticket_type_id": ticket_id, "quantity": 2}
    )

    # Attempt to delete ticket type while reservation exists
    delete_res = client.delete(
        f"/ticket-types/{ticket_id}",
        headers=headers
    )
    assert delete_res.status_code == 400
    assert "reservations already exist" in delete_res.json()["detail"]


def test_organizer_reservation_filter_rejects_invalid_status(client, create_user):
    organizer = create_user(
        client,
        "Org Status Tester",
        f"org_status_{uuid.uuid4().hex[:8]}@example.com",
        role="organizer"
    )

    response = client.get(
        "/organizer/reservations?status=invalid_status",
        headers=organizer["headers"]
    )
    assert response.status_code == 422


def test_confirmed_reservation_cannot_be_confirmed_again(client, create_event, create_user):
    result = create_event(capacity=20)
    event_id = result["event"]["id"]
    headers = result["headers"]

    ticket_res = client.post(
        f"/events/{event_id}/ticket-types",
        headers=headers,
        json={"name": "Standard", "price": 1000, "quantity": 10}
    )
    ticket_id = ticket_res.json()["id"]

    user = create_user(client, "Confirm Once User", f"confirm_once_{uuid.uuid4().hex[:8]}@example.com")
    res = client.post(
        "/reservations",
        headers=user["headers"],
        json={"ticket_type_id": ticket_id, "quantity": 1}
    )
    assert res.status_code == 201
    res_id = res.json()["id"]

    # First confirmation succeeds
    first_confirm = client.put(
        f"/reservations/{res_id}/confirm",
        headers=user["headers"]
    )
    assert first_confirm.status_code == 200
    assert first_confirm.json()["status"] == "confirmed"

    # Second confirmation must fail
    second_confirm = client.put(
        f"/reservations/{res_id}/confirm",
        headers=user["headers"]
    )
    assert second_confirm.status_code == 400
    assert "Only active reservations can be confirmed" in second_confirm.json()["detail"]