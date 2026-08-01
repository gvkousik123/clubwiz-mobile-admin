Create event sample payload : 
{
  "title": "Saturday Night Live",
  "description": "Bollywood + Hip Hop night with resident DJ and live performers",
  "startDateTime": "2026-07-12T20:00:00",
  "endDateTime": "2026-07-13T02:00:00",
  "location": "Ground Floor, Main Hall",
  "locationText": "ClubWiz Lounge, Mumbai",
  "locationMap": { "lat": 19.076, "lng": 72.8777 },
  "clubId": "6a44162cc2ba2f0f83a722a3",

  "maxAttendees": 500,
  "hasLimitedTickets": true,
  "totalTickets": 500,
  "isPublic": true,
  "requiresApproval": false,

  "eventArtistName": "DJ Aakash",
  "aboutEventArtist": "Resident DJ, 8 years experience",
  "musicGenre": "Hip Hop",
  "instagramHandle": "@djaakash",
  "spotifyHandle": "djaakash",
  "eventOrganizer": "Nightlife Curators Pvt Ltd",

  "maleStagEntry":   { "price": 500,  "fee": 300, "description": "General male stag entry" },
  "femaleStagEntry": { "price": 500,  "fee": 300, "description": "General female stag entry" },
  "coupleEntry":     { "price": 1000, "fee": 600, "description": "General couple entry" },
  "freeMaleStagPerCoupleEnabled": true,

  "earlyBirdEnabled": true,
  "earlyBirdEndTime": "19:42:00",
  "earlyBirdMaleStagEntry":   { "price": 400, "fee": 250, "description": "Early bird male stag entry" },
  "earlyBirdFemaleStagEntry": { "price": 400, "fee": 250, "description": "Early bird female stag entry" },
  "earlyBirdCoupleEntry":     { "price": 800, "fee": 500, "description": "Early bird couple entry" },
  "earlyBirdFreeMaleStagPerCoupleEnabled": true,

  "eventImage": {
    "name": "poster.jpg",
    "contentType": "image/jpeg",
    "url": "https://cdn.example.com/events/poster.jpg",
    "type": "poster"
  },
  "eventReel": {
    "name": "reel.mp4",
    "contentType": "video/mp4",
    "url": "https://cdn.example.com/events/reel.mp4",
    "type": "reel"
  },
  "eventOrganizerLogo": {
    "name": "organizer-logo.jpg",
    "contentType": "image/jpeg",
    "url": "https://cdn.example.com/events/organizer-logo.jpg",
    "type": "organizer-logo"
  },
  "galleryImages": [
    {
      "name": "gallery-1.jpg",
      "contentType": "image/jpeg",
      "url": "https://cdn.example.com/events/gallery-1.jpg",
      "type": "gallery"
    }
  ],
  "performerImages": [
    {
      "name": "performer-1.jpg",
      "contentType": "image/jpeg",
      "url": "https://cdn.example.com/events/performer-1.jpg",
      "type": "performer"
    }
  ]
}

Edit event sample payload : 
{
  "title": "Saturday Night Live (Updated)",
  "description": "Updated: Bollywood + Hip Hop night with a new guest performer",
  "startDateTime": "2026-07-12T20:00:00",
  "endDateTime": "2026-07-13T02:00:00",
  "location": "Ground Floor, Main Hall",
  "locationText": "ClubWiz Lounge, Mumbai",
  "locationMap": { "lat": 19.076, "lng": 72.8777 },

  "maxAttendees": 600,
  "hasLimitedTickets": true,
  "totalTickets": 600,
  "isPublic": true,
  "requiresApproval": false,

  "eventArtistName": "DJ Aakash",
  "aboutEventArtist": "Resident DJ, 8 years experience",
  "musicGenre": "Hip Hop",
  "instagramHandle": "@djaakash",
  "spotifyHandle": "djaakash",
  "eventOrganizer": "Nightlife Curators Pvt Ltd",

  "maleStagEntry":   { "price": 600,  "fee": 350, "description": "General male stag entry" },
  "femaleStagEntry": { "price": 600,  "fee": 350, "description": "General female stag entry" },
  "coupleEntry":     { "price": 1200, "fee": 700, "description": "General couple entry" },
  "freeMaleStagPerCoupleEnabled": true,

  "earlyBirdEnabled": true,
  "earlyBirdEndTime": "20:00:00",
  "earlyBirdMaleStagEntry":   { "price": 450, "fee": 280, "description": "Early bird male stag entry" },
  "earlyBirdFemaleStagEntry": { "price": 450, "fee": 280, "description": "Early bird female stag entry" },
  "earlyBirdCoupleEntry":     { "price": 900, "fee": 550, "description": "Early bird couple entry" },
  "earlyBirdFreeMaleStagPerCoupleEnabled": false,

  "eventImage": {
    "name": "poster-updated.jpg",
    "contentType": "image/jpeg",
    "url": "https://cdn.example.com/events/poster-updated.jpg",
    "type": "poster"
  },
  "eventReel": {
    "name": "reel-updated.mp4",
    "contentType": "video/mp4",
    "url": "https://cdn.example.com/events/reel-updated.mp4",
    "type": "reel"
  },
  "eventOrganizerLogo": {
    "name": "organizer-logo-updated.jpg",
    "contentType": "image/jpeg",
    "url": "https://cdn.example.com/events/organizer-logo-updated.jpg",
    "type": "organizer-logo"
  },
  "galleryImages": [
    {
      "name": "gallery-1.jpg",
      "contentType": "image/jpeg",
      "url": "https://cdn.example.com/events/gallery-1.jpg",
      "type": "gallery"
    }
  ],
  "performerImages": [
    {
      "name": "performer-1.jpg",
      "contentType": "image/jpeg",
      "url": "https://cdn.example.com/events/performer-1.jpg",
      "type": "performer"
    }
  ]
}

Tried with swagger below is the response for the request I shared above : 

{
  "id": "6a4d20fddd1cf0225c26aa43",
  "title": "Saturday Night Live",
  "description": "Bollywood + Hip Hop night with resident DJ and live performers",
  "startDateTime": "2026-07-12T20:00:00",
  "endDateTime": "2026-07-13T02:00:00",
  "location": "DABO BAR AND KITCHEN",
  "locationText": "Plot No. 15, Bandra Reclamation, Near Worli Sea Link, Mumbai, Maharashtra - 400050",
  "locationMap": {
    "lat": 19.0176,
    "lng": 72.8298
  },
  "clubId": "69ee0606877f2b6a9a7609e6",
  "maxAttendees": 500,
  "isPublic": true,
  "requiresApproval": false,
  "eventArtistName": "DJ Aakash",
  "aboutEventArtist": "Resident DJ, 8 years experience",
  "instagramHandle": "@djaakash",
  "spotifyHandle": "djaakash",
  "musicGenre": "Hip Hop",
  "eventOrganizer": "Nightlife Curators Pvt Ltd",
  "hasLimitedTickets": true,
  "totalTickets": 500,
  "freeMaleStagPerCoupleEnabled": true,
  "guestListPricing": {
    "enabled": false,
    "cutoffTime": "19:42:00",
    "maleStagEntry": {
      "price": 400,
      "fee": 250,
      "description": "Early bird male stag entry"
    },
    "femaleStagEntry": {
      "price": 400,
      "fee": 250,
      "description": "Early bird female stag entry"
    },
    "coupleEntry": {
      "price": 800,
      "fee": 500,
      "description": "Early bird couple entry"
    },
    "freeMaleStagPerCoupleEnabled": true
  },
  "generalPricing": {
    "enabled": true,
    "cutoffTime": null,
    "maleStagEntry": {
      "price": 500,
      "fee": 300,
      "description": "General male stag entry"
    },
    "femaleStagEntry": {
      "price": 500,
      "fee": 300,
      "description": "General female stag entry"
    },
    "coupleEntry": {
      "price": 1000,
      "fee": 600,
      "description": "General couple entry"
    },
    "freeMaleStagPerCoupleEnabled": true
  },
  "imageUrl": "https://cdn.example.com/events/poster.jpg",
  "reelUrl": "https://cdn.example.com/events/reel.mp4",
  "eventOrganizerLogo": "https://cdn.example.com/events/organizer-logo.jpg",
  "galleryImages": [
    "https://cdn.example.com/events/gallery-1.jpg"
  ],
  "performerImages": [
    "https://cdn.example.com/events/performer-1.jpg"
  ]
}