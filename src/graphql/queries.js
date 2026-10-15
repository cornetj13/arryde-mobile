import { gql } from '@apollo/client';

// ============ RIDER QUERIES ============

// Get single rider.
export const GET_SINGLE_RIDER = gql`
  query GetRider($id: ID!) {
    getRider(id: $id) {
      id
      email
      name
      phoneNumber
      currentRideId
      completedRides
      homeAddress
      workAddress
      requestedRidesTotal
      acceptedRidesTotal
      canceledByRiderRidesTotal
      canceledByDriverRidesTotal
      completedRidesTotal
      expiredRidesTotal
      profilePicture
      createdAt
      updatedAt
      FavoriteDrivers {
        id
        email
        name
        phoneNumber
        licensePlate
        carMake
        carModel
        carColor
        seats
        isOnDuty
        riderQueue
        driverNextAvailableAt
        profilePicture
        createdAt
        updatedAt
      }
    }
  }
`;

// Get a rider's favorite drivers.
export const GET_FAVORITE_DRIVERS = gql`
  query GetFavoriteDrivers($riderId: ID!) {
    getFavoriteDrivers(riderId: $riderId) {
      id
      email
      name
      phoneNumber
      licensePlate
      carMake
      carModel
      carColor
      seats
      isOnDuty
      riderQueue
      driverNextAvailableAt
      profilePicture
      createdAt
      updatedAt
    }
  }
`;

// Get rider's ride history.
export const GET_RIDER_RIDE_HISTORY = gql`
  query GetRiderRideHistory($id: ID!) {
    getRiderRideHistory(id: $id) {
      id
      riderId
      riderName
      phoneNumber
      passengers
      pickUp
      dropOff
      pickUpTime
      date
      bidAmount
      requestedDriverIds
      driverId
      driverName
      isRequested
      isAccepted
      isCanceled
      isCompleted
      isExpired
      canceledAt
      canceledBy
      completedAt
      expiredAt
      createdAt
      updatedAt
    }
  }
`;

// ============ DRIVER QUERIES ============

// Get single driver.
export const GET_SINGLE_DRIVER = gql`
  query GetDriver($id: ID!) {
    getDriver(id: $id) {
      id
      email
      name
      phoneNumber
      licensePlate
      carMake
      carModel
      carColor
      seats
      isOnDuty
      currentRideId
      riderQueue
      driverNextAvailableAt
      acceptedRidesTotal
      canceledByRiderRidesTotal
      canceledByDriverRidesTotal
      completedRidesTotal
      profilePicture
      createdAt
      updatedAt
    }
  }
`;

// Get ALL drivers (on and off duty). Used for the add-favorites list —
// favoriting a driver must not depend on them being on duty right now.
export const GET_ALL_DRIVERS = gql`
  query GetAllDrivers {
    getAllDrivers {
      id
      name
      carMake
      carModel
      carColor
      seats
      isOnDuty
      riderQueue
      driverNextAvailableAt
    }
  }
`;

// Get driver's ride history.
export const GET_DRIVER_RIDE_HISTORY = gql`
  query GetDriverRideHistory($id: ID!) {
    getDriverRideHistory(id: $id) {
      id
      riderId
      riderName
      phoneNumber
      passengers
      pickUp
      dropOff
      pickUpTime
      date
      bidAmount
      requestedDriverIds
      driverId
      driverName
      isRequested
      isAccepted
      isCanceled
      isCompleted
      isExpired
      canceledAt
      canceledBy
      completedAt
      expiredAt
      createdAt
      updatedAt
    }
  }
`;

// ============ RIDE QUERIES ============

// Get single ride.
export const GET_SINGLE_RIDE = gql`
  query GetRide($id: ID!) {
    getRide(id: $id) {
      id
      riderId
      riderName
      riderProfilePicture
      phoneNumber
      passengers
      pickUp
      pickUpLat
      pickUpLng
      dropOff
      dropOffLat
      dropOffLng
      pickUpTime
      date
      bidAmount
      waitingTime
      queuePosition
      tripDistanceMeters
      tripDurationSeconds
      tripEstimateSource
      requestedDriverIds
      driverId
      driverName
      isRequested
      isAccepted
      isCanceled
      isCompleted
      isExpired
      canceledBy
      completedAt
      expiredAt
      createdAt
      updatedAt
    }
  }
`;

// Get active rides.
export const GET_ACTIVE_RIDES = gql`
  query GetActiveRides($driverId: Int) {
    getActiveRides(driverId: $driverId) {
      id
      riderId
      riderName
      riderProfilePicture
      phoneNumber
      passengers
      pickUp
      pickUpLat
      pickUpLng
      dropOff
      dropOffLat
      dropOffLng
      pickUpTime
      date
      bidAmount
      waitingTime
      queuePosition
      tripDistanceMeters
      tripDurationSeconds
      tripEstimateSource
      requestedDriverIds
      driverId
      driverName
      isRequested
      isAccepted
      isCanceled
      isCompleted
      isExpired
      createdAt
      updatedAt
    }
  }
`;

// Get accepted rides.
export const GET_ACCEPTED_RIDES = gql`
  query GetAcceptedRides($driverId: ID!) {
    getAcceptedRides(driverId: $driverId) {
      id
      riderId
      riderName
      riderProfilePicture
      phoneNumber
      passengers
      pickUp
      pickUpLat
      pickUpLng
      dropOff
      dropOffLat
      dropOffLng
      pickUpTime
      date
      bidAmount
      waitingTime
      queuePosition
      tripDistanceMeters
      tripDurationSeconds
      tripEstimateSource
      driverId
      driverName
      isRequested
      isAccepted
      isCanceled
      isCompleted
      isExpired
      canceledBy
      completedAt
      expiredAt
      createdAt
      updatedAt
    }
  }
`;

// ============ INVITE QUERIES ============

// Get driver's invite code.
export const GET_DRIVER_INVITE_CODE = gql`
  query GetDriverInviteCode($driverId: ID!) {
    getDriverInviteCode(driverId: $driverId) {
      id
      code
      driverId
      usageCount
      createdAt
    }
  }
`;


// Driving distance/time between two points. The server answers with Google
// when it has a key, straight-line × road factor otherwise (source says
// which). Drivers use it for "2.1 mi · 7 min to pickup".
export const GET_DRIVE_ESTIMATE = gql`
  query GetDriveEstimate($originLat: Float!, $originLng: Float!, $destLat: Float!, $destLng: Float!) {
    getDriveEstimate(originLat: $originLat, originLng: $originLng, destLat: $destLat, destLng: $destLng) {
      distanceMeters
      durationSeconds
      source
    }
  }
`;
