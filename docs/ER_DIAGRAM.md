# IMovies ER Diagram

The diagram represents the current Mongoose model relationships. Seat inventory is embedded inside each `Showtime` because a seat's availability is scoped to a specific screening. A booking also stores selected seat numbers and a small display snapshot of movie/cinema details to preserve the confirmation screen if catalogue data changes later.

```mermaid
erDiagram
    USER ||--o{ BOOKING : makes
    MOVIE ||--o{ SHOWTIME : has
    CINEMA ||--o{ SHOWTIME : hosts
    SHOWTIME ||--o{ BOOKING : receives

    USER {
        ObjectId _id PK
        string name
        string email UK
        string passwordHash
        string role
        datetime createdAt
    }
    MOVIE {
        ObjectId _id PK
        string title
        string description
        string posterUrl
        string_array genre
        string_array language
        int durationMinutes
        float rating
        string status
    }
    CINEMA {
        ObjectId _id PK
        string name
        string location
        string city
        string_array facilities
        string_array screens
        boolean isActive
    }
    SHOWTIME {
        ObjectId _id PK
        ObjectId movie FK
        ObjectId cinema FK
        string screenName
        datetime startTime
        datetime endTime
        array seats_embedded
        boolean isActive
    }
    BOOKING {
        ObjectId _id PK
        string bookingReference UK
        ObjectId user FK
        ObjectId showtime FK
        string_array seatNumbers
        number totalAmount
        string status
        string paymentMode
        string paymentStatus
        datetime createdAt
    }
```

## Relationship notes

- A `User` can create multiple `Booking` documents.
- A `Movie` can have multiple `Showtime` documents.
- A `Cinema` hosts multiple `Showtime` documents.
- Each `Showtime` embeds a unique seat inventory for that screening and can have multiple bookings over time, including cancelled bookings.
- `Booking.seatNumbers` stores the seats in that reservation; the live seat status is tracked on the showtime document.
- `passwordHash` is excluded from normal user serialisation and selected explicitly only when validating a login.
