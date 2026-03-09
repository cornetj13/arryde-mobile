import { gql } from '@apollo/client';

// ============ RIDER QUERIES ============

// Get all riders.
export const GET_ALL_RIDERS = gql`
  query GetAllRiders {
    getAllRiders {
      id
      email
      name
      phoneNumber
      currentRideId
      completedRides
      homeAddress
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
      isOnDuty
      riderQueue
      driverNextAvailableAt
      profilePicture
      createdAt
      updatedAt
    }
  }
`;

// Get a single favorite driver from rider's favorite drivers.
export const GET_SINGLE_FAVORITE_DRIVER = gql`
  query GetSingleFavoriteDriver($riderId: ID!, $driverId: ID!) {
    getSingleFavoriteDriver(riderId: $riderId, driverId: $driverId) {
      id
      email
      name
      phoneNumber
      licensePlate
      carMake
      carModel
      carColor
      isOnDuty
      riderQueue
      driverNextAvailableAt
      profilePicture
      createdAt
      updatedAt
    }
  }
`;

// Get rider's completed rides.
export const GET_RIDER_COMPLETED_RIDES = gql`
  query GetRiderCompletedRides($id: ID!) {
    getRiderCompletedRides(id: $id) {
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

// Get all drivers.
export const GET_ALL_DRIVERS = gql`
  query GetAllDrivers {
    getAllDrivers {
      id
      email
      name
      phoneNumber
      licensePlate
      carMake
      carModel
      carColor
      isOnDuty
      currentRideId
      riderQueue
      driverNextAvailableAt
      profilePicture
      createdAt
      updatedAt
    }
  }
`;

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

// Get available drivers.
export const GET_AVAILABLE_DRIVERS = gql`
  query GetAvailableDrivers {
    getAvailableDrivers {
      id
      email
      name
      phoneNumber
      licensePlate
      carMake
      carModel
      carColor
      isOnDuty
      currentRideId
      riderQueue
      driverNextAvailableAt
      profilePicture
      createdAt
      updatedAt
    }
  }
`;

// Get unavailable drivers.
export const GET_UNAVAILABLE_DRIVERS = gql`
  query GetUnavailableDrivers {
    getUnavailableDrivers {
      id
      email
      name
      phoneNumber
      licensePlate
      carMake
      carModel
      carColor
      isOnDuty
      currentRideId
      riderQueue
      driverNextAvailableAt
      profilePicture
      createdAt
      updatedAt
    }
  }
`;

// Get a driver's availability.
export const GET_DRIVER_NEXT_AVAILABLE_AT = gql`
  query GetDriverNextAvailableAt($id: ID!) {
    getDriverNextAvailableAt(id: $id) {
      driverNextAvailableAt
    }
  }
`;

// Get driver's completed rides.
export const GET_DRIVER_COMPLETED_RIDES = gql`
  query GetDriverCompletedRides($id: ID!) {
    getDriverCompletedRides(id: $id) {
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

// Get all rides.
export const GET_ALL_RIDES = gql`
  query GetAllRides {
    getAllRides {
      id
      riderId
      riderName
      riderProfilePicture
      phoneNumber
      passengers
      pickUp
      dropOff
      pickUpTime
      date
      bidAmount
      waitingTime
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
      dropOff
      pickUpTime
      date
      bidAmount
      waitingTime
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
      dropOff
      pickUpTime
      date
      bidAmount
      waitingTime
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
      dropOff
      pickUpTime
      date
      bidAmount
      waitingTime
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

// Get completed rides.
export const GET_COMPLETED_RIDES = gql`
  query GetCompletedRides {
    getCompletedRides {
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
      waitingTime
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

// Get expired rides.
export const GET_EXPIRED_RIDES = gql`
  query GetExpiredRides {
    getExpiredRides {
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
      waitingTime
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

// Look up an invite code (for signup page).
export const LOOKUP_INVITE_CODE = gql`
  query LookupInviteCode($code: String!) {
    lookupInviteCode(code: $code) {
      valid
      driverId
      driverName
    }
  }
`;
